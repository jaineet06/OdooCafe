import pool from "../config/db.js";

// ── Products ────────────────────────────────────────────────────────────────

export async function findProducts(tenantId, { categoryId, search, page = 1, limit = 50 } = {}) {
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

  const offset = (page - 1) * limit;
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products p WHERE ${conditions.join(" AND ")}`,
    params
  );

  const result = await pool.query(
    `SELECT p.id, p.name, p.price, p.uom, p.tax_rate, p.description,
            p.image_url, p.is_kds_visible, p.created_at,
            c.id AS category_id, c.name AS category_name, c.color AS category_color
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY p.name
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return {
    data: result.rows,
    meta: { total: parseInt(countResult.rows[0].count), page, limit },
  };
}

export async function findProductById(tenantId, id) {
  const result = await pool.query(
    `SELECT p.id, p.name, p.price, p.uom, p.tax_rate, p.description,
            p.image_url, p.is_kds_visible, p.created_at,
            c.id AS category_id, c.name AS category_name, c.color AS category_color
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.tenant_id = $2 AND p.is_deleted = FALSE`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

export async function insertProduct(tenantId, data, imageUrl) {
  const result = await pool.query(
    `INSERT INTO products (tenant_id, category_id, name, price, uom, tax_rate, description, image_url, is_kds_visible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, price, uom, tax_rate, description, image_url, is_kds_visible, created_at`,
    [
      tenantId,
      data.categoryId || null,
      data.name,
      data.price,
      data.uom || "per piece",
      data.taxRate ?? 0,
      data.description || null,
      imageUrl || null,
      data.isKdsVisible !== false,
    ]
  );
  return result.rows[0];
}

export async function updateProduct(tenantId, id, data, imageUrl) {
  const fields = [
    "name = $3",
    "price = $4",
    "uom = $5",
    "tax_rate = $6",
    "description = $7",
    "is_kds_visible = $8",
    "category_id = $9",
  ];
  const params = [
    id, tenantId,
    data.name, data.price,
    data.uom || "per piece",
    data.taxRate ?? 0,
    data.description || null,
    data.isKdsVisible !== false,
    data.categoryId || null,
  ];

  if (imageUrl !== undefined) {
    fields.push(`image_url = $${params.length + 1}`);
    params.push(imageUrl);
  }

  const result = await pool.query(
    `UPDATE products SET ${fields.join(", ")}
     WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE
     RETURNING id, name, price, uom, tax_rate, description, image_url, is_kds_visible`,
    params
  );
  return result.rows[0] || null;
}

export async function softDeleteProduct(tenantId, id) {
  const result = await pool.query(
    `UPDATE products SET is_deleted = TRUE WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}
