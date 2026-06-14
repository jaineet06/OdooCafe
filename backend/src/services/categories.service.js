import * as model from "../models/categories.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function listCategories(tenantId) {
  return model.findCategories(tenantId);
}

export async function createCategory(tenantId, { name, color }) {
  const existing = await model.checkCategoryByName(tenantId, name);
  if (existing) throw new ApiError(409, "Category name already exists");
  return model.insertCategory(tenantId, name, color);
}

export async function updateCategory(tenantId, id, { name, color }) {
  const existing = await model.checkCategoryByName(tenantId, name, id);
  if (existing) throw new ApiError(409, "Category name already exists");
  const updated = await model.updateCategory(tenantId, id, name, color);
  if (!updated) throw new ApiError(404, "Category not found");
  return updated;
}

export async function deleteCategory(tenantId, id) {
  const deleted = await model.deleteCategory(tenantId, id);
  if (!deleted) throw new ApiError(404, "Category not found");
  return deleted;
}
