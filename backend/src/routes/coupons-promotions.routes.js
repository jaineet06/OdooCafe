import { Router } from "express";
import * as controller from "../controllers/coupons-promotions.controller.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  createPromotionSchema,
  updatePromotionSchema
} from "../validations/coupons-promotions.validation.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const couponsRouter = Router();
couponsRouter.use(authMiddleware, tenantMiddleware);

couponsRouter.get("/", rbac("admin", "employee"), asyncHandler(controller.listCoupons));
couponsRouter.post("/", rbac("admin"), validate(createCouponSchema), asyncHandler(controller.createCoupon));
couponsRouter.put("/:id", rbac("admin"), validate(updateCouponSchema), asyncHandler(controller.updateCoupon));
couponsRouter.delete("/:id", rbac("admin"), asyncHandler(controller.deleteCoupon));
couponsRouter.post("/validate", rbac("admin", "employee"), validate(validateCouponSchema), asyncHandler(controller.validateCoupon));

export const promotionsRouter = Router();
promotionsRouter.use(authMiddleware, tenantMiddleware);

promotionsRouter.get("/", rbac("admin", "employee"), asyncHandler(controller.listPromotions));
promotionsRouter.post("/", rbac("admin"), validate(createPromotionSchema), asyncHandler(controller.createPromotion));
promotionsRouter.put("/:id", rbac("admin"), validate(updatePromotionSchema), asyncHandler(controller.updatePromotion));
promotionsRouter.delete("/:id", rbac("admin"), asyncHandler(controller.deletePromotion));
