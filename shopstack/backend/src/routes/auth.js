const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { auth, asyncHandler, httpError } = require('../middleware/auth');

const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Enter a valid email address');
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters');

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (exists.length) throw httpError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name.trim(), email.toLowerCase(), hash]);
  const user = { id: r.insertId, name: name.trim(), email: email.toLowerCase(), role: 'customer' };
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    throw httpError(401, 'Incorrect email or password');
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  if (!rows[0]) throw httpError(404, 'User not found');
  res.json({ user: rows[0] });
}));

module.exports = router;
