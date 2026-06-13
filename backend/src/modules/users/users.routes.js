import { Router } from "express";
import * as controller from "./users.controller.js";
import { createUserSchema, changePasswordSchema } from "./users.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", rbac("admin", "employee"), asyncHandler(controller.list));
router.get("/:id", rbac("admin", "employee"), asyncHandler(controller.getById));
router.post("/", rbac("admin"), validate(createUserSchema), asyncHandler(controller.create));
router.patch("/:id/password", rbac("admin"), validate(changePasswordSchema), asyncHandler(controller.changePassword));
router.patch("/:id/archive", rbac("admin"), asyncHandler(controller.toggleArchive));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
