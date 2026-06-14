import { Router } from "express";
import * as ctrl from "../controllers/orders.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { sessionMiddleware } from "../middleware/session.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── POS Orders (/api/orders) ──────────────────────────────────────────────────

export const ordersRouter = Router();
ordersRouter.use(authMiddleware, tenantMiddleware);

ordersRouter.get("/", asyncHandler(ctrl.listOrders));
ordersRouter.get("/:id", asyncHandler(ctrl.getOrder));
ordersRouter.post("/preview", asyncHandler(ctrl.previewOrder));
ordersRouter.post("/", rbac("admin", "employee"), sessionMiddleware, asyncHandler(ctrl.createOrder));
ordersRouter.put("/:id", rbac("admin", "employee"), asyncHandler(ctrl.updateOrder));
ordersRouter.post("/:id/send-to-kds", rbac("admin", "employee"), asyncHandler(ctrl.sendToKds));
ordersRouter.post("/:id/cancel", rbac("admin"), asyncHandler(ctrl.cancelOrder));

// ── KDS Device Endpoints (/api/kds) ──────────────────────────────────────────

export const kdsRouter = Router();
kdsRouter.use(authMiddleware, tenantMiddleware);

kdsRouter.get("/orders", rbac("admin", "employee", "kds_device"), asyncHandler(ctrl.listKdsOrders));
kdsRouter.put("/orders/:id/stage", rbac("admin", "employee", "kds_device"), asyncHandler(ctrl.updateKdsStage));
kdsRouter.put("/orders/:kdsOrderId/items/:itemId", rbac("admin", "employee", "kds_device"), asyncHandler(ctrl.completeKdsItem));
