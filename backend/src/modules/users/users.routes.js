import { Router } from "express";
import * as controller from "./users.controller.js";
import { createUserSchema, changePasswordSchema } from "./users.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware, rbac("admin"));

router.get("/", asyncHandler(controller.list));
router.post("/", validate(createUserSchema), asyncHandler(controller.create));
router.get("/:id", asyncHandler(controller.getById));
router.patch("/:id/password", validate(changePasswordSchema), asyncHandler(controller.changePassword));
router.patch("/:id/archive", asyncHandler(controller.toggleArchive));
router.delete("/:id", asyncHandler(controller.remove));

export default router;
