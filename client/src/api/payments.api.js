import api, { unwrap } from "./axios";

export const paymentsApi = {
  config: () => api.get("/payments/config").then(unwrap),
  createIntent: (orderId) => api.post("/payments/create-intent", { orderId }).then(unwrap),
  upiQr: (orderId) => api.get(`/payments/upi-qr/${orderId}`).then(unwrap),
  confirmCash: (data) => api.post("/payments/confirm-cash", data).then(unwrap),
  confirmUpi: (data) => api.post("/payments/confirm-upi", data).then(unwrap),
};
