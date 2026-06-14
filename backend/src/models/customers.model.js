import pool from "../config/db.js";

export async function findCustomers(conditions, params) {
  const result = await pool.query(
    `SELECT id, name, email, phone, created_at FROM customers
     WHERE ${conditions.join(" AND ")} ORDER BY name LIMIT 50`,
    params
  );
  return result.rows;
}

export async function insertCustomer(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO customers (tenant_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, data.name, data.email || null, data.phone || null]
  );
  return result.rows[0];
}

export async function updateCustomer(tenantId, id, fields, values) {
  const result = await pool.query(
    `UPDATE customers SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCustomer(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM customers WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}
