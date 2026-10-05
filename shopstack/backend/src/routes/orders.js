const router = require('express').Router();
const pool = require('../config/db');
const { auth, asyncHandler, httpError } = require('../middleware/auth');

// Place an order. Prices and stock are always read from the database, never trusted from the client.
router.post('/', auth, asyncHandler(async (req, res) => {
  const { items, shipping_name, shipping_address } = req.body;
  if (!Array.isArray(items) || !items.length) throw httpError(400, 'Your cart is empty');
  if (!shipping_name?.trim() || !shipping_address?.trim())
    throw httpError(400, 'Shipping name and address are required');

  // Merge duplicate lines and lock rows in id order to avoid deadlocks
  const merged = new Map();
  for (const it of items) {
    const qty = parseInt(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw httpError(400, 'Invalid quantity');
    merged.set(Number(it.id), (merged.get(Number(it.id)) || 0) + qty);
  }
  const lines = [...merged.entries()].sort((a, b) => a[0] - b[0]);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const resolved = [];
    for (const [id, qty] of lines) {
      const [rows] = await conn.query('SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE', [id]);
      const p = rows[0];
      if (!p) throw httpError(400, `Product ${id} no longer exists`);
      if (p.stock < qty) throw httpError(409, `Only ${p.stock} left of ${p.name}`);
      total += p.price * qty;
      resolved.push({ p, qty });
    }
    total = Math.round(total * 100) / 100;

    const [o] = await conn.query(
      'INSERT INTO orders (user_id, total, shipping_name, shipping_address) VALUES (?,?,?,?)',
      [req.user.id, total, shipping_name.trim(), shipping_address.trim()]);
    for (const { p, qty } of resolved) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?,?,?,?,?)',
        [o.insertId, p.id, p.name, p.price, qty]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, p.id]);
    }
    await conn.commit();
    res.status(201).json({ id: o.insertId, total });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/', auth, asyncHandler(async (req, res) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  if (!orders.length) return res.json([]);
  const [items] = await pool.query(
    'SELECT * FROM order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
  res.json(orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })));
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!rows[0]) throw httpError(404, 'Order not found');
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [rows[0].id]);
  res.json({ ...rows[0], items });
}));

module.exports = router;
