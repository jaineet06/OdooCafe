# Odoo Cafe POS — Frontend Context

## Design System v2

Full specification: `client/src/styles/design-system.md`

### Tokens (`client/src/index.css` + `client/src/styles/tokens.js`)

Semantic colors: `bg-base`, `bg-elevated`, `bg-sunken`, `text-primary/secondary/muted`, `border-subtle`, `accent-primary/success/warning/danger`, `brand-espresso`. KDS uses `kds-bg`, `kds-surface`, `kds-text`, `kds-muted`, `kds-border`.

Legacy aliases (`cream`, `terracotta`, `espresso`, etc.) remain mapped to semantic tokens for gradual migration.

### Typography

DM Serif Display (headings) + Work Sans (body). Strict scale: 12/14/16/20/24/32/40px via Tailwind `text-xs` through `text-4xl`.

### Component primitives (`client/src/components/common/`)

`Button`, `Card`, `ListRow`, `Input`, `Textarea`, `Select`, `Toggle`, `ColorInput`, `Modal`, `Badge`, `StatusPill`, `Tabs`, `SearchInput`, `PageToolbar`, `EmptyState`, `Skeletons`, `AnimatedNumber`, `AppToaster`.

POS composites: `components/pos/ProductCard`, `CartPanel`.

### Motion (`client/src/hooks/useGsapAnimation.js`)

| Hook | Use |
|------|-----|
| `usePageEnter` | Route/page content fade-in |
| `useStagger` | Grid/list item entrance |
| `usePulse` | Cart total / qty feedback |
| `useCountUp` | Dashboard metrics |
| `animateModalIn/Out` | Modal (built into `Modal`) |
| `animateSidebar` | Sidebar collapse |

Config: `client/src/motion/gsapConfig.js`. Respects `prefers-reduced-motion`.

**Rule:** All new screens must use design-system primitives — no ad-hoc colors, spacing, or one-off button styles.

---

## Design tokens (legacy reference)

Warm cafe palette defined in `client/src/index.css`:

| Token | Value | Use |
|-------|-------|-----|
| cream | `#f5f0e8` | Page background |
| surface | `#faf8f4` | Cards, sidebar |
| espresso | `#3b2314` | Headings, accents |
| terracotta | `#c25b3a` | Primary actions, active nav |
| sage | `#6b7f6b` | Success, secondary accents |
| charcoal | `#2c2c2c` | Body text |
| border | `#d9d0c4` | Dividers |

Fonts: **DM Serif Display** (headings), **Work Sans** (body).

Category colors come from the API and are applied to product cards and filters via `CategoryContext`.

---

## Route structure

Three separate shells by role:

| Tree | Roles | Layout |
|------|-------|--------|
| `/admin/*` | `admin` only | `AdminLayout` + left sidebar |
| `/pos/*` | `admin`, `employee` | `PosLayout` + left sidebar + top bar |
| `/kds` | `kds_device` only | `KdsLayout` — standalone full-screen, minimal header |

Public: `/login`, `/signup`.

### Admin routes (`/admin/*`)

- `/admin/reports` — Dashboard & reports (default admin landing)
- `/admin/products`, `/admin/categories`
- `/admin/payment-methods`, `/admin/floors`, `/admin/coupons`
- `/admin/users` — Employee management
- `/admin/kds-register` — Generate KDS device token (does **not** activate token in admin browser)

### POS routes (`/pos/*`)

Shared components for admin and employee:

- `/pos` — Session gate (open/close session)
- `/pos/order` — Order view (product search + table indicator in top bar)
- `/pos/orders`, `/pos/orders/:id`
- `/pos/payment/:orderId`, `/pos/customers`, `/pos/tables`

Admin sees **Back to Admin Panel** at top of POS sidebar.

### KDS

- `/kds` — Kitchen display only
- Header: device label + **Log out** (clears `odoo_kds_token` and redirects to `/login`)
- No shared sidebar or admin/POS navigation

Legacy redirects: `/reports` → `/admin/reports`, `/kds/register` → `/admin/kds-register`.

---

## RoleGuard & ProtectedRoute rules

