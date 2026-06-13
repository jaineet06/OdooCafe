import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { computeDiscountAmount } from "../../utils/taxCalculator.js";

export async function listCoupons(tenantId) {
  const result = await pool.query(
    `SELECT * FROM coupons WHERE tenant_id = $1 ORDER BY code`,
    [tenantId]
  );
  return result.rows;
}

export async function createCoupon(tenantId, data) {
  try {
    const result = await pool.query(
      `INSERT INTO coupons (tenant_id, code, discount_type, discount_value, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, data.code.toUpperCase(), data.discountType, data.discountValue, data.isActive ?? true]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") throw new ApiError(409, "Coupon code already exists");
    throw err;
  }
}

export async function updateCoupon(tenantId, id, data) {
  const existing = await pool.query(`SELECT id FROM coupons WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  if (existing.rows.length === 0) throw new ApiError(404, "Coupon not found");

  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  const map = { code: "code", discountType: "discount_type", discountValue: "discount_value", isActive: "is_active" };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(key === "code" ? data[key].toUpperCase() : data[key]);
    }
  }

  const result = await pool.query(
    `UPDATE coupons SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteCoupon(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM coupons WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Coupon not found");
  return { id };
}

export async function validateCoupon(tenantId, code, orderTotal) {
  const result = await pool.query(
    `SELECT * FROM coupons WHERE tenant_id = $1 AND UPPER(code) = UPPER($2) AND is_active = TRUE`,
    [tenantId, code]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Invalid or inactive coupon");

  const coupon = result.rows[0];
  const discountAmount = computeDiscountAmount(coupon.discount_type, coupon.discount_value, orderTotal);
  return { coupon, discountAmount };
}
