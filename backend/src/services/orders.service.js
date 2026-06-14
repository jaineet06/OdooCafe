import * as model from "../models/orders.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { stripe } from "../config/stripe.js";
import { env } from "../config/env.js";
import QRCode from "qrcode";
import { broadcastToAll } from "../websocket/socket.helpers.js";

function computeTotals(items, tipAmount = 0, discounts = []) {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const taxTotal = items.reduce((s, i) => s + (i.lineTotal * (i.taxRate ?? 0)) / 100, 0);
  const discountTotal = discounts.reduce((s, d) => s + d.discountAmount, 0);
  const total = subtotal + taxTotal - discountTotal + (tipAmount ?? 0);
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxTotal: parseFloat(taxTotal.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    total: parseFloat(Math.max(total, 0).toFixed(2)),
  };
}

export async function listOrders(tenantId, query) {
  return model.findOrders(tenantId, query);
}

export async function getOrder(tenantId, id) {
  const order = await model.findOrderById(tenantId, id);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export async function previewOrder(data) {
  const totals = computeTotals(data.items, data.tipAmount, data.discounts);
  return { ...totals, items: data.items };
}

export async function createOrder(tenantId, sessionId, createdBy, data) {
  const totals = computeTotals(data.items, data.tipAmount, data.discounts);
  const order = await model.insertOrder(tenantId, sessionId, createdBy, data, totals);
  logger.info("Order created", { tenantId, orderId: order.id });
  return order;
}

export async function updateOrder(tenantId, id, data) {
  const order = await model.findOrderById(tenantId, id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "draft") throw new ApiError(409, "Only draft orders can be edited");
  const totals = computeTotals(data.items, data.tipAmount, data.discounts);
  return model.insertOrder(tenantId, order.session_id, order.created_by, data, totals);
}

export async function sendOrderToKds(tenantId, id) {
  const order = await model.findOrderById(tenantId, id);
  if (!order) throw new ApiError(404, "Order not found");
  const kdsOrderId = await model.insertKdsOrder(id, tenantId);
  logger.info("Order sent to KDS", { tenantId, orderId: id, kdsOrderId });

  broadcastToAll(tenantId, "ORDER_SENT_TO_KDS", { orderId: id, kdsOrderId });
  return { kdsOrderId };
}

export async function cancelOrder(tenantId, id) {
  const order = await model.findOrderById(tenantId, id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "paid") throw new ApiError(409, "Paid orders cannot be cancelled");
  const updated = await model.updateOrderStatus(tenantId, id, "cancelled");
  if (!updated) throw new ApiError(500, "Failed to cancel order");
  return updated;
}

// ── KDS ───────────────────────────────────────────────────────────────────────

export async function listKdsOrders(tenantId, query) {
  return model.findKdsOrders(tenantId, query);
}

export async function updateKdsStage(tenantId, kdsOrderId, stage) {
  const updated = await model.updateKdsStage(tenantId, kdsOrderId, stage);
  if (!updated) throw new ApiError(404, "KDS order not found");

  broadcastToAll(tenantId, "KDS_STAGE_UPDATED", {
    kdsOrderId: updated.id,
    orderId: updated.order_id,
    newStage: updated.stage,
  });

  return updated;
}

export async function completeKdsItem(tenantId, kdsOrderId, itemId) {
  const updated = await model.updateKdsItem(tenantId, kdsOrderId, itemId);
  if (!updated) throw new ApiError(404, "KDS item not found");

  broadcastToAll(tenantId, "KDS_ITEM_COMPLETED", {
    kdsOrderId,
    orderItemId: updated.order_item_id,
  });

  return updated;
}

// ── Payment Methods ───────────────────────────────────────────────────────────

export async function listPaymentMethods(tenantId) {
  await model.upsertDefaultPaymentMethods(tenantId);
  return model.findPaymentMethods(tenantId);
}

export async function togglePaymentMethod(tenantId, id) {
  const updated = await model.togglePaymentMethod(tenantId, id);
  if (!updated) throw new ApiError(404, "Payment method not found");
  return updated;
}

export async function updateUpiId(tenantId, id, upiId) {
  const updated = await model.updateUpiId(tenantId, id, upiId);
  if (!updated) throw new ApiError(404, "Payment method not found");
  return updated;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function confirmCashPayment(tenantId, { orderId, amount, amountTendered }) {
  const order = await model.findOrderById(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const changeDue = Math.max((amountTendered ?? amount) - amount, 0);
  const payment = await model.insertPayment(tenantId, {
    orderId, methodType: "cash", amount,
    amountTendered: amountTendered ?? amount,
    changeDue, status: "completed",
  });

  await model.updateOrderStatus(tenantId, orderId, "paid");
  logger.info("Cash payment confirmed", { tenantId, orderId, paymentId: payment.id });

  broadcastToAll(tenantId, "ORDER_PAID", { orderId });
  if (order.table_id) {
    broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: order.table_id });
  }

  return { payment, changeDue };
}

export async function confirmUpiPayment(tenantId, { orderId, amount, upiRef }) {
  const order = await model.findOrderById(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const payment = await model.insertPayment(tenantId, {
    orderId, methodType: "upi", amount, upiRef, status: "completed",
  });

  await model.updateOrderStatus(tenantId, orderId, "paid");
  logger.info("UPI payment confirmed", { tenantId, orderId, paymentId: payment.id });

  broadcastToAll(tenantId, "ORDER_PAID", { orderId });
  if (order.table_id) {
    broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: order.table_id });
  }

  return { payment };
}

