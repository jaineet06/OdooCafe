import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listCustomers(tenantId, { search } = {}) {
  const conditions = ["tenant_id = $1"];
  const params = [tenantId];
  if (search) {
    conditions.push(`(name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`);
    params.push(`%${search}%`);
  }
  const result = await pool.query(
    `SELECT id, name, email, phone, created_at FROM customers
     WHERE ${conditions.join(" AND ")} ORDER BY name LIMIT 50`,
    params
  );
  return result.rows;
}

export async function createCustomer(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO customers (tenant_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, data.name, data.email || null, data.phone || null]
  );
  return result.rows[0];
}

export async function updateCustomer(tenantId, id, data) {
  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  for (const key of ["name", "email", "phone"]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key] || null);
    }
  }
  const result = await pool.query(
    `UPDATE customers SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  if (result.rows.length === 0) throw new ApiError(404, "Customer not found");
  return result.rows[0];
}

export async function deleteCustomer(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM customers WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Customer not found");
  return { id };
}
