import * as service from "./coupons.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listCoupons(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await service.createCoupon(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await service.updateCoupon(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await service.deleteCoupon(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Coupon deleted");
}

export async function validate(req, res) {
  const { code, orderTotal } = req.body;
  const data = await service.validateCoupon(req.tenantId, code, orderTotal);
  return ApiResponse.success(res, data);
}
