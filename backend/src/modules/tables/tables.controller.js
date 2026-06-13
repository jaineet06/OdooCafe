import * as tablesService from "./tables.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await tablesService.listTables(req.tenantId, req.query);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await tablesService.createTable(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await tablesService.updateTable(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await tablesService.deleteTable(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Table deleted");
}

export async function toggleStatus(req, res) {
  const data = await tablesService.toggleTableStatus(req.tenantId, req.params.id, req.body.isActive);
  return ApiResponse.success(res, data);
}
