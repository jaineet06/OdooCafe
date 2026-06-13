import * as service from "./orders.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listOrders(req.tenantId, req.query);
  return ApiResponse.success(res, data.orders, "Success", 200, data.meta);
}

export async function getById(req, res) {
  const data = await service.getOrderById(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await service.createOrder(req.tenantId, req.user.userId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await service.updateOrder(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function sendToKDS(req, res) {
  const data = await service.sendToKDS(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Order sent to kitchen");
}

export async function cancel(req, res) {
  const data = await service.cancelOrder(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Order cancelled");
}
