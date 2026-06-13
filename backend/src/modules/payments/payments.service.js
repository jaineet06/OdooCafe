import pool from "../../config/db.js";
import { stripe } from "../../config/stripe.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateUPIQR } from "../../utils/qrGenerator.js";
import { getUpiMethod } from "../payment-methods/payment-methods.service.js";
import { broadcastTableStatusChange } from "../tables/tables.service.js";
import { assertOrderSessionOpen } from "../sessions/sessionGuards.js";
import { broadcastToPOS } from "../../websocket/ws.helpers.js";
import { WS_EVENTS } from "../../websocket/ws.events.js";
import { logger } from "../../utils/logger.js";

async function notifyPaymentComplete(tenantId, order, paymentMethod) {
  await broadcastTableStatusChange(tenantId, order.table_id);
  broadcastToPOS(tenantId, WS_EVENTS.ORDER_PAID, {
    orderId: order.id,
    orderNumber: order.order_number,
    tableId: order.table_id,
    total: order.total,
    paymentMethod,
    status: "paid",
  });
}

async function getDraftOrder(tenantId, orderId) {
  const result = await pool.query(
    `SELECT o.*, t.name AS tenant_name FROM orders o
     JOIN tenants t ON t.id = o.tenant_id
     WHERE o.id = $1 AND o.tenant_id = $2 AND o.status = 'draft'`,
    [orderId, tenantId]
  );
  if (result.rows.length === 0) throw new ApiError(404, "Draft order not found");
  return result.rows[0];
}

async function markOrderPaid(client, tenantId, orderId, paymentData) {
  await client.query(
    `INSERT INTO payments (order_id, tenant_id, method_type, amount, amount_tendered, change_due, stripe_payment_intent_id, upi_ref, card_ref, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')`,
    [
      orderId,
      tenantId,
      paymentData.methodType,
      paymentData.amount,
      paymentData.amountTendered || null,
      paymentData.changeDue || null,
      paymentData.stripePaymentIntentId || null,
      paymentData.upiRef || null,
      paymentData.cardRef || null,
    ]
  );

  const orderResult = await client.query(
    `UPDATE orders SET status = 'paid', updated_at = NOW()
     WHERE id = $2 AND tenant_id = $1 RETURNING id, order_number, table_id`,
    [tenantId, orderId]
  );

  return orderResult.rows[0];
}

async function findPaymentByIntentId(intentId) {
  const result = await pool.query(
    `SELECT p.*, o.status AS order_status FROM payments p
     JOIN orders o ON o.id = p.order_id AND o.tenant_id = p.tenant_id
     WHERE p.stripe_payment_intent_id = $1`,
    [intentId]
  );
  return result.rows[0] || null;
}

