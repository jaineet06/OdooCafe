import api, { unwrap } from "./axios";

function toFormData(data) {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && k !== "image") form.append(k, v);
  });
  if (data.image) form.append("image", data.image);
  return form;
}

export const productsApi = {
  list: (params) => api.get("/products", { params }).then((r) => ({ data: unwrap(r), meta: r.data.meta })),
  get: (id) => api.get(`/products/${id}`).then(unwrap),
  create: (data) =>
    api.post("/products", toFormData(data), { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap),
  update: (id, data) =>
    api.put(`/products/${id}`, toFormData(data), { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap),
  remove: (id) => api.delete(`/products/${id}`).then(unwrap),
};
