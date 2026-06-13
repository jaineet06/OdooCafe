import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { broadcastToAll } from "../../websocket/ws.helpers.js";
import { WS_EVENTS } from "../../websocket/ws.events.js";
import { logger } from "../../utils/logger.js";

export async function listSessions(tenantId) {
  const result = await pool.query(
    `SELECT s.*, u.name AS opened_by_name,
            COUNT(o.id) FILTER (WHERE o.status = 'paid') AS paid_orders,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue
     FROM sessions s
     JOIN users u ON u.id = s.opened_by
     LEFT JOIN orders o ON o.session_id = s.id AND o.tenant_id = s.tenant_id
     WHERE s.tenant_id = $1
     GROUP BY s.id, u.name
     ORDER BY s.opened_at DESC`,
    [tenantId]
  );
  return result.rows;
}

export async function getCurrentSession(tenantId) {
  const result = await pool.query(
    `SELECT s.*, u.name AS opened_by_name FROM sessions s
     JOIN users u ON u.id = s.opened_by
     WHERE s.tenant_id = $1 AND s.status = 'open'
     ORDER BY s.opened_at DESC LIMIT 1`,
    [tenantId]
  );
  return result.rows[0] || null;
}

export async function openSession(tenantId, userId, openingBalance = 0) {
  const existing = await pool.query(
    `SELECT id FROM sessions WHERE tenant_id = $1 AND status = 'open'`,
    [tenantId]
  );
  if (existing.rows.length > 0) {
    throw new ApiError(409, "An open session already exists");
  }

  const result = await pool.query(
    `INSERT INTO sessions (tenant_id, opened_by, opening_balance, status)
     VALUES ($1, $2, $3, 'open') RETURNING *`,
    [tenantId, userId, openingBalance]
  );
  logger.info("Session opened", { tenantId, sessionId: result.rows[0].id });
  return result.rows[0];
}

export async function closeSession(tenantId, sessionId) {
  const session = await pool.query(
    `SELECT * FROM sessions WHERE id = $1 AND tenant_id = $2 AND status = 'open'`,
    [sessionId, tenantId]
  );
  if (session.rows.length === 0) throw new ApiError(404, "Open session not found");

  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS closing_balance,
            COUNT(*) AS total_orders
     FROM orders WHERE session_id = $1 AND tenant_id = $2 AND status = 'paid'`,
    [sessionId, tenantId]
  );

  const paymentBreakdown = await pool.query(
    `SELECT p.method_type, COUNT(*) AS count, SUM(p.amount) AS total
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE o.session_id = $1 AND o.tenant_id = $2 AND p.status = 'completed'
     GROUP BY p.method_type`,
    [sessionId, tenantId]
  );

  const closingBalance = revenueResult.rows[0].closing_balance;

  const result = await pool.query(
    `UPDATE sessions SET status = 'closed', closed_at = NOW(), closing_balance = $3
     WHERE id = $2 AND tenant_id = $1 RETURNING *`,
    [tenantId, sessionId, closingBalance]
  );

  broadcastToAll(tenantId, WS_EVENTS.SESSION_CLOSED, { sessionId });
  logger.info("Session closed", { tenantId, sessionId });

  return {
    session: result.rows[0],
    summary: {
      totalOrders: parseInt(revenueResult.rows[0].total_orders, 10),
      totalRevenue: Number(closingBalance),
      paymentBreakdown: paymentBreakdown.rows,
    },
  };
}