export async function getPaymentsConfig(tenantId) {
  await model.upsertDefaultPaymentMethods(tenantId);
  const methods = await model.findPaymentMethods(tenantId);
  return { methods };
}

export async function createPaymentIntent(tenantId, orderId) {
  const order = await model.findOrderById(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "paid") throw new ApiError(400, "Order is already paid");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: "inr",
    metadata: { tenantId, orderId },
  });

  await model.insertPayment(tenantId, {
    orderId,
    methodType: "card",
    amount: order.total,
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });

  logger.info("Created Stripe Payment Intent", { tenantId, orderId, stripeIntentId: paymentIntent.id });
  return { clientSecret: paymentIntent.client_secret };
}

export async function generateUpiQr(tenantId, orderId) {
  const methods = await model.findPaymentMethods(tenantId);
  const upiMethod = methods.find(m => m.method_type === "upi" && m.is_enabled);
  if (!upiMethod || !upiMethod.upi_id) {
    throw new ApiError(400, "UPI payments are not enabled/configured for this restaurant.");
  }

  const order = await model.findOrderById(tenantId, orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "paid") throw new ApiError(400, "Order is already paid");

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiMethod.upi_id)}&pn=OdooCafe&am=${order.total}&cu=INR`;
  const qrDataUrl = await QRCode.toDataURL(upiUri);

  logger.info("Generated UPI QR Code", { tenantId, orderId });
  return { qrDataUrl };
}

export async function handleStripeWebhook(signature, rawBody) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Stripe signature verification failed", { error: err.message });
    throw new ApiError(400, `Stripe signature verification failed: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { tenantId, orderId } = paymentIntent.metadata;

    if (tenantId && orderId) {
      const updatedPayment = await model.updatePaymentStatusByIntentId(paymentIntent.id, "completed");
      if (updatedPayment) {
        await model.updateOrderStatus(tenantId, orderId, "paid");
        logger.info("Stripe payment marked completed and order marked paid via webhook", { tenantId, orderId });

        broadcastToAll(tenantId, "ORDER_PAID", { orderId });
        const order = await model.findOrderById(tenantId, orderId);
        if (order && order.table_id) {
          broadcastToAll(tenantId, "TABLE_STATUS_CHANGED", { tableId: order.table_id });
        }
      }
    }
  }

  return { received: true };
}
