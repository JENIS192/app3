const router = require('express').Router();
const pool = require('../config/db');
const { auth, adminOnly, asyncHandler, httpError } = require('../middleware/auth');

const SORTS = {
  newest: 'created_at DESC',
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  name: 'name ASC',
};

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 48);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.category) {
    where.push('category = ?');
    params.push(req.query.category);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderBy = SORTS[req.query.sort] || SORTS.newest;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products ${w}`, params);
  const [items] = await pool.query(
    `SELECT * FROM products ${w} ORDER BY ${orderBy}, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category');
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows[0]) throw httpError(404, 'Product not found');
  res.json(rows[0]);
}));

// ---- Admin-only product management ----
function validate(b) {
  if (!b.name || !b.category || b.price == null) throw httpError(400, 'Name, category and price are required');
  if (Number(b.price) < 0 || Number(b.stock) < 0) throw httpError(400, 'Price and stock cannot be negative');
}

router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  validate(req.body);
  const { name, description = '', price, stock = 0, category, image_url = '' } = req.body;
  const [r] = await pool.query(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?,?,?,?,?,?)',
    [name, description, price, stock, category, image_url]);
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  validate(req.body);
  const { name, description = '', price, stock = 0, category, image_url = '' } = req.body;
  const [r] = await pool.query(
    'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=? WHERE id=?',
    [name, description, price, stock, category, image_url, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Product not found');
  res.json({ ok: true });
}));

router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const [r] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Product not found');
  res.json({ ok: true });
}));

module.exports = router;
