import { Router } from "express";
import * as controller from "./coupons.controller.js";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "./coupons.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", rbac("admin"), asyncHandler(controller.list));
router.post("/", rbac("admin"), validate(createCouponSchema), asyncHandler(controller.create));
router.post("/validate", rbac("admin", "employee"), validate(validateCouponSchema), asyncHandler(controller.validate));
router.put("/:id", rbac("admin"), validate(updateCouponSchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
