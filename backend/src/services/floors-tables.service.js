import * as model from "../models/floors-tables.model.js";
import { ApiError } from "../utils/ApiError.js";
import { broadcastToAll } from "../websocket/socket.helpers.js";

// ── Floors ────────────────────────────────────────────────────────────────────

export async function listFloors(tenantId) {
  return model.findFloors(tenantId);
}

export async function createFloor(tenantId, { name }) {
  return model.insertFloor(tenantId, name);
}

export async function updateFloor(tenantId, id, { name }) {
  const updated = await model.updateFloor(tenantId, id, name);
  if (!updated) throw new ApiError(404, "Floor not found");
  return updated;
}

export async function deleteFloor(tenantId, id) {
  const deleted = await model.deleteFloor(tenantId, id);
  if (!deleted) throw new ApiError(404, "Floor not found");
  return deleted;
}

// ── Tables ────────────────────────────────────────────────────────────────────

export async function listTables(tenantId, query) {
  return model.findTables(tenantId, query);
}

export async function createTable(tenantId, data) {
  try {
    const table = await model.insertTable(tenantId, data);
    broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: table.id });
    return table;
  } catch (err) {
    if (err.code === "23505") {
      throw new ApiError(409, "Table number already exists.");
    }
    throw err;
  }
}

export async function updateTable(tenantId, id, data) {
  try {
    const updated = await model.updateTable(tenantId, id, data);
    if (!updated) throw new ApiError(404, "Table not found");
    broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: id });
    return updated;
  } catch (err) {
    if (err.code === "23505") {
      throw new ApiError(409, "Table number already exists.");
    }
    throw err;
  }
}

export async function deleteTable(tenantId, id) {
  const deleted = await model.deleteTable(tenantId, id);
  if (!deleted) throw new ApiError(404, "Table not found");
  broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: id });
  return deleted;
}

export async function setTableStatus(tenantId, id, isActive) {
  const updated = await model.updateTableStatus(tenantId, id, isActive);
  if (!updated) throw new ApiError(404, "Table not found");
  broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: id });
  return updated;
}

export async function setTableOccupancy(tenantId, id, isOccupied) {
  const updated = await model.updateTableOccupancy(tenantId, id, isOccupied);
  if (!updated) throw new ApiError(404, "Table not found");
  broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: id });
  return updated;
}

export async function mergeTables(tenantId, primaryTableId, tableIds) {
  if (!tableIds?.length) throw new ApiError(400, "No tables to merge");
  if (tableIds.includes(primaryTableId)) throw new ApiError(400, "Primary table cannot be in merge list");
  await model.insertTableMerge(tenantId, primaryTableId, tableIds);
  broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: primaryTableId });
  return { primaryTableId, mergedTableIds: tableIds };
}

export async function unmergeTables(tenantId, tableId) {
  await model.deleteTableMerge(tenantId, tableId);
  broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId });
  return { tableId };
}
