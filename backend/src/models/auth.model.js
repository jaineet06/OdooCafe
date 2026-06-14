import pool from "../config/db.js";

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role, u.is_archived,
            t.name AS tenant_name, t.slug AS tenant_slug
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function insertTenant(name, slug) {
  const result = await pool.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2)
     RETURNING id, name, slug`,
    [name, slug]
  );
  return result.rows[0];
}

export async function findTenantBySlug(slug) {
  const result = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function insertAdminUser(tenantId, name, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, name, email, role, created_at`,
    [tenantId, name, email, passwordHash]
  );
  return result.rows[0];
}

export async function insertKdsDevice(tenantId, label) {
  const result = await pool.query(
    `INSERT INTO kds_devices (tenant_id, label)
     VALUES ($1, $2)
     RETURNING id, tenant_id, label`,
    [tenantId, label]
  );
  return result.rows[0];
}
