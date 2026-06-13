import bcrypt from "bcryptjs";
import { pool } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { signToken } from "../../utils/jwtHelper.js";
import { slugify } from "../../utils/slugify.js";
import { logger } from "../../utils/logger.js";

const BCRYPT_ROUNDS = 12;

async function seedPaymentMethods(client, tenantId) {
  const methods = ["cash", "card", "upi"];
  for (const method of methods) {
    await client.query(
      `INSERT INTO payment_methods (tenant_id, method_type, is_enabled) VALUES ($1, $2, TRUE)`,
      [tenantId, method]
    );
  }
}

export async function signup(data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [data.email]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, "Email already registered");
    }

    const slug = slugify(data.tenantName);
    const slugCheck = await client.query(`SELECT id FROM tenants WHERE slug = $1`, [slug]);
    if (slugCheck.rows.length > 0) {
      throw new ApiError(409, "Tenant name already taken");
    }

    const tenantResult = await client.query(
      `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING *`,
      [data.tenantName, slug]
    );
    const tenant = tenantResult.rows[0];

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const userResult = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING id, tenant_id, name, email, role, created_at`,
      [tenant.id, data.name, data.email, passwordHash]
    );
    const user = userResult.rows[0];

    await seedPaymentMethods(client, tenant.id);
    await client.query("COMMIT");

    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
    logger.info("New tenant signup", { tenantId: tenant.id, email: data.email });

    return { tenant, user, token };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function login(data) {
  const result = await pool.query(
    `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.password_hash, u.is_archived
     FROM users u WHERE u.email = $1`,
    [data.email]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const user = result.rows[0];
  if (user.is_archived) {
    throw new ApiError(403, "Account is archived");
  }

  const valid = await bcrypt.compare(data.password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, tenantId: user.tenant_id, role: user.role });
  logger.info("User login", { userId: user.id, tenantId: user.tenant_id });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function registerKDS(tenantId) {
  const label = `KDS-${Date.now()}`;
  const deviceResult = await pool.query(
    `INSERT INTO kds_devices (tenant_id, label, last_seen_at) VALUES ($1, $2, NOW()) RETURNING *`,
    [tenantId, label]
  );
  const device = deviceResult.rows[0];

  const token = signToken(
    { userId: device.id, tenantId, role: "kds_device" },
    "365d"
  );

  logger.info("KDS device registered", { deviceId: device.id, tenantId });
  return { token, device: { id: device.id, label: device.label } };
}

export async function logout() {
  return { message: "Logged out successfully" };
}
