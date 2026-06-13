import api, { unwrap } from "./axios";

export const paymentMethodsApi = {
  list: () => api.get("/payment-methods").then(unwrap),
  toggle: (id) => api.patch(`/payment-methods/${id}/toggle`).then(unwrap),
  updateUpiId: (id, upiId) => api.patch(`/payment-methods/${id}/upi-id`, { upiId }).then(unwrap),
};

export const couponsApi = {
  list: () => api.get("/coupons").then(unwrap),
  create: (data) => api.post("/coupons", data).then(unwrap),
  update: (id, data) => api.put(`/coupons/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/coupons/${id}`).then(unwrap),
  validate: (data) => api.post("/coupons/validate", data).then(unwrap),
};

export const promotionsApi = {
  list: () => api.get("/promotions").then(unwrap),
  create: (data) => api.post("/promotions", data).then(unwrap),
  update: (id, data) => api.put(`/promotions/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/promotions/${id}`).then(unwrap),
};

export const usersApi = {
  list: (params) => api.get("/users", { params }).then(unwrap),
  get: (id) => api.get(`/users/${id}`).then(unwrap),
  create: (data) => api.post("/users", data).then(unwrap),
  changePassword: (id, password) => api.patch(`/users/${id}/password`, { password }).then(unwrap),
  toggleArchive: (id) => api.patch(`/users/${id}/archive`).then(unwrap),
  remove: (id) => api.delete(`/users/${id}`).then(unwrap),
};

export const kdsApi = {
  list: () => api.get("/kds/orders").then(unwrap),
  search: (params) => api.get("/kds/orders/search", { params }).then(unwrap),
  updateStage: (id, stage) => api.put(`/kds/orders/${id}/stage`, { stage }).then(unwrap),
  completeItem: (kdsOrderId, itemId) =>
    api.put(`/kds/orders/${kdsOrderId}/items/${itemId}`).then(unwrap),
};

export const reportsApi = {
  dashboard: (params) => api.get("/reports/dashboard", { params }).then((r) => r.data.data),
  salesTrend: (params) => api.get("/reports/sales-trend", { params }).then((r) => r.data.data),
  topProducts: (params) => api.get("/reports/top-products", { params }).then((r) => r.data.data),
  topCategories: (params) => api.get("/reports/top-categories", { params }).then((r) => r.data.data),
  topOrders: (params) => api.get("/reports/top-orders", { params }).then((r) => r.data.data),
  orderStatus: () => api.get("/reports/order-status").then((r) => r.data.data),
  exportUrl: (params) => {
    const qs = new URLSearchParams(params).toString();
    return `${import.meta.env.VITE_API_BASE_URL || "/api"}/reports/export?${qs}`;
  },
  exportBlob: async (params) => {
    const qs = new URLSearchParams(params).toString();
    const token = localStorage.getItem("odoo_token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/reports/export?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

export const receiptsApi = {
  pdfUrl: (orderId) => `${import.meta.env.VITE_API_BASE_URL || "/api"}/receipts/${orderId}/pdf`,
  pdfBlob: async (orderId) => {
    const token = localStorage.getItem("odoo_token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/receipts/${orderId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Receipt download failed");
    return res.blob();
  },
  billBlob: async (orderId) => {
    const token = localStorage.getItem("odoo_token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/receipts/${orderId}/bill/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Bill download failed");
    return res.blob();
  },
  email: (orderId, email) => api.post(`/receipts/${orderId}/email`, { email }).then(unwrap),
};
