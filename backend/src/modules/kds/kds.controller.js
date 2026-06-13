import * as service from "./kds.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listKDSOrders(req.tenantId, req.user.userId, req.user.role);
  return ApiResponse.success(res, data);
}

export async function search(req, res) {
  const data = await service.searchKDSOrders(req.tenantId, req.user.userId, req.user.role, req.query);
  return ApiResponse.success(res, data);
}

export async function updateStage(req, res) {
  const data = await service.advanceStage(req.tenantId, req.params.id, req.body.stage);
  return ApiResponse.success(res, data);
}

export async function completeItem(req, res) {
  const data = await service.completeItem(req.tenantId, req.params.kdsOrderId, req.params.itemId);
  return ApiResponse.success(res, data);
}
