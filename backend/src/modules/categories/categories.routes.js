import { Router } from "express";
import * as controller from "./categories.controller.js";
import { createCategorySchema, updateCategorySchema } from "./categories.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("admin"), validate(createCategorySchema), asyncHandler(controller.create));
router.put("/:id", rbac("admin"), validate(updateCategorySchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
