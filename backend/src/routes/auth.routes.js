import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { loginSchema, signupSchema } from "../validations/auth.validation.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Public routes
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/signup", validate(signupSchema), asyncHandler(controller.signup));

// Protected routes (require valid JWT)
router.post("/logout", authMiddleware, asyncHandler(controller.logout));
router.post(
  "/register-kds",
  authMiddleware,
  tenantMiddleware,
  asyncHandler(controller.registerKds)
);

export default router;
