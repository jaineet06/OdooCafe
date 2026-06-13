import * as service from "./customers.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listCustomers(req.tenantId, req.query);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await service.createCustomer(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await service.updateCustomer(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await service.deleteCustomer(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Customer deleted");
}
