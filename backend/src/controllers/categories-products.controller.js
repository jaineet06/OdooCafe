import * as categoriesService from "../services/categories.service.js";
import * as productsService from "../services/products.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(req, res) {
  const data = await categoriesService.listCategories(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function createCategory(req, res) {
  const data = await categoriesService.createCategory(req.tenantId, req.body);
  return ApiResponse.created(res, data);
}

export async function updateCategory(req, res) {
  const data = await categoriesService.updateCategory(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function deleteCategory(req, res) {
  await categoriesService.deleteCategory(req.tenantId, req.params.id);
  return ApiResponse.success(res, null, "Category deleted");
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function listProducts(req, res) {
  const result = await productsService.listProducts(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data: result.data, meta: result.meta });
}

export async function getProduct(req, res) {
  const data = await productsService.getProduct(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function createProduct(req, res) {
  const data = await productsService.createProduct(req.tenantId, req.body, req.imageUrl);
  return ApiResponse.created(res, data);
}

export async function updateProduct(req, res) {
  const data = await productsService.updateProduct(req.tenantId, req.params.id, req.body, req.imageUrl);
  return ApiResponse.success(res, data);
}

export async function deleteProduct(req, res) {
  await productsService.deleteProduct(req.tenantId, req.params.id);
  return ApiResponse.success(res, null, "Product deleted");
}
