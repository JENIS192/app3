# Kart: 3-tier e-commerce (React + Node.js + MySQL)

```
Browser ──► Frontend (Vite + React) ──► Backend (Node.js / Express) ──► MySQL (local or AWS RDS)
            frontend/  (.env)            backend/  (.env, port 5000)     database/schema.sql
```

## Features
Product browsing with search, category filter, sort and pagination · product detail · cart (saved in the browser) ·
sign up / log in (JWT, bcrypt) · checkout with a stock-safe database transaction · order history ·
admin-only product API (create / update / delete) · `/api/health` for load balancers.

Prices and stock are always re-read from MySQL at checkout, so the client can't change what it pays.

## Environment files (one per tier)
| File | Key variables |
|---|---|
| `backend/.env` | `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| `frontend/.env` | `VITE_API_URL`, `VITE_APP_NAME` |

Change `DB_PASSWORD` and `JWT_SECRET` before running. Generate a secret with `openssl rand -hex 32`.
Vite reads `VITE_*` values **at build time**, so rebuild the frontend after editing `frontend/.env`.

## Run locally
```bash
# 1. Backend
cd backend
npm install
npm run seed      # creates the database, tables, admin user and 16 sample products
npm run dev       # http://localhost:5000/api/health

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev       # http://localhost:5173
```
Admin login after seeding: the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`.

## Deploy on AWS
1. **Database: RDS MySQL.** Create a MySQL 8 instance (private, not publicly accessible). Its security group allows port 3306 only from the backend's security group.
2. **Backend: EC2 (Ubuntu).**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm git nginx
   cd backend && npm install --omit=dev
   # edit .env: DB_HOST=<rds-endpoint>, DB_SSL=true, NODE_ENV=production,
   #            CORS_ORIGIN=https://<your-frontend-domain>
   npm run seed                       # once
   sudo npm i -g pm2 && pm2 start server.js --name shop-api && pm2 save && pm2 startup
   ```
   Open port 5000 to the ALB or Nginx only. Use `/api/health` as the target group health check.
3. **Frontend: build and host.**
   ```bash
   cd frontend
   # edit .env: VITE_API_URL=https://<your-api-domain>/api
   npm install && npm run build       # outputs dist/
   ```
   Host `dist/` on **S3 + CloudFront** (set the error page for 403/404 to `/index.html` so React Router works),
   or serve it from Nginx on EC2:
   ```nginx
   server {
     listen 80;
     root /var/www/shop;                      # copy frontend/dist/* here
     location / { try_files $uri /index.html; }
     location /api/ { proxy_pass http://127.0.0.1:5000; }   # then VITE_API_URL=/api
   }
   ```
4. Add HTTPS with ACM (CloudFront / ALB) or Certbot on Nginx.

## API summary
`POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` ·
`GET /api/products?search=&category=&sort=&page=` · `GET /api/products/categories` · `GET /api/products/:id` ·
`POST|PUT|DELETE /api/products` (admin) · `POST /api/orders` · `GET /api/orders` · `GET /api/orders/:id` · `GET /api/health`
