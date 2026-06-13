# Odoo Cafe POS — Backend Context

## Table occupancy (derived, session-scoped)

No `tables.is_occupied` column. Occupancy is **derived** at query time:

- A table is **occupied** when it has an order in the **current open session** with `status NOT IN ('paid', 'cancelled')`.
- Implemented in `backend/src/modules/tables/tableStatus.sql.js` (`ACTIVE_ORDER_LATERAL` + `ORDER_STATUS_CASE`).
- Used by `tables.service.js` (`listTables`, `getTableStatus`, `broadcastTableStatusChange`) and `floors.service.js`.

On order create / pay / cancel, `broadcastTableStatusChange(tenantId, tableId)` emits:

```json
{ "type": "TABLE_STATUS_CHANGED", "payload": { "tableId": "...", "status": "occupied|available" } }
```

## Session lifecycle

| State | Backend | Frontend |
|-------|---------|----------|
| Open | `POST /api/sessions/open` → `sessions.status = 'open'` | `/pos` session gate → Go to POS |
| Active | Orders require `sessionId` of open session | `SessionContext` + `useSession()` |
| Close | `POST /api/sessions/:id/close` with `{ closingBalance?, force? }` | Admin modal on `/pos`; summary screen |
| Lockout | `SESSION_CLOSED` WS broadcast; mutations return `409` if session closed | `SessionLockOverlay` + axios 409 handler |

`sessionGuards.js`: `assertSessionOpen`, `assertOrderSessionOpen` — used by orders + payments mutations.

Close session blocks if draft orders exist unless `force: true`. Returns closing summary (orders, revenue, payment breakdown).

## WebSocket events (server → clients)

| Event | When |
|-------|------|
| `TABLE_STATUS_CHANGED` | Order created/cancelled/paid affecting a table |
| `SESSION_CLOSED` | Admin closes session |
| `ORDER_PAID` | Payment completed (cash/UPI/card webhook) |
| `KDS_STAGE_UPDATED` | KDS ticket stage advanced → POS updates `kds_stage` |
| `ORDER_SENT_TO_KDS` | New kitchen ticket |

## Seed data

`npm run seed` truncates all tables and reseeds two tenants.

**Product images:** stable Unsplash CDN URLs (`images.unsplash.com/photo-…?w=400&h=300&fit=crop`) — one fixed photo per product in `backend/src/db/seeds/seed.js`. No Cloudinary upload during seed.

Credentials: `admin@sunrise-cafe.com` / `Password@123` (and metro-bistro).

## KDS

Stage updates broadcast `KDS_STAGE_UPDATED` with `{ kdsOrderId, orderId, newStage }`. POS listens via `usePosOrderSync`.

## Payments

`payments.service.js` — cash/UPI confirm + Stripe webhook. All payment paths call `assertOrderSessionOpen` before processing.
