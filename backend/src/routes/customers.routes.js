import { Router } from "express";
import * as controller from "../controllers/customers.controller.js";
import { createCustomerSchema, updateCustomerSchema } from "../validations/customers.validation.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("admin", "employee"), validate(createCustomerSchema), asyncHandler(controller.create));
router.put("/:id", rbac("admin", "employee"), validate(updateCustomerSchema), asyncHandler(controller.update));
router.delete("/:id", rbac("admin"), asyncHandler(controller.remove));

export default router;
