import { Router } from "express";
import * as controller from "./customers.controller.js";
import { createCustomerSchema, updateCustomerSchema } from "./customers.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.post("/", validate(createCustomerSchema), asyncHandler(controller.create));
router.put("/:id", validate(updateCustomerSchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
