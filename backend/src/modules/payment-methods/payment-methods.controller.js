import * as service from "./payment-methods.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listPaymentMethods(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function toggle(req, res) {
  const data = await service.togglePaymentMethod(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function updateUpiId(req, res) {
  const data = await service.updateUpiId(req.tenantId, req.params.id, req.body.upiId);
  return ApiResponse.success(res, data);
}
