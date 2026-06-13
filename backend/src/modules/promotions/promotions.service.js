import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { computeDiscountAmount } from "../../utils/taxCalculator.js";

export async function listPromotions(tenantId) {
  const result = await pool.query(
    `SELECT p.*, pr.name AS product_name FROM promotions p
     LEFT JOIN products pr ON pr.id = p.product_id AND pr.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1 ORDER BY p.name`,
    [tenantId]
  );
  return result.rows;
}

export async function createPromotion(tenantId, data) {
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

export async function updatePromotion(tenantId, id, data) {
  const existing = await pool.query(`SELECT id FROM promotions WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  if (existing.rows.length === 0) throw new ApiError(404, "Promotion not found");

  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  const map = {
    name: "name",
    applyTo: "apply_to",
    productId: "product_id",
    minQty: "min_qty",
    minOrderAmount: "min_order_amount",
    discountType: "discount_type",
    discountValue: "discount_value",
    isActive: "is_active",
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }

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
  if (result.rows.length === 0) throw new ApiError(404, "Promotion not found");
  return { id };
}

export async function getActivePromotions(tenantId) {
  const result = await pool.query(
    `SELECT * FROM promotions WHERE tenant_id = $1 AND is_active = TRUE`,
    [tenantId]
  );
  return result.rows;
}

export function evaluatePromotions(promotions, orderItems, subtotal) {
  const discounts = [];
  const applied = [];

  for (const promo of promotions) {
    if (promo.apply_to === "product") {
      const matchingItems = orderItems.filter((i) => i.productId === promo.product_id);
      const totalQty = matchingItems.reduce((s, i) => s + i.quantity, 0);
      if (totalQty >= promo.min_qty) {
        const base = matchingItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const amount = computeDiscountAmount(promo.discount_type, promo.discount_value, base);
        discounts.push({ type: "item", amount, productId: promo.product_id });
        applied.push({ sourceType: "promotion", sourceId: promo.id, discountAmount: amount });
      }
    } else if (promo.apply_to === "order" && subtotal >= Number(promo.min_order_amount)) {
      const amount = computeDiscountAmount(promo.discount_type, promo.discount_value, subtotal);
      discounts.push({ type: "order", amount });
      applied.push({ sourceType: "promotion", sourceId: promo.id, discountAmount: amount });
    }
  }

  return { discounts, applied };
}
