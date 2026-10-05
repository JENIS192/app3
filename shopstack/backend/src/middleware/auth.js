const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { auth, adminOnly, asyncHandler, httpError };
