import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listPaymentMethods(tenantId) {
  const result = await pool.query(
    `SELECT id, method_type, is_enabled, upi_id, created_at
     FROM payment_methods WHERE tenant_id = $1 ORDER BY method_type`,
    [tenantId]
  );
  return result.rows;
}

export async function togglePaymentMethod(tenantId, id) {
  const result = await pool.query(
    `UPDATE payment_methods SET is_enabled = NOT is_enabled
     WHERE id = $2 AND tenant_id = $1 RETURNING *`,
    [tenantId, id]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Payment method not found");
  return result.rows[0];
}

export async function updateUpiId(tenantId, id, upiId) {
  const result = await pool.query(
    `UPDATE payment_methods SET upi_id = $3
     WHERE id = $2 AND tenant_id = $1 AND method_type = 'upi' RETURNING *`,
    [tenantId, id, upiId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "UPI payment method not found");
  return result.rows[0];
}

export async function getUpiMethod(tenantId) {
  const result = await pool.query(
    `SELECT * FROM payment_methods WHERE tenant_id = $1 AND method_type = 'upi' AND is_enabled = TRUE`,
    [tenantId]
  );
  return result.rows[0] || null;
}