| Role | Login lands on | Can access | Blocked → redirect |
|------|----------------|------------|-------------------|
| `admin` | `/admin/reports` | `/admin/*`, `/pos/*` | — |
| `employee` | `/pos` | `/pos/*` only | `/admin/*` → `/pos` |
| `kds_device` | `/kds` | `/kds` only | all other protected routes → `/kds` |

**Auth routes:** `/login` and `/signup` are always public (no `ProtectedRoute`). KDS devices must use **Log out** before signing in as another role.

`login()` / `signup()` clear KDS tokens. `setKdsDeviceToken()` clears user JWT (kitchen tablet flow).

Backend API RBAC is separate — e.g. reports API is `admin`-only; employees do not see Reports in the POS sidebar.

---

## Layout architecture

Replaced top navbar with **collapsible left sidebar** (`Sidebar.jsx`):

- **Admin sidebar** — grouped: Dashboard, Catalog, Setup, Team, Open POS, Log out
- **POS sidebar** — POS Order, Orders, Customers, Table View, Log out (+ Back to Admin for admins)
- Collapses to icon-only on desktop; mobile uses hamburger → off-canvas drawer
- **POS top bar** (in main content): product search + table badge + user name — only passed from `OrderViewPage`

KDS uses `KdsLayout` with no sidebar.

---

## Key files

```
client/src/
├── routes/AppRoutes.jsx
├── components/layout/
│   ├── Sidebar.jsx
│   ├── AdminLayout.jsx
│   ├── PosLayout.jsx
│   ├── KdsLayout.jsx
│   ├── ProtectedRoute.jsx
│   └── RoleGuard.jsx
├── context/AuthContext.jsx
└── features/          # page modules
```

---

## Seed credentials

| Tenant | Email | Password |
|--------|-------|----------|
| Sunrise Cafe | `admin@sunrise-cafe.com` | `Password@123` |
| Sunrise Cafe | `emp1@sunrise-cafe.com` | `Password@123` |

---

## Testing checklist

1. **Admin** — lands on Dashboard; sidebar shows all admin sections; Open POS works; Back to Admin from POS works; logout → `/login`
2. **Employee** — lands on `/pos`; no admin sidebar items; direct URL `/admin/products` redirects to `/pos`
3. **KDS** — token in `localStorage` key `odoo_kds_token`; `/kds` shows tickets; Log out → `/login`; cannot reach `/pos` or `/admin`

---

## Known gaps (Phase 3)

- Coupon/promotion edit & delete in admin UI
- Advanced report filters (employee/session/product dropdowns)

---

## Round 2 — Deep UI overhaul (current)

### Layout & grids

CSS Grid used across: POS product grid (`OrderViewPage`), admin products (`ProductsAdminPage`), orders list cards (`OrdersListPage`), floor plan (`TableFloorPlan` in `TableViewPage` + `FloorPopup`), reports dashboard (`ReportsPage`). Cards use image-on-top hierarchy, hover elevation, and whitespace over heavy borders.

### Loading feedback

| Pattern | Component / hook | When |
|---------|------------------|------|
| Top progress bar | `TopProgressBar` in `App.jsx` | React Query global `isFetching` |
| Skeletons | `Skeletons.jsx` | Initial page/grid loads |
| Button spinners | `Button` `loading` prop | Mutations (save, pay, export, KDS) |
| Payment wait | `useAwaitPayment` | Card payment after Stripe confirm |

### Payment wizard (`/pos/payment/:orderId`)

Four-step stepper with GSAP step transitions:

1. **Review** — cart summary, totals
2. **Method** — Cash / Card / UPI / Print bill only (pay later)
3. **Process** — method-specific UI
4. **Receipt** — print, email (paid orders only), done

**Print bill only:** `GET /api/receipts/:orderId/bill/pdf` — order stays `draft`; no payment recorded.

**Card:** Stripe Elements via `StripeCardForm` → `POST /payments/create-intent` → `stripe.confirmPayment()`. Frontend does **not** mark paid; `useAwaitPayment` listens for `ORDER_PAID` WebSocket + polls `GET /orders/:id` every 2s (max ~16s). No manual transaction reference input.

**Cash / UPI:** unchanged confirm endpoints with button spinners.

