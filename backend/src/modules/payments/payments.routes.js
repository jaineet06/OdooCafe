import { Router } from "express";
import * as controller from "./payments.controller.js";
import { createIntentSchema, confirmCashSchema, confirmUpiSchema } from "./payments.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/webhook", asyncHandler(controller.webhook));

router.use(authMiddleware, tenantMiddleware);

router.post("/create-intent", rbac("admin", "employee"), validate(createIntentSchema), asyncHandler(controller.createIntent));
router.get("/upi-qr/:orderId", asyncHandler(controller.upiQR));
router.post("/confirm-cash", rbac("admin", "employee"), validate(confirmCashSchema), asyncHandler(controller.confirmCash));
router.post("/confirm-upi", rbac("admin", "employee"), validate(confirmUpiSchema), asyncHandler(controller.confirmUpi));

export default router;
