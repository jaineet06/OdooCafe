import api, { unwrap } from "./axios";

export const categoriesApi = {
  list: () => api.get("/categories").then(unwrap),
  create: (data) => api.post("/categories", data).then(unwrap),
  update: (id, data) => api.put(`/categories/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/categories/${id}`).then(unwrap),
};
