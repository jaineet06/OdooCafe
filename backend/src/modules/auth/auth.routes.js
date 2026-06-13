import { Router } from "express";
import * as authController from "./auth.controller.js";
import { signupSchema, loginSchema } from "./auth.validation.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/signup", validate(signupSchema), asyncHandler(authController.signup));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post(
  "/register-kds",
  authMiddleware,
  tenantMiddleware,
  rbac("admin"),
  asyncHandler(authController.registerKDS)
);
router.post("/logout", authMiddleware, asyncHandler(authController.logout));

export default router;
