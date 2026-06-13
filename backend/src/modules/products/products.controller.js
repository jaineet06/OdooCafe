import * as productsService from "./products.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function list(req, res) {
  const data = await productsService.listProducts(req.tenantId, req.query);
  return ApiResponse.success(res, data.products, "Success", 200, data.meta);
}

export async function getById(req, res) {
  const data = await productsService.getProductById(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function create(req, res) {
  const data = await productsService.createProduct(req.tenantId, req.body, req.imageUrl);
  return ApiResponse.created(res, data);
}

export async function update(req, res) {
  const data = await productsService.updateProduct(req.tenantId, req.params.id, req.body, req.imageUrl);
  return ApiResponse.success(res, data);
}

export async function softDelete(req, res) {
  const data = await productsService.softDeleteProduct(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Product deleted");
}
