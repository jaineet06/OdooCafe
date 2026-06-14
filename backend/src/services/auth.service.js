import bcrypt from "bcryptjs";
import * as authModel from "../models/auth.model.js";
import { signToken } from "../utils/jwtHelper.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const BCRYPT_ROUNDS = 12;

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function login({ email, password }) {
  const user = await authModel.findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.is_archived) throw new ApiError(403, "Account is archived");

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  const token = signToken({
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
  });

  logger.info("User logged in", { userId: user.id, tenantId: user.tenant_id });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantSlug: user.tenant_slug,
    },
  };
}

export async function signup({ cafeName, adminName, email, password }) {
  // Check if email already exists across all tenants
  const existingUser = await authModel.findUserByEmail(email);
  if (existingUser) throw new ApiError(409, "Email already in use");

  // Generate unique slug
  let slug = slugify(cafeName);
  let existing = await authModel.findTenantBySlug(slug);
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  // Create tenant then admin user
  const tenant = await authModel.insertTenant(cafeName, slug);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await authModel.insertAdminUser(tenant.id, adminName, email, passwordHash);

  const token = signToken({
    userId: user.id,
    tenantId: tenant.id,
    role: "admin",
  });

  logger.info("New tenant signed up", { tenantId: tenant.id, userId: user.id });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    },
  };
}

export async function registerKds(tenantId, label) {
  const device = await authModel.insertKdsDevice(tenantId, label || "KDS");

  const token = signToken(
    { kdsId: device.id, tenantId, role: "kds_device" },
    "30d"
  );

  logger.info("KDS device registered", { kdsId: device.id, tenantId });

  return { token, device };
}
