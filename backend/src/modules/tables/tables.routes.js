import { Router } from "express";
import * as controller from "./tables.controller.js";
import { createTableSchema, updateTableSchema, toggleStatusSchema } from "./tables.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("admin"), validate(createTableSchema), asyncHandler(controller.create));
router.put("/:id", rbac("admin"), validate(updateTableSchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));
router.patch("/:id/status", rbac("admin"), validate(toggleStatusSchema), asyncHandler(controller.toggleStatus));

export default router;
