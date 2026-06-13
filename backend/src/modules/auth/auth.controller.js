import * as authService from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function signup(req, res) {
  const result = await authService.signup(req.body);
  return ApiResponse.created(res, result, "Account created successfully");
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, "Login successful");
}

export async function registerKDS(req, res) {
  const result = await authService.registerKDS(req.tenantId);
  return ApiResponse.created(res, result, "KDS device registered");
}

export async function logout(req, res) {
  const result = await authService.logout();
  return ApiResponse.success(res, result, "Logged out");
}
