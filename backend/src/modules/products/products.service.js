import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";

export async function listProducts(tenantId, { categoryId, search, page, limit }) {
  const { page: p, limit: l, offset } = getPagination({ page, limit });
  const conditions = ["p.tenant_id = $1", "p.is_deleted = FALSE"];
  const params = [tenantId];
  let idx = 2;

  if (categoryId) {
    conditions.push(`p.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (search) {
    conditions.push(`p.name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const where = conditions.join(" AND ");
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products p WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(l, offset);
  const result = await pool.query(
    `SELECT p.id, p.name, p.category_id, p.price, p.uom, p.tax_rate, p.description,
            p.image_url, p.is_kds_visible, p.created_at,
            c.name AS category_name, c.color AS category_color
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
     WHERE ${where}
     ORDER BY p.name
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return { products: result.rows, meta: paginationMeta(total, p, l) };
}

export async function getProductById(tenantId, id) {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.tenant_id = $2 AND p.is_deleted = FALSE`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Product not found");
  return result.rows[0];
}

export async function createProduct(tenantId, data, imageUrl) {
  const result = await pool.query(
    `INSERT INTO products (tenant_id, category_id, name, price, uom, tax_rate, description, image_url, is_kds_visible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      tenantId,
      data.categoryId || null,
      data.name,
      data.price,
      data.uom || "per piece",
      data.taxRate ?? 0,
      data.description || null,
      imageUrl || null,
      data.isKdsVisible ?? true,
    ]
  );
  return result.rows[0];
}

export async function updateProduct(tenantId, id, data, imageUrl) {
  const existing = await pool.query(
    `SELECT id FROM products WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE`,
    [id, tenantId]
  );
  if (existing.rows.length === 0) throw new ApiError(404, "Product not found");

  const fields = [];
  const values = [tenantId, id];
  let idx = 3;

  const map = {
    name: "name",
    categoryId: "category_id",
    price: "price",
    uom: "uom",
    taxRate: "tax_rate",
    description: "description",
    isKdsVisible: "is_kds_visible",
  };

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }
  if (imageUrl) {
    fields.push(`image_url = $${idx++}`);
    values.push(imageUrl);
  }

  if (fields.length === 0) return getProductById(tenantId, id);

  const result = await pool.query(
    `UPDATE products SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function softDeleteProduct(tenantId, id) {
  const result = await pool.query(
    `UPDATE products SET is_deleted = TRUE WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Product not found");
  return { id };
}
