import * as floorsService from "./floors.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await floorsService.listFloors(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await floorsService.createFloor(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await floorsService.updateFloor(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await floorsService.deleteFloor(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Floor deleted");
}
