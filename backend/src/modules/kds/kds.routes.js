import { Router } from "express";
import * as controller from "./kds.controller.js";
import { updateStageSchema } from "./kds.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware, rbac("kds_device", "admin", "employee"));

router.get("/orders/search", asyncHandler(controller.search));
router.get("/orders", asyncHandler(controller.list));
router.put("/orders/:id/stage", validate(updateStageSchema), asyncHandler(controller.updateStage));
router.put("/orders/:kdsOrderId/items/:itemId", asyncHandler(controller.completeItem));

export default router;
