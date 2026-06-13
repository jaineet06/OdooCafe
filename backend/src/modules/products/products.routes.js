import { Router } from "express";
import * as controller from "./products.controller.js";
import { createProductSchema, updateProductSchema } from "./products.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadSingle, uploadToCloudinary } from "../../middleware/upload.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", rbac("admin", "employee", "kds_device"), asyncHandler(controller.list));
router.post(
  "/",
  rbac("admin"),
  uploadSingle,
  uploadToCloudinary,
  validate(createProductSchema),
  asyncHandler(controller.create)
);
router.get("/:id", rbac("admin", "employee"), asyncHandler(controller.getById));
router.put(
  "/:id",
  rbac("admin"),
  uploadSingle,
  uploadToCloudinary,
  validate(updateProductSchema),
  asyncHandler(controller.update)
);
router.delete("/:id", rbac("admin"), asyncHandler(controller.softDelete));

export default router;