async function handlePaymentSucceeded(intent) {
  const payment = await findPaymentByIntentId(intent.id);
  if (!payment) {
    logger.warn("Stripe webhook: payment row not found for intent", { intentId: intent.id });
    return;
  }

  const tenantId = payment.tenant_id;
  const orderId = payment.order_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE payments SET status = 'completed', card_ref = $3, amount = $4
       WHERE stripe_payment_intent_id = $1 AND tenant_id = $2`,
      [intent.id, tenantId, intent.id, intent.amount / 100]
    );

    const orderResult = await client.query(
      `UPDATE orders SET status = 'paid', updated_at = NOW()
       WHERE id = $2 AND tenant_id = $1 AND status = 'draft'
       RETURNING id, order_number, table_id`,
      [tenantId, orderId]
    );

    await client.query("COMMIT");

    if (orderResult.rows.length > 0) {
      const order = orderResult.rows[0];
      await notifyPaymentComplete(tenantId, { ...order, total: intent.amount / 100 }, "card");
      logger.info("Stripe payment completed", { orderId, tenantId, intentId: intent.id });
    } else {
      logger.info("Stripe payment already processed or order not draft", { orderId, tenantId });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function handlePaymentFailed(intent) {
  const payment = await findPaymentByIntentId(intent.id);
  if (!payment) {
    logger.warn("Stripe webhook: payment row not found for failed intent", { intentId: intent.id });
    return;
  }

  await pool.query(
    `UPDATE payments SET status = 'failed'
     WHERE stripe_payment_intent_id = $1 AND tenant_id = $2`,
    [intent.id, payment.tenant_id]
  );

  logger.error("Stripe payment failed", {
    intentId: intent.id,
    tenantId: payment.tenant_id,
    orderId: payment.order_id,
    reason: intent.last_payment_error?.message,
  });
}

async function handlePaymentCanceled(intent) {
  const payment = await findPaymentByIntentId(intent.id);
  if (!payment) {
    logger.info("Stripe webhook: payment row not found for canceled intent", { intentId: intent.id });
    return;
  }

  await pool.query(
    `UPDATE payments SET status = 'failed'
     WHERE stripe_payment_intent_id = $1 AND tenant_id = $2`,
    [intent.id, payment.tenant_id]
  );

  logger.info("Stripe payment canceled", {
    intentId: intent.id,
    tenantId: payment.tenant_id,
    orderId: payment.order_id,
  });
}

export async function createPaymentIntent(tenantId, orderId) {
  await assertOrderSessionOpen(tenantId, orderId);
  const order = await getDraftOrder(tenantId, orderId);

  const existing = await pool.query(
    `SELECT stripe_payment_intent_id FROM payments
     WHERE order_id = $1 AND tenant_id = $2 AND method_type = 'card' AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [orderId, tenantId]
  );
  if (existing.rows[0]?.stripe_payment_intent_id) {
    const intent = await stripe.paymentIntents.retrieve(existing.rows[0].stripe_payment_intent_id);
    if (intent.status !== "canceled") {
      return { clientSecret: intent.client_secret };
    }
  }

  const amount = Math.round(Number(order.total) * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    metadata: { orderId, tenantId },
  });

  await pool.query(
    `INSERT INTO payments (order_id, tenant_id, method_type, amount, stripe_payment_intent_id, status)
     VALUES ($1, $2, 'card', $3, $4, 'pending')`,
    [orderId, tenantId, order.total, intent.id]
  );

  return { clientSecret: intent.client_secret };
}

export async function handleStripeWebhook(rawBody, signature) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", { error: err.message });
    throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
  }

  logger.info("Stripe webhook received", { type: event.type, id: event.id });

  try {
    const intent = event.data.object;

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(intent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(intent);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(intent);
        break;
      default:
        logger.debug("Stripe webhook unhandled event type", { type: event.type });
    }

    logger.info("Stripe webhook processed", { type: event.type, id: event.id });
  } catch (err) {
    logger.error("Stripe webhook processing error", {
      type: event.type,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }

  return { received: true };
}

export async function getPaymentConfig() {
  return { publishableKey: env.STRIPE_PUBLISHABLE_KEY || "" };
}

export async function generateUpiQR(tenantId, orderId) {
  await assertOrderSessionOpen(tenantId, orderId);
  const order = await getDraftOrder(tenantId, orderId);
  const upiMethod = await getUpiMethod(tenantId);
  if (!upiMethod?.upi_id) throw new ApiError(400, "UPI not configured");

  const qrDataUrl = await generateUPIQR(upiMethod.upi_id, order.total, order.tenant_name);
  return { qrDataUrl, amount: order.total, upiId: upiMethod.upi_id };
}

export async function confirmCashPayment(tenantId, orderId, amountTendered) {
  await assertOrderSessionOpen(tenantId, orderId);
  const order = await getDraftOrder(tenantId, orderId);
  if (amountTendered < Number(order.total)) {
    throw new ApiError(400, "Insufficient amount tendered");
  }

  const changeDue = amountTendered - Number(order.total);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const paid = await markOrderPaid(client, tenantId, orderId, {
      methodType: "cash",
      amount: order.total,
      amountTendered,
      changeDue,
    });
    await client.query("COMMIT");
    await notifyPaymentComplete(tenantId, { ...paid, total: order.total }, "cash");
    return { orderId, changeDue, status: "paid" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmUpiPayment(tenantId, orderId, upiRef) {
  await assertOrderSessionOpen(tenantId, orderId);
  const order = await getDraftOrder(tenantId, orderId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const paid = await markOrderPaid(client, tenantId, orderId, {
      methodType: "upi",
      amount: order.total,
      upiRef,
    });
    await client.query("COMMIT");
    await notifyPaymentComplete(tenantId, { ...paid, total: order.total }, "upi");
    return { orderId, status: "paid" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
