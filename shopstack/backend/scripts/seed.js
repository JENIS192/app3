// Creates the database (if missing), tables, an admin user and sample products.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const img = (seed) => `https://picsum.photos/seed/${seed}/640/480`;
const products = [
  ['Aero Running Shoes', 'Lightweight mesh trainers with a cushioned sole for daily runs.', 3499, 40, 'Fashion', img('shoes')],
  ['Canvas Backpack 25L', 'Water-resistant daypack with a padded laptop sleeve.', 1899, 60, 'Fashion', img('backpack')],
  ['Classic Analog Watch', 'Stainless steel case with a genuine leather strap.', 2799, 25, 'Fashion', img('watch')],
  ['Noise-Cancelling Headphones', 'Over-ear Bluetooth headphones with 30-hour battery life.', 5999, 30, 'Electronics', img('headphones')],
  ['Mechanical Keyboard', 'Compact 75% layout with hot-swappable switches.', 4299, 35, 'Electronics', img('keyboard')],
  ['27" 4K Monitor', 'IPS panel, 60 Hz, USB-C with 65 W power delivery.', 21999, 12, 'Electronics', img('monitor')],
  ['Portable SSD 1TB', 'Pocket-sized NVMe drive with up to 1000 MB/s transfers.', 7499, 50, 'Electronics', img('ssd')],
  ['Smart LED Desk Lamp', 'Adjustable colour temperature with touch controls.', 1499, 70, 'Home', img('lamp')],
  ['Ceramic Pour-Over Set', 'Dripper, server and two cups for slow coffee mornings.', 1299, 45, 'Home', img('coffee')],
  ['Cotton Bedsheet Set', 'Queen size, 300 thread count, two pillow covers included.', 2199, 38, 'Home', img('bedsheet')],
  ['Stainless Steel Bottle', 'Keeps drinks cold for 24 hours or hot for 12.', 799, 120, 'Sports', img('bottle')],
  ['Yoga Mat 6mm', 'Non-slip surface with a carrying strap.', 999, 80, 'Sports', img('yoga')],
  ['Adjustable Dumbbell Pair', 'Quick-change weights from 2 to 20 kg each.', 8999, 15, 'Sports', img('dumbbell')],
  ['The Pragmatic Programmer', 'A classic guide to practical software craftsmanship.', 699, 90, 'Books', img('book1')],
  ['Designing Data-Intensive Applications', 'Principles behind reliable, scalable systems.', 1299, 55, 'Books', img('book2')],
  ['Linux Command Line Handbook', 'Hands-on shell, scripting and sysadmin essentials.', 549, 100, 'Books', img('book3')],
];

(async () => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  const conn = await mysql.createConnection({
    host: DB_HOST, port: Number(DB_PORT || 3306), user: DB_USER, password: DB_PASSWORD,
    multipleStatements: true,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4`);
  await conn.query(`USE \`${DB_NAME}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8'));

  const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM products');
  if (n === 0) {
    await conn.query('INSERT INTO products (name, description, price, stock, category, image_url) VALUES ?', [products]);
    console.log(`Inserted ${products.length} sample products`);
  } else console.log('Products already exist, skipping sample data');

  const [admin] = await conn.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (!admin.length) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await conn.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', ?, ?, 'admin')", [ADMIN_EMAIL, hash]);
    console.log(`Created admin user ${ADMIN_EMAIL}`);
  }
  await conn.end();
  console.log('Database ready');
})().catch((e) => { console.error(e); process.exit(1); });
