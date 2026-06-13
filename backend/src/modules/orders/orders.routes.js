import { Router } from "express";
import * as controller from "./orders.controller.js";
import { createOrderSchema, updateOrderSchema } from "./orders.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("admin", "employee"), validate(createOrderSchema), asyncHandler(controller.create));
router.get("/:id", asyncHandler(controller.getById));
router.put("/:id", rbac("admin", "employee"), validate(updateOrderSchema), asyncHandler(controller.update));
router.post("/:id/send-to-kds", rbac("admin", "employee"), asyncHandler(controller.sendToKDS));
router.post("/:id/cancel", rbac("admin"), asyncHandler(controller.cancel));

export default router;
