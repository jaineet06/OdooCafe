import api, { unwrap } from "./axios";

export const floorsApi = {
  list: () => api.get("/floors").then(unwrap),
  create: (data) => api.post("/floors", data).then(unwrap),
  update: (id, data) => api.put(`/floors/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/floors/${id}`).then(unwrap),
};

export const tablesApi = {
  list: (params) => api.get("/tables", { params }).then(unwrap),
  create: (data) => api.post("/tables", data).then(unwrap),
  update: (id, data) => api.put(`/tables/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/tables/${id}`).then(unwrap),
  toggleStatus: (id, isActive) => api.patch(`/tables/${id}/status`, { isActive }).then(unwrap),
  setOccupancy: (id, isOccupied) => api.patch(`/tables/${id}/occupancy`, { isOccupied }).then(unwrap),
  merge: (primaryTableId, tableIds) => api.post("/tables/merge", { primaryTableId, tableIds }).then(unwrap),
  unmerge: (tableId) => api.post("/tables/unmerge", { tableId }).then(unwrap),
};
