import api, { unwrap } from "./axios";

export const ordersApi = {
  list: (params) => api.get("/orders", { params }).then((r) => ({ data: unwrap(r), meta: r.data.meta })),
  get: (id) => api.get(`/orders/${id}`).then(unwrap),
  preview: (data) => api.post("/orders/preview", data).then(unwrap),
  create: (data) => api.post("/orders", data).then(unwrap),
  update: (id, data) => api.put(`/orders/${id}`, data).then(unwrap),
  sendToKds: (id) => api.post(`/orders/${id}/send-to-kds`).then(unwrap),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then(unwrap),
};
