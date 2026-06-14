import * as service from "../services/floors-tables.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ── Floors ────────────────────────────────────────────────────────────────────

export async function listFloors(req, res) {
  const data = await service.listFloors(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function createFloor(req, res) {
  const data = await service.createFloor(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function updateFloor(req, res) {
  const data = await service.updateFloor(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function deleteFloor(req, res) {
  await service.deleteFloor(req.tenantId, req.params.id);
  return ApiResponse.success(res, null, "Floor deleted");
}

// ── Tables ────────────────────────────────────────────────────────────────────

export async function listTables(req, res) {
  const data = await service.listTables(req.tenantId, req.query);
  return ApiResponse.success(res, data);
}

export async function createTable(req, res) {
  const data = await service.createTable(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function updateTable(req, res) {
  const data = await service.updateTable(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function deleteTable(req, res) {
  await service.deleteTable(req.tenantId, req.params.id);
  return ApiResponse.success(res, null, "Table deleted");
}

export async function setTableStatus(req, res) {
  const data = await service.setTableStatus(req.tenantId, req.params.id, req.body.isActive);
  return ApiResponse.success(res, data);
}

export async function setTableOccupancy(req, res) {
  const data = await service.setTableOccupancy(req.tenantId, req.params.id, req.body.isOccupied);
  return ApiResponse.success(res, data);
}

export async function mergeTables(req, res) {
  const data = await service.mergeTables(req.tenantId, req.body.primaryTableId, req.body.tableIds);
  return ApiResponse.success(res, data, "Tables merged");
}

export async function unmergeTables(req, res) {
  const data = await service.unmergeTables(req.tenantId, req.body.tableId);
  return ApiResponse.success(res, data, "Tables unmerged");
}
