import * as service from "../services/coupons-promotions.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Coupon handlers
export async function listCoupons(req, res) {
  const data = await service.listCoupons(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function createCoupon(req, res) {
  const data = await service.createCoupon(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function updateCoupon(req, res) {
  const data = await service.updateCoupon(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function deleteCoupon(req, res) {
  const data = await service.deleteCoupon(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Coupon deleted");
}

export async function validateCoupon(req, res) {
  const data = await service.validateCoupon(req.tenantId, req.body.code, req.body.orderTotal);
  return ApiResponse.success(res, data);
}

// Promotion handlers
export async function listPromotions(req, res) {
  const data = await service.listPromotions(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function createPromotion(req, res) {
  const data = await service.createPromotion(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function updatePromotion(req, res) {
  const data = await service.updatePromotion(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function deletePromotion(req, res) {
  const data = await service.deletePromotion(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Promotion deleted");
}
