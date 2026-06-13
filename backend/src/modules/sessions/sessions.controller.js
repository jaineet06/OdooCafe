import * as service from "./sessions.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listSessions(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function getCurrent(req, res) {
  const data = await service.getCurrentSession(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function open(req, res) {
  const data = await service.openSession(req.tenantId, req.user.userId, req.body.openingBalance);
  return ApiResponse.created(res, data, "Session opened");
}

export async function close(req, res) {
  const data = await service.closeSession(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Session closed");
}
