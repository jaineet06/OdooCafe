import { Router } from "express";
import * as ctrl from "../controllers/categories-products.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { uploadSingle, uploadToCloudinary } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Categories (/api/categories) ──────────────────────────────────────────────

export const categoriesRouter = Router();
categoriesRouter.use(authMiddleware, tenantMiddleware);

categoriesRouter.get("/", asyncHandler(ctrl.listCategories));
categoriesRouter.post("/", rbac("admin"), asyncHandler(ctrl.createCategory));
categoriesRouter.put("/:id", rbac("admin"), asyncHandler(ctrl.updateCategory));
categoriesRouter.delete("/:id", rbac("admin"), asyncHandler(ctrl.deleteCategory));

// ── Products (/api/products) ──────────────────────────────────────────────────

export const productsRouter = Router();
productsRouter.use(authMiddleware, tenantMiddleware);

productsRouter.get("/", asyncHandler(ctrl.listProducts));
productsRouter.get("/:id", asyncHandler(ctrl.getProduct));
productsRouter.post(
  "/",
  rbac("admin"),
  uploadSingle,
  uploadToCloudinary,
  asyncHandler(ctrl.createProduct)
);
productsRouter.put(
  "/:id",
  rbac("admin"),
  uploadSingle,
  uploadToCloudinary,
  asyncHandler(ctrl.updateProduct)
);
productsRouter.delete("/:id", rbac("admin"), asyncHandler(ctrl.deleteProduct));
