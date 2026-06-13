import api, { unwrap } from "./axios";

export const customersApi = {
  list: (params) => api.get("/customers", { params }).then(unwrap),
  create: (data) => api.post("/customers", data).then(unwrap),
  update: (id, data) => api.put(`/customers/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/customers/${id}`).then(unwrap),
};
