import pool from "../config/db.js";

// Coupon queries
export async function findCoupons(tenantId) {
  const result = await pool.query(
    `SELECT * FROM coupons WHERE tenant_id = $1 ORDER BY code`,
    [tenantId]
  );
  return result.rows;
}

export async function insertCoupon(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO coupons (tenant_id, code, discount_type, discount_value, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, data.code.toUpperCase(), data.discountType, data.discountValue, data.isActive ?? true]
  );
  return result.rows[0];
}

export async function findCouponById(tenantId, id) {
  const result = await pool.query(
    `SELECT id FROM coupons WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function updateCoupon(tenantId, id, fields, values) {
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
  return result.rows[0] || null;
}

export async function findActiveCouponByCode(tenantId, code) {
  const result = await pool.query(
    `SELECT * FROM coupons WHERE tenant_id = $1 AND UPPER(code) = UPPER($2) AND is_active = TRUE`,
    [tenantId, code]
  );
  return result.rows[0] || null;
}

// Promotion queries
export async function findPromotions(tenantId) {
  const result = await pool.query(
    `SELECT p.*, pr.name AS product_name FROM promotions p
     LEFT JOIN products pr ON pr.id = p.product_id AND pr.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1 ORDER BY p.name`,
    [tenantId]
  );
  return result.rows;
}

export async function insertPromotion(tenantId, data) {
  const result = await pool.query(
    `INSERT INTO promotions (tenant_id, name, apply_to, product_id, min_qty, min_order_amount, discount_type, discount_value, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      tenantId,
      data.name,
      data.applyTo,
      data.applyTo === "product" ? data.productId : null,
      data.applyTo === "product" ? data.minQty : null,
      data.applyTo === "order" ? data.minOrderAmount : null,
      data.discountType,
      data.discountValue,
      data.isActive ?? true,
    ]
  );
  return result.rows[0];
}

export async function findPromotionById(tenantId, id) {
  const result = await pool.query(
    `SELECT id FROM promotions WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function updatePromotion(tenantId, id, fields, values) {
  const result = await pool.query(
    `UPDATE promotions SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deletePromotion(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM promotions WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function findActivePromotions(tenantId) {
  const result = await pool.query(
    `SELECT * FROM promotions WHERE tenant_id = $1 AND is_active = TRUE`,
    [tenantId]
  );
  return result.rows;
}
