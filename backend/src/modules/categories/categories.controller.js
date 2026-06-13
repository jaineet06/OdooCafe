import * as categoriesService from "./categories.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await categoriesService.listCategories(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await categoriesService.createCategory(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await categoriesService.updateCategory(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function remove(req, res) {
  const data = await categoriesService.deleteCategory(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Category deleted");
}
