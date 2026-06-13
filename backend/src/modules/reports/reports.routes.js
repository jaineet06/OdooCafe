import { Router } from "express";
import * as controller from "./reports.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware, rbac("admin"));

router.get("/dashboard", asyncHandler(controller.dashboard));
router.get("/sales-trend", asyncHandler(controller.salesTrend));
router.get("/top-products", asyncHandler(controller.topProducts));
router.get("/top-categories", asyncHandler(controller.topCategories));
router.get("/top-orders", asyncHandler(controller.topOrders));
router.get("/export", asyncHandler(controller.exportReport));

export default router;
