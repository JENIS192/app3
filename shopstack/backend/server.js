require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const pool = require('./src/config/db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // behind AWS ALB / Nginx
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean) }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check for AWS ALB / target groups
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on our side' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