**Email receipt:** `POST /receipts/:orderId/email` with `{ email }` — only works when `order.status === 'paid'`.

### Table status & floor plan

Backend emits `TABLE_STATUS_CHANGED` on order create, cancel, and payment complete. Frontend invalidates `["tables"]` / `["floors"]` on `TABLE_STATUS_CHANGED` and `ORDER_PAID` in `TableViewPage`, `FloorPopup`, and `useAwaitPayment`.

Visual floor plan: `TableFloorPlan.jsx` — round/rect tiles sized by seats, CSS 3D tilt (`rotateX`), color-coded available/occupied, GSAP entrance + state transitions.

### Unsplash images

- **POS placeholders:** `resolveProductImage()` in `utils/unsplash.js` — `source.unsplash.com` when `image_url` is null (cached per query).
- **Admin form:** Cloudinary upload **or** Unsplash search grid (requires `VITE_UNSPLASH_ACCESS_KEY` in `client/.env`).
- **Backend:** `imageUrl` in product form body accepted when no file uploaded.

### Receipt

Shared `ReceiptDocument` (`components/receipt/ReceiptDocument.jsx`) — header (tenant logo/name), order meta, itemized table, discounts, totals, payment info. Used in payment step 4, orders drawer, and basis for PDF/email templates.

Print: `openReceiptPdf()` / `openBillPdf()` in `utils/receipt.js` (authenticated blob fetch).

### Orders list

Card grid with status/table/customer/item preview; filter + sort + debounced search. Click opens `Drawer` with `ReceiptDocument` + draft actions.

### Stripe env

Backend: `STRIPE_PUBLISHABLE_KEY` (served via `GET /api/payments/config`). See `backend/.env.example`.

### Cart overflow

`CartPanel` — `flex` column, scrollable item list (`cart-scroll`), sticky summary + action footer.

---

## Part A — Backend & data integrity (current)

See also `context.md` for backend-focused notes.

### Table occupancy

Derived from open-session orders (`status NOT IN ('paid','cancelled')`). Shared SQL in `backend/src/modules/tables/tableStatus.sql.js`. WS: `TABLE_STATUS_CHANGED`.

### Session lockout

- `SessionContext` + `SessionLockOverlay` on POS routes (except `/pos` gate).
- `POST /sessions/:id/close` — draft-order guard, optional `force`, closing balance input, summary response.
- Mutations return `409` when session closed; axios triggers lock overlay.

### Order + KDS status on POS

`OrderStatusPill` shows payment status + `kds_stage`. `usePosOrderSync` in `PosLayout` handles `KDS_STAGE_UPDATED`, `ORDER_PAID`, `TABLE_STATUS_CHANGED`.

### KDS per-ticket loading

`KdsDisplayPage` tracks `advancingId` / `completingId` per ticket; WS uses `setQueryData` patches instead of full invalidation.

### Seed images

All 15 products per tenant get stable `image_url` values from Unsplash CDN in `seed.js` (re-run `npm run seed` after migrate).

---

## Part B — UI polish (reference-inspired)

Visual language from reference mockups — layout/spacing/card style only; no fake widgets.

### Admin dashboard (`ReportsPage`)

- Wide layout (`AdminLayout wide`, `max-w-7xl`)
- 5-column KPI row: Revenue, Orders, AOV, Open today, Tables occupied (live badges)
- Sales trend chart (2/3 width) + category donut with color legend from `product_categories.color`
- Live ops row: order status pie, kitchen pipeline, recent orders table with `OrderStatusPill`
- Top products / top orders data tables with alternating rows
- `.dashboard-card` soft elevation tokens in `index.css`

### POS order view

- `PosLayout headerVariant="order"`: brand + date, centered search, today's order count
- Horizontal **category cards** (`CategoryCard.jsx`) with image tint + item counts
- **Product cards**: floating image, always-visible + button, price footer
- **Cart panel**: receipt header, scrollable line items with thumbnails, pill CTA `Proceed to payment · $total` (`.pos-pill-cta`)

### Floor plan

- `.floor-canvas` background, 3D table tiles with hover tilt (`TableFloorPlan.jsx`)



