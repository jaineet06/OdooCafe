import { Router } from "express";
import * as ctrl from "../controllers/orders.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Payments (/api/payments) ──────────────────────────────────────────────────

export const paymentsRouter = Router();

// Stripe Webhook does not use auth/tenant middleware (public endpoint verified via signature)
paymentsRouter.post("/webhook", asyncHandler(ctrl.stripeWebhook));

// Protected payment endpoints
paymentsRouter.use(authMiddleware, tenantMiddleware);
paymentsRouter.get("/config", asyncHandler(ctrl.getPaymentsConfig));
paymentsRouter.post("/create-intent", asyncHandler(ctrl.createPaymentIntent));
paymentsRouter.get("/upi-qr/:orderId", asyncHandler(ctrl.generateUpiQr));
paymentsRouter.post("/confirm-cash", asyncHandler(ctrl.confirmCashPayment));
paymentsRouter.post("/confirm-upi", asyncHandler(ctrl.confirmUpiPayment));

// ── Payment Methods (/api/payment-methods) ────────────────────────────────────

export const paymentMethodsRouter = Router();
paymentMethodsRouter.use(authMiddleware, tenantMiddleware);

paymentMethodsRouter.get("/", asyncHandler(ctrl.listPaymentMethods));
paymentMethodsRouter.patch("/:id/toggle", rbac("admin"), asyncHandler(ctrl.togglePaymentMethod));
paymentMethodsRouter.patch("/:id/upi-id", rbac("admin"), asyncHandler(ctrl.updateUpiId));
