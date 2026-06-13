import * as service from "./payments.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export async function createIntent(req, res) {
  const data = await service.createPaymentIntent(req.tenantId, req.body.orderId);
  return ApiResponse.success(res, data);
}

export async function webhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const data = await service.handleStripeWebhook(req.body, sig);
  return res.json(data);
}

export async function upiQR(req, res) {
  const data = await service.generateUpiQR(req.tenantId, req.params.orderId);
  return ApiResponse.success(res, data);
}

export async function confirmCash(req, res) {
  const { orderId, amountTendered } = req.body;
  const data = await service.confirmCashPayment(req.tenantId, orderId, amountTendered);
  return ApiResponse.success(res, data, "Cash payment confirmed");
}

export async function confirmUpi(req, res) {
  const { orderId, upiRef } = req.body;
  const data = await service.confirmUpiPayment(req.tenantId, orderId, upiRef);
  return ApiResponse.success(res, data, "UPI payment confirmed");
}
