# ☕ Odoo Cafe POS — Multi-Tenant Restaurant Point-of-Sale Platform

A production-grade, multi-tenant web-based Restaurant POS system built with **React + Tailwind CSS** (frontend), **Node.js + Express** (backend), **Neon (PostgreSQL)** (database), **Cloudinary** (file storage), and **Stripe** (payments in test mode). Real-time kitchen updates are powered by **WebSockets**.

---

## 📁 Project Structure

```
odoo-cafe-pos/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # Neon PostgreSQL connection (pg pool)
│   │   │   ├── cloudinary.js          # Cloudinary SDK config
│   │   │   ├── stripe.js              # Stripe SDK config
│   │   │   └── env.js                 # Validated env vars (dotenv + joi)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT verify + role attach
│   │   │   ├── rbac.middleware.js     # Role-Based Access Control guards
│   │   │   ├── tenant.middleware.js   # X-Tenant-ID header → req.tenantId
│   │   │   ├── validate.middleware.js # Joi schema validation wrapper
│   │   │   ├── upload.middleware.js   # Multer + Cloudinary stream upload
│   │   │   ├── rateLimiter.middleware.js # express-rate-limit per tenant
│   │   │   └── errorHandler.middleware.js # Central error handler
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── tenant/
│   │   │   │   ├── tenant.routes.js
│   │   │   │   ├── tenant.controller.js
│   │   │   │   ├── tenant.service.js
│   │   │   │   └── tenant.validation.js
│   │   │   ├── users/
│   │   │   │   ├── users.routes.js
│   │   │   │   ├── users.controller.js
│   │   │   │   ├── users.service.js
│   │   │   │   └── users.validation.js
│   │   │   ├── products/
│   │   │   │   ├── products.routes.js
│   │   │   │   ├── products.controller.js
│   │   │   │   ├── products.service.js
│   │   │   │   └── products.validation.js
│   │   │   ├── categories/
│   │   │   │   ├── categories.routes.js
│   │   │   │   ├── categories.controller.js
│   │   │   │   ├── categories.service.js
│   │   │   │   └── categories.validation.js
│   │   │   ├── floors/
│   │   │   │   ├── floors.routes.js
│   │   │   │   ├── floors.controller.js
│   │   │   │   ├── floors.service.js
│   │   │   │   └── floors.validation.js
│   │   │   ├── tables/
│   │   │   │   ├── tables.routes.js
│   │   │   │   ├── tables.controller.js
│   │   │   │   ├── tables.service.js
│   │   │   │   └── tables.validation.js
│   │   │   ├── payment-methods/
│   │   │   │   ├── payment-methods.routes.js
│   │   │   │   ├── payment-methods.controller.js
│   │   │   │   ├── payment-methods.service.js
│   │   │   │   └── payment-methods.validation.js
│   │   │   ├── coupons/
│   │   │   │   ├── coupons.routes.js
│   │   │   │   ├── coupons.controller.js
│   │   │   │   ├── coupons.service.js
│   │   │   │   └── coupons.validation.js
│   │   │   ├── promotions/
│   │   │   │   ├── promotions.routes.js
│   │   │   │   ├── promotions.controller.js
│   │   │   │   ├── promotions.service.js
│   │   │   │   └── promotions.validation.js
│   │   │   ├── sessions/
│   │   │   │   ├── sessions.routes.js
│   │   │   │   ├── sessions.controller.js
│   │   │   │   ├── sessions.service.js
│   │   │   │   └── sessions.validation.js
│   │   │   ├── orders/
│   │   │   │   ├── orders.routes.js
│   │   │   │   ├── orders.controller.js
│   │   │   │   ├── orders.service.js
│   │   │   │   └── orders.validation.js
│   │   │   ├── payments/
│   │   │   │   ├── payments.routes.js
│   │   │   │   ├── payments.controller.js
│   │   │   │   ├── payments.service.js
│   │   │   │   └── payments.validation.js
│   │   │   ├── customers/
│   │   │   │   ├── customers.routes.js
│   │   │   │   ├── customers.controller.js
│   │   │   │   ├── customers.service.js
│   │   │   │   └── customers.validation.js
│   │   │   ├── kds/
│   │   │   │   ├── kds.routes.js
│   │   │   │   ├── kds.controller.js
│   │   │   │   ├── kds.service.js
│   │   │   │   └── kds.validation.js
│   │   │   ├── reports/
│   │   │   │   ├── reports.routes.js
│   │   │   │   ├── reports.controller.js
│   │   │   │   ├── reports.service.js
│   │   │   │   └── reports.validation.js
│   │   │   └── receipts/
│   │   │       ├── receipts.routes.js
│   │   │       ├── receipts.controller.js
│   │   │       └── receipts.service.js
│   │   ├── websocket/
│   │   │   ├── ws.server.js           # ws server bootstrap, tenant rooms
│   │   │   ├── ws.events.js           # Event name constants
│   │   │   └── ws.helpers.js          # broadcastToTenant(), broadcastToKDS()
│   │   ├── utils/
│   │   │   ├── logger.js              # Winston logger
│   │   │   ├── ApiError.js            # Custom error class
│   │   │   ├── ApiResponse.js         # Standard response wrapper
│   │   │   ├── asyncHandler.js        # try/catch wrapper for controllers
│   │   │   ├── pagination.js          # Cursor/offset pagination helpers
│   │   │   ├── taxCalculator.js       # Tax + discount computation
│   │   │   ├── qrGenerator.js         # UPI QR via qrcode package
│   │   │   ├── pdfGenerator.js        # Receipt PDF via pdfkit
│   │   │   ├── emailSender.js         # Nodemailer transporter
│   │   │   └── slugify.js             # Tenant slug generator
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql
│   │   │   └── seeds/
│   │   │       └── seed.js            # Full dummy data seeder
│   │   └── app.js                     # Express app factory
│   ├── server.js                      # HTTP + WS server entry point
│   ├── .env.example
│   └── package.json
├── client/                            # React + Tailwind frontend (Phase 2)
│   └── src/                           # See frontend-context.md
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router v6, TanStack Query |
| Backend | Node.js 20 LTS, Express 5 |
| Database | Neon (serverless PostgreSQL) via `pg` |
| File Storage | Cloudinary |
| Payments | Stripe (test mode) |
| Real-time | `ws` WebSocket library |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Logging | Winston + Morgan |
| Validation | Joi |
| Email | Nodemailer |
| PDF | pdfkit |
| QR Codes | qrcode |
| Rate Limiting | express-rate-limit |
| File Upload | Multer + Cloudinary stream |

---

## 🔑 Roles & Access Control

| Role | Token Claim | Access |
|---|---|---|
| `admin` | `{ role: "admin" }` | Full backend + POS terminal |
| `employee` | `{ role: "employee" }` | POS terminal only |
| `kds_device` | `{ role: "kds_device" }` | Kitchen Display only (`/api/kds/*`) |

### KDS Device Token Flow
1. Admin opens the KDS registration screen on the kitchen tablet.
2. Admin enters their credentials at `POST /api/auth/register-kds`.
3. Backend verifies the admin password and mints a **long-lived JWT** with `{ role: "kds_device", tenantId }`.
4. This token is stored in the tablet's localStorage.
5. `rbac.middleware.js` blocks `kds_device` tokens from every route except `/api/kds/*`. Any attempt returns `403 Forbidden`.

---

## 🌐 Multi-Tenancy Model

Every request carries an `X-Tenant-ID` header (or the `tenantId` is embedded in the JWT after login). The `tenant.middleware.js` resolves and attaches `req.tenantId` to every request. Every database query includes a `WHERE tenant_id = $1` clause. No tenant can ever read or write another tenant's data.

---

## 📡 WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `ORDER_SENT_TO_KDS` | Server → KDS | New order ticket arrives |
| `KDS_STAGE_UPDATED` | Server → POS | Order stage changed by kitchen |
| `KDS_ITEM_COMPLETED` | Server → POS | Individual item struck through |
| `TABLE_STATUS_CHANGED` | Server → POS | Table becomes occupied/available |
| `SESSION_CLOSED` | Server → All | POS session ended |

---

## 🗄 Database Schema (Neon PostgreSQL)

Core tables:
- `tenants` — one row per cafe/business
- `users` — admins and employees, scoped to tenant
- `kds_devices` — registered kitchen tablets
- `product_categories` — color-coded categories
- `products` — full product catalog
- `floors` — floor plans per tenant
- `tables` — tables under each floor
- `payment_methods` — per-tenant toggle config
- `coupons` — manual coupon codes
- `promotions` — automated promotions (product or order level)
- `sessions` — POS shift sessions
- `customers` — customer profiles
- `orders` — order header
- `order_items` — line items
- `order_discounts` — applied coupons/promotions per order
- `payments` — payment transactions
- `kds_orders` — kitchen display order state (stage per order)
- `kds_order_items` — per-item completion state

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Neon project (free tier works)
- Cloudinary account
- Stripe account (test keys)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in all env vars
npm run migrate      # runs 001_initial_schema.sql against Neon
npm run seed         # populates dummy data
npm run dev          # nodemon + winston logging
```

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev          # Vite dev server at http://localhost:5173
```

Set `FRONTEND_URL=http://localhost:5173` in backend `.env` for CORS.

See **[frontend-context.md](./frontend-context.md)** for design tokens, architecture, and feature status.

### Environment Variables

```env
# Server
PORT=5001
NODE_ENV=development

# Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
KDS_JWT_EXPIRES_IN=365d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## ✅ Backend: Phase 1 — COMPLETE

| Feature | Status |
|---|---|
| Multi-tenant auth (JWT, RBAC, KDS tokens) | ✅ |
| All REST modules (products → receipts) | ✅ |
| WebSocket real-time events | ✅ |
| Stripe webhook (`payment_intent.succeeded/failed/canceled`) | ✅ |
| HTML email receipts (inline CSS + plain-text fallback + PDF attach) | ✅ |
| PDF/XLS report export | ✅ |
| Seed data (2 tenants) | ✅ |

### Stripe webhook (local test)

```bash
stripe listen --forward-to localhost:5001/api/payments/webhook
stripe trigger payment_intent.succeeded
```

---

## 🖥 Frontend (Phase 2)

### Tech stack

React 18, Vite, Tailwind CSS v4, React Router v6, TanStack Query, Axios, react-hook-form + Joi, react-hot-toast, react-loading-skeleton, Recharts, native WebSocket.

### Run

```bash
cd client
npm install
cp .env.example .env
npm run dev    # http://localhost:5173
```

### Env vars

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_WS_URL=ws://localhost:5001
```

See **[frontend-context.md](./frontend-context.md)** for design tokens, architecture, and gaps.

### Role-based routing

| Role | Landing page | Access |
|------|--------------|--------|
| Admin | `/admin/reports` | Admin panel + POS terminal |
| Employee | `/pos` | POS terminal only |
| KDS device | `/kds` | Kitchen display only (logout via header) |

### Module completion

| Module | Status |
|---|---|
| Auth (login/signup, guards) | ✅ |
| Admin panel + POS sidebar layouts | ✅ |
| Role-separated routing (`/admin/*`, `/pos/*`, `/kds`) | ✅ |
| Products / Categories admin | ✅ |
| Payment methods / Floors / Coupons / Users | ✅ |
| KDS register + display (with logout) | ✅ |
| POS (session, order, payment, customers, tables) | ✅ |
| Reports dashboard + export | ✅ |
| Stripe Elements card UI | ⏳ Pending |
| Product image upload UI | ⏳ Pending |
| POS WebSocket live updates | ⏳ Pending |

---

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new tenant + admin |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/register-kds` | Admin | Mint KDS device token |
| POST | `/api/auth/refresh` | Auth | Refresh access token |
| POST | `/api/auth/logout` | Auth | Invalidate token |

### Products
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Auth | List all (paginated, filterable) |
| POST | `/api/products` | Admin | Create product |
| GET | `/api/products/:id` | Auth | Get single product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Soft delete |

### Orders
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/orders` | Auth | List session orders |
| POST | `/api/orders` | Employee/Admin | Create order |
| GET | `/api/orders/:id` | Auth | Order detail |
| PUT | `/api/orders/:id` | Employee/Admin | Update order |
| POST | `/api/orders/:id/send-to-kds` | Employee/Admin | Send to kitchen → WS broadcast |
| POST | `/api/orders/:id/cancel` | Admin | Cancel order |

### KDS (kds_device role only)
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/kds/orders` | KDS | Get all active KDS tickets |
| PUT | `/api/kds/orders/:id/stage` | KDS | Advance order stage |
| PUT | `/api/kds/orders/:orderId/items/:itemId` | KDS | Mark item complete |

### Reports
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/reports/dashboard` | Admin | Summary metrics |
| GET | `/api/reports/sales-trend` | Admin | Chart data |
| GET | `/api/reports/top-products` | Admin | Top products table |
| GET | `/api/reports/export` | Admin | PDF or XLS export |

> Full API docs are available at `/api/docs` (Swagger UI) in development mode.

---

## 🌱 Seed Data

Running `npm run seed` populates:
- 2 demo tenants (`sunrise-cafe`, `metro-bistro`)
- 1 admin + 2 employees per tenant
- 5 product categories with colors
- 15 products across categories
- 2 floors with 6 tables each
- All payment methods enabled
- 3 coupons + 2 automated promotions
- 1 open POS session with 10 sample orders (mix of Draft, Paid, Cancelled)
- KDS tickets for pending orders

---

## 🔒 Security Highlights

- All passwords hashed with **bcryptjs** (cost factor 12)
- JWTs signed with HS256; KDS tokens are long-lived but role-restricted
- `helmet.js` sets secure HTTP headers
- `cors` configured to allowlist frontend origin
- SQL injection prevention via parameterized queries (`pg` placeholders)
- Rate limiting per tenant per IP
- Tenant isolation enforced at middleware level — every query is scoped

---

## 📦 Key NPM Packages

```json
{
  "express": "^5.x",
  "pg": "^8.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "joi": "^17.x",
  "winston": "^3.x",
  "morgan": "^1.x",
  "multer": "^1.x",
  "cloudinary": "^2.x",
  "stripe": "^14.x",
  "ws": "^8.x",
  "nodemailer": "^6.x",
  "pdfkit": "^0.15.x",
  "qrcode": "^1.x",
  "helmet": "^7.x",
  "cors": "^2.x",
  "express-rate-limit": "^7.x",
  "dotenv": "^16.x",
  "nodemon": "^3.x"
}
```

---

## 📝 License

MIT — free for personal and commercial use.
