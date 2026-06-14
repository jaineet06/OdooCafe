import * as customersModel from "../models/customers.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function listCustomers(tenantId, { search } = {}) {
  const conditions = ["tenant_id = $1"];
  const params = [tenantId];
  if (search) {
    conditions.push(`(name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`);
    params.push(`%${search}%`);
  }
  return customersModel.findCustomers(conditions, params);
}

export async function createCustomer(tenantId, data) {
  return customersModel.insertCustomer(tenantId, data);
}

export async function updateCustomer(tenantId, id, data) {
  const fields = [];
  const values = [tenantId, id];
  let idx = 3;
  for (const key of ["name", "email", "phone"]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key] || null);
    }
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const updated = await customersModel.updateCustomer(tenantId, id, fields, values);
  if (!updated) throw new ApiError(404, "Customer not found");
  return updated;
}

export async function deleteCustomer(tenantId, id) {
  const deleted = await customersModel.deleteCustomer(tenantId, id);
  if (!deleted) throw new ApiError(404, "Customer not found");
  return deleted;
}
