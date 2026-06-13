import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

export async function getOpenSessionId(tenantId) {
  const result = await pool.query(
    `SELECT id FROM sessions WHERE tenant_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
    [tenantId]
  );
  return result.rows[0]?.id || null;
}

/** Throws 409 if the session is not open (POS lockout). */
export async function assertSessionOpen(tenantId, sessionId) {
  const result = await pool.query(
    `SELECT id FROM sessions WHERE id = $1 AND tenant_id = $2 AND status = 'open'`,
    [sessionId, tenantId]
  );
  if (result.rows.length === 0) {
    throw new ApiError(409, "POS session is closed. No further orders can be processed.");
  }
  return result.rows[0].id;
}

export async function assertOrderSessionOpen(tenantId, orderId) {
  const result = await pool.query(
    `SELECT o.session_id FROM orders o
     JOIN sessions s ON s.id = o.session_id AND s.tenant_id = o.tenant_id
     WHERE o.id = $1 AND o.tenant_id = $2 AND s.status = 'open'`,
    [orderId, tenantId]
  );
  if (result.rows.length === 0) {
    throw new ApiError(409, "POS session is closed. No further orders can be processed.");
  }
  return result.rows[0].session_id;
}
