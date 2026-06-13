import * as service from "./promotions.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listPromotions(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await service.createPromotion(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await service.updatePromotion(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await service.deletePromotion(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Promotion deleted");
}
