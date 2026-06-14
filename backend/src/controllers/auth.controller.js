import * as service from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export async function login(req, res) {
  const data = await service.login(req.body);
  return ApiResponse.success(res, data, "Login successful");
}

export async function signup(req, res) {
  const data = await service.signup(req.body);
  return ApiResponse.created(res, data, "Account created successfully");
}

export async function logout(req, res) {
  // JWT is stateless; logout is handled client-side by discarding the token.
  // If you later add a token blacklist / refresh tokens, invalidate here.
  return ApiResponse.success(res, null, "Logged out successfully");
}

export async function registerKds(req, res) {
  const { label } = req.body || {};
  const data = await service.registerKds(req.tenantId, label);
  return ApiResponse.created(res, data, "KDS device registered");
}
