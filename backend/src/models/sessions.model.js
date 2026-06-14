import pool from "../config/db.js";

export async function findSessions(tenantId) {
  const result = await pool.query(
    `SELECT s.id, s.opened_at, s.closed_at, s.opening_balance, s.closing_balance, s.status,
            u.name AS opened_by_name
     FROM sessions s
     JOIN users u ON u.id = s.opened_by
     WHERE s.tenant_id = $1
     ORDER BY s.opened_at DESC`,
    [tenantId]
  );
  return result.rows;
}

export async function findCurrentSession(tenantId) {
  const result = await pool.query(
    `SELECT s.id, s.opened_at, s.opening_balance, s.status,
            u.id AS opened_by_id, u.name AS opened_by_name
     FROM sessions s
     JOIN users u ON u.id = s.opened_by
     WHERE s.tenant_id = $1 AND s.status = 'open'
     ORDER BY s.opened_at DESC
     LIMIT 1`,
    [tenantId]
  );
  return result.rows[0] || null;
}

export async function findSessionById(tenantId, id) {
  const result = await pool.query(
    `SELECT * FROM sessions WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function insertSession(tenantId, openedBy, openingBalance) {
  const result = await pool.query(
    `INSERT INTO sessions (tenant_id, opened_by, opening_balance)
     VALUES ($1, $2, $3)
     RETURNING id, opened_at, opening_balance, status`,
    [tenantId, openedBy, openingBalance ?? 0]
  );
  return result.rows[0];
}

export async function closeSessionById(tenantId, id, closingBalance) {
  const result = await pool.query(
    `UPDATE sessions
     SET status = 'closed', closed_at = NOW(), closing_balance = $3
     WHERE id = $1 AND tenant_id = $2 AND status = 'open'
     RETURNING id, closed_at, closing_balance, status`,
    [id, tenantId, closingBalance ?? null]
  );
  return result.rows[0] || null;
}
