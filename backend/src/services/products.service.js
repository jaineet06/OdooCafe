import * as model from "../models/products.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function listProducts(tenantId, query) {
  return model.findProducts(tenantId, query);
}

export async function getProduct(tenantId, id) {
  const p = await model.findProductById(tenantId, id);
  if (!p) throw new ApiError(404, "Product not found");
  return p;
}

export async function createProduct(tenantId, data, imageUrl) {
  return model.insertProduct(tenantId, data, imageUrl);
}

export async function updateProduct(tenantId, id, data, imageUrl) {
  const updated = await model.updateProduct(tenantId, id, data, imageUrl);
  if (!updated) throw new ApiError(404, "Product not found");
  return updated;
}

export async function deleteProduct(tenantId, id) {
  const deleted = await model.softDeleteProduct(tenantId, id);
  if (!deleted) throw new ApiError(404, "Product not found");
  return deleted;
}
