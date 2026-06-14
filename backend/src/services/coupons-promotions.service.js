import * as couponsPromotionsModel from "../models/coupons-promotions.model.js";
import { ApiError } from "../utils/ApiError.js";
import { computeDiscountAmount } from "../utils/taxCalculator.js";

// Coupon logic
export async function listCoupons(tenantId) {
  return couponsPromotionsModel.findCoupons(tenantId);
}

export async function createCoupon(tenantId, data) {
  try {
    return await couponsPromotionsModel.insertCoupon(tenantId, data);
  } catch (err) {
    if (err.code === "23505") throw new ApiError(409, "Coupon code already exists");
    throw err;
  }
}

export async function updateCoupon(tenantId, id, data) {
  const existing = await couponsPromotionsModel.findCouponById(tenantId, id);
  if (!existing) throw new ApiError(404, "Coupon not found");

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

  return couponsPromotionsModel.updateCoupon(tenantId, id, fields, values);
}

export async function deleteCoupon(tenantId, id) {
  const deleted = await couponsPromotionsModel.deleteCoupon(tenantId, id);
  if (!deleted) throw new ApiError(404, "Coupon not found");
  return deleted;
}

export async function validateCoupon(tenantId, code, orderTotal) {
  const coupon = await couponsPromotionsModel.findActiveCouponByCode(tenantId, code);
  if (!coupon) throw new ApiError(404, "Invalid or inactive coupon");

  const discountAmount = computeDiscountAmount(coupon.discount_type, coupon.discount_value, orderTotal);
  return { coupon, discountAmount };
}

// Promotion logic
export async function listPromotions(tenantId) {
  return couponsPromotionsModel.findPromotions(tenantId);
}

export async function createPromotion(tenantId, data) {
  return couponsPromotionsModel.insertPromotion(tenantId, data);
}

export async function updatePromotion(tenantId, id, data) {
  const existing = await couponsPromotionsModel.findPromotionById(tenantId, id);
  if (!existing) throw new ApiError(404, "Promotion not found");

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

  return couponsPromotionsModel.updatePromotion(tenantId, id, fields, values);
}

export async function deletePromotion(tenantId, id) {
  const deleted = await couponsPromotionsModel.deletePromotion(tenantId, id);
  if (!deleted) throw new ApiError(404, "Promotion not found");
  return deleted;
}

export async function getActivePromotions(tenantId) {
  return couponsPromotionsModel.findActivePromotions(tenantId);
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
