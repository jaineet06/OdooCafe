import { Router } from "express";
import * as controller from "./payment-methods.controller.js";
import { updateUpiIdSchema } from "./payment-methods.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.patch("/:id/toggle", rbac("admin"), asyncHandler(controller.toggle));
router.patch("/:id/upi-id", rbac("admin"), validate(updateUpiIdSchema), asyncHandler(controller.updateUpiId));

export default router;
