import { pool } from "../../config/db.js";
import { stripe } from "../../config/stripe.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateUPIQR } from "../../utils/qrGenerator.js";
import { getUpiMethod } from "../payment-methods/payment-methods.service.js";
import { broadcastTableStatusChange } from "../tables/tables.service.js";
import { logger } from "../../utils/logger.js";

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
     WHERE id = $2 AND tenant_id = $1 RETURNING table_id`,
    [tenantId, orderId]
  );

  return orderResult.rows[0]?.table_id;
}

export async function createPaymentIntent(tenantId, orderId) {
  const order = await getDraftOrder(tenantId, orderId);
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
    throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const { orderId, tenantId } = intent.metadata;

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
         WHERE id = $2 AND tenant_id = $1 RETURNING table_id`,
        [tenantId, orderId]
      );
      await client.query("COMMIT");
      await broadcastTableStatusChange(tenantId, orderResult.rows[0]?.table_id);
      logger.info("Stripe payment completed", { orderId, tenantId });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  return { received: true };
}

export async function generateUpiQR(tenantId, orderId) {
  const order = await getDraftOrder(tenantId, orderId);
  const upiMethod = await getUpiMethod(tenantId);
  if (!upiMethod?.upi_id) throw new ApiError(400, "UPI not configured");

  const qrDataUrl = await generateUPIQR(upiMethod.upi_id, order.total, order.tenant_name);
  return { qrDataUrl, amount: order.total, upiId: upiMethod.upi_id };
}

export async function confirmCashPayment(tenantId, orderId, amountTendered) {
  const order = await getDraftOrder(tenantId, orderId);
  if (amountTendered < Number(order.total)) {
    throw new ApiError(400, "Insufficient amount tendered");
  }

  const changeDue = amountTendered - Number(order.total);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tableId = await markOrderPaid(client, tenantId, orderId, {
      methodType: "cash",
      amount: order.total,
      amountTendered,
      changeDue,
    });
    await client.query("COMMIT");
    await broadcastTableStatusChange(tenantId, tableId);
    return { orderId, changeDue, status: "paid" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmUpiPayment(tenantId, orderId, upiRef) {
  const order = await getDraftOrder(tenantId, orderId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tableId = await markOrderPaid(client, tenantId, orderId, {
      methodType: "upi",
      amount: order.total,
      upiRef,
    });
    await client.query("COMMIT");
    await broadcastTableStatusChange(tenantId, tableId);
    return { orderId, status: "paid" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
