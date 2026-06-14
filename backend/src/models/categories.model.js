import pool from "../config/db.js";

export async function findCategories(tenantId) {
  const result = await pool.query(
    `SELECT id, name, color, created_at FROM product_categories
     WHERE tenant_id = $1 ORDER BY name`,
    [tenantId]
  );
  return result.rows;
}

export async function findCategoryById(tenantId, id) {
  const result = await pool.query(
    `SELECT id, name, color FROM product_categories WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function checkCategoryByName(tenantId, name, excludeId = null) {
  const result = await pool.query(
    `SELECT id FROM product_categories
     WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) ${excludeId ? "AND id != $3" : ""}`,
    excludeId ? [tenantId, name, excludeId] : [tenantId, name]
  );
  return result.rows[0] || null;
}

export async function insertCategory(tenantId, name, color) {
  const result = await pool.query(
    `INSERT INTO product_categories (tenant_id, name, color)
     VALUES ($1, $2, $3) RETURNING id, name, color, created_at`,
    [tenantId, name, color || "#6B7280"]
  );
  return result.rows[0];
}

export async function updateCategory(tenantId, id, name, color) {
  const result = await pool.query(
    `UPDATE product_categories SET name = $3, color = $4
     WHERE id = $1 AND tenant_id = $2 RETURNING id, name, color`,
    [id, tenantId, name, color]
  );
  return result.rows[0] || null;
}

export async function deleteCategory(tenantId, id) {
  const result = await pool.query(
    `DELETE FROM product_categories WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}
