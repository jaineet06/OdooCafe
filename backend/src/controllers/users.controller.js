import * as service from "../services/users.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await service.listUsers(req.tenantId, req.query);
  return ApiResponse.success(res, data);
}

export async function getById(req, res) {
  const data = await service.getUserById(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await service.createUser(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function changePassword(req, res) {
  const data = await service.changePassword(req.tenantId, req.params.id, req.body.password);
  return ApiResponse.success(res, data, "Password updated");
}

export async function toggleArchive(req, res) {
  const data = await service.toggleArchive(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await service.deleteUser(req.tenantId, req.params.id, req.user.userId);
  return ApiResponse.success(res, data, "User deleted");
}
