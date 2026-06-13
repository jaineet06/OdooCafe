import { Router } from "express";
import * as controller from "./sessions.controller.js";
import { openSessionSchema } from "./sessions.validation.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { rbac } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", rbac("admin"), asyncHandler(controller.list));
router.get("/current", asyncHandler(controller.getCurrent));
router.post("/open", rbac("admin", "employee"), validate(openSessionSchema), asyncHandler(controller.open));
router.post("/:id/close", rbac("admin"), asyncHandler(controller.close));

export default router;
