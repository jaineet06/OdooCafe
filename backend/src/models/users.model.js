import pool from "../config/db.js";

export async function findUsers(conditions, params) {
  const result = await pool.query(
    `SELECT id, name, email, role, is_archived, created_at FROM users
     WHERE ${conditions.join(" AND ")} ORDER BY name`,
    params
  );
  return result.rows;
}

export async function findUserById(tenantId, id) {
  const result = await pool.query(
    `SELECT id, name, email, role, is_archived, created_at FROM users
     WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function checkUserByEmail(email, tenantId) {
  const result = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
    [email, tenantId]
  );
  return result.rows[0] || null;
}

export async function insertUser(tenantId, data, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [tenantId, data.name, data.email, passwordHash, data.role || "employee"]
  );
  return result.rows[0];
}

export async function updateUserPassword(tenantId, id, passwordHash) {
  const result = await pool.query(
    `UPDATE users SET password_hash = $3 WHERE id = $2 AND tenant_id = $1 RETURNING id`,
    [tenantId, id, passwordHash]
  );
  return result.rows[0] || null;
}

export async function updateUserArchive(tenantId, id) {
  const result = await pool.query(
    `UPDATE users SET is_archived = NOT is_archived WHERE id = $2 AND tenant_id = $1 RETURNING id, is_archived`,
    [tenantId, id]
  );
  return result.rows[0] || null;
}

export async function deleteUser(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $2 AND tenant_id = $1 RETURNING id`,
    [tenantId, id]
  );
  return result.rows[0] || null;
}
