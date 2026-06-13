import { Router } from "express";
import * as controller from "./receipts.controller.js";
import { emailReceiptSchema } from "./receipts.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/:orderId/bill/pdf", asyncHandler(controller.downloadBillPDF));
router.get("/:orderId/pdf", asyncHandler(controller.downloadPDF));
router.post("/:orderId/email", validate(emailReceiptSchema), asyncHandler(controller.emailReceipt));

export default router;
