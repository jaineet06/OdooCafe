import * as service from "../services/orders.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ── Orders ────────────────────────────────────────────────────────────────────

export async function listOrders(req, res) {
  const result = await service.listOrders(req.tenantId, req.query);
  return res.json({ success: true, message: "Success", data: result.data, meta: result.meta });
}

export async function getOrder(req, res) {
  const data = await service.getOrder(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function previewOrder(req, res) {
  const data = await service.previewOrder(req.tenantId, req.body);
  return ApiResponse.success(res, data);
}

export async function createOrder(req, res) {
  const session = req.currentSession;
  if (!session) return ApiResponse.success(res, null, "No active session", 409);
  const data = await service.createOrder(req.tenantId, session.id, req.user.userId, req.body);
  return ApiResponse.created(res, data);
}

export async function updateOrder(req, res) {
  const data = await service.updateOrder(req.tenantId, req.params.id, req.body);
  return ApiResponse.success(res, data);
}

export async function sendToKds(req, res) {
  const data = await service.sendOrderToKds(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Order sent to KDS");
}

export async function cancelOrder(req, res) {
  const data = await service.cancelOrder(req.tenantId, req.params.id);
  return ApiResponse.success(res, data, "Order cancelled");
}

// ── KDS ───────────────────────────────────────────────────────────────────────

export async function listKdsOrders(req, res) {
  const data = await service.listKdsOrders(req.tenantId, req.query);
  return ApiResponse.success(res, data);
}

export async function updateKdsStage(req, res) {
  const data = await service.updateKdsStage(req.tenantId, req.params.id, req.body.stage);
  return ApiResponse.success(res, data);
}

export async function completeKdsItem(req, res) {
  const data = await service.completeKdsItem(req.tenantId, req.params.kdsOrderId, req.params.itemId);
  return ApiResponse.success(res, data);
}

// ── Payment Methods ───────────────────────────────────────────────────────────

export async function listPaymentMethods(req, res) {
  const data = await service.listPaymentMethods(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function togglePaymentMethod(req, res) {
  const data = await service.togglePaymentMethod(req.tenantId, req.params.id);
  return ApiResponse.success(res, data);
}

export async function updateUpiId(req, res) {
  const data = await service.updateUpiId(req.tenantId, req.params.id, req.body.upiId);
  return ApiResponse.success(res, data);
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPaymentsConfig(req, res) {
  const data = await service.getPaymentsConfig(req.tenantId);
  return ApiResponse.success(res, data);
}

export async function confirmCashPayment(req, res) {
  const data = await service.confirmCashPayment(req.tenantId, req.body);
  return ApiResponse.success(res, data, "Cash payment confirmed");
}

export async function confirmUpiPayment(req, res) {
  const data = await service.confirmUpiPayment(req.tenantId, req.body);
  return ApiResponse.success(res, data, "UPI payment confirmed");
}

export async function createPaymentIntent(req, res) {
  const data = await service.createPaymentIntent(req.tenantId, req.body.orderId);
  return ApiResponse.success(res, data);
}

export async function generateUpiQr(req, res) {
  const data = await service.generateUpiQr(req.tenantId, req.params.orderId);
  return ApiResponse.success(res, data);
}

export async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  // Note: req.body is parsed as a raw Buffer due to middleware in app.js
  const result = await service.handleStripeWebhook(sig, req.body);
  return res.json(result);
}
