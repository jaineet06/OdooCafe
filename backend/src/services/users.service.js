import bcrypt from "bcryptjs";
import * as usersModel from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const BCRYPT_ROUNDS = 12;

export async function listUsers(tenantId, { role, includeArchived } = {}) {
  const conditions = ["tenant_id = $1"];
  const params = [tenantId];
  let paramIdx = 2;

  if (includeArchived !== "true" && includeArchived !== true) {
    conditions.push("is_archived = FALSE");
  }

  if (role) {
    conditions.push(`role = $${paramIdx++}`);
    params.push(role);
  }

  return usersModel.findUsers(conditions, params);
}

export async function getUserById(tenantId, id) {
  const user = await usersModel.findUserById(tenantId, id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function createUser(tenantId, data) {
  const existing = await usersModel.checkUserByEmail(data.email, tenantId);
  if (existing) throw new ApiError(409, "Email already exists");

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await usersModel.insertUser(tenantId, data, passwordHash);

  logger.info("Employee created", { tenantId, userId: user.id });
  return user;
}

export async function changePassword(tenantId, id, password) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const updated = await usersModel.updateUserPassword(tenantId, id, passwordHash);
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function toggleArchive(tenantId, id) {
  const updated = await usersModel.updateUserArchive(tenantId, id);
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function deleteUser(tenantId, id, currentUserId) {
  if (id === currentUserId) throw new ApiError(400, "Cannot delete your own account");
  try {
    const deleted = await usersModel.deleteUser(tenantId, id);
    if (!deleted) throw new ApiError(404, "User not found");
    return deleted;
  } catch (err) {
    if (err.code === "23503") {
      throw new ApiError(400, "Cannot delete this employee because they have recorded sales/sessions. Please archive them instead.");
    }
    throw err;
  }
}
