import { Router } from "express";
import * as controller from "./promotions.controller.js";
import { createPromotionSchema, updatePromotionSchema } from "./promotions.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", rbac("admin", "employee"), asyncHandler(controller.list));
router.post("/", rbac("admin"), validate(createPromotionSchema), asyncHandler(controller.create));
router.put("/:id", rbac("admin"), validate(updatePromotionSchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
