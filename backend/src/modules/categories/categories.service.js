import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listCategories(tenantId) {
  const result = await pool.query(
    `SELECT id, name, color, created_at FROM product_categories
     WHERE tenant_id = $1 ORDER BY name`,
    [tenantId]
  );
  return result.rows;
}

export async function createCategory(tenantId, data) {
  try {
    const result = await pool.query(
      `INSERT INTO product_categories (tenant_id, name, color) VALUES ($1, $2, $3)
       RETURNING id, name, color, created_at`,
      [tenantId, data.name, data.color || "#6B7280"]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") throw new ApiError(409, "Category name already exists");
    throw err;
  }
}

export async function updateCategory(tenantId, id, data) {
  const existing = await pool.query(
    `SELECT id FROM product_categories WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  if (existing.rows.length === 0) throw new ApiError(404, "Category not found");

  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  if (data.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.color !== undefined) {
    fields.push(`color = $${idx++}`);
    values.push(data.color);
  }

  const result = await pool.query(
    `UPDATE product_categories SET ${fields.join(", ")} WHERE tenant_id = $1 AND id = $2
     RETURNING id, name, color, created_at`,
    values
  );
  return result.rows[0];
}

export async function deleteCategory(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM product_categories WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Category not found");
  return { id };
}
