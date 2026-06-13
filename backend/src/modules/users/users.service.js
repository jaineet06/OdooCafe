import bcrypt from "bcryptjs";
import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";

const BCRYPT_ROUNDS = 12;

export async function listUsers(tenantId, { role } = {}) {
  const conditions = ["tenant_id = $1", "is_archived = FALSE"];
  const params = [tenantId];
  if (role) {
    conditions.push("role = $2");
    params.push(role);
  }
  const result = await pool.query(
    `SELECT id, name, email, role, is_archived, created_at FROM users
     WHERE ${conditions.join(" AND ")} ORDER BY name`,
    params
  );
  return result.rows;
}

export async function getUserById(tenantId, id) {
  const result = await pool.query(
    `SELECT id, name, email, role, is_archived, created_at FROM users
     WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "User not found");
  return result.rows[0];
}

export async function createUser(tenantId, data) {
  const existing = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
    [data.email, tenantId]
  );
  if (existing.rows.length > 0) throw new ApiError(409, "Email already exists");

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [tenantId, data.name, data.email, passwordHash, data.role || "employee"]
  );
  logger.info("Employee created", { tenantId, userId: result.rows[0].id });
  return result.rows[0];
}

export async function changePassword(tenantId, id, password) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    `UPDATE users SET password_hash = $3 WHERE id = $2 AND tenant_id = $1 RETURNING id`,
    [tenantId, id, passwordHash]
  );
  if (result.rows.length === 0) throw new ApiError(404, "User not found");
  return { id };
}

export async function toggleArchive(tenantId, id) {
  const result = await pool.query(
    `UPDATE users SET is_archived = NOT is_archived WHERE id = $2 AND tenant_id = $1 RETURNING id, is_archived`,
    [tenantId, id]
  );
  if (result.rows.length === 0) throw new ApiError(404, "User not found");
  return result.rows[0];
}

export async function deleteUser(tenantId, id, currentUserId) {
  if (id === currentUserId) throw new ApiError(400, "Cannot delete your own account");
  const result = await pool.query(
    `DELETE FROM users WHERE id = $2 AND tenant_id = $1 RETURNING id`,
    [tenantId, id]
  );
  if (result.rows.length === 0) throw new ApiError(404, "User not found");
  return { id };
}
