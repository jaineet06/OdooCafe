import { Router } from "express";
import * as ctrl from "../controllers/floors-tables.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { rbac } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Floors (/api/floors) ──────────────────────────────────────────────────────

export const floorsRouter = Router();
floorsRouter.use(authMiddleware, tenantMiddleware);

floorsRouter.get("/", asyncHandler(ctrl.listFloors));
floorsRouter.post("/", rbac("admin"), asyncHandler(ctrl.createFloor));
floorsRouter.put("/:id", rbac("admin"), asyncHandler(ctrl.updateFloor));
floorsRouter.delete("/:id", rbac("admin"), asyncHandler(ctrl.deleteFloor));

// ── Tables (/api/tables) ──────────────────────────────────────────────────────

export const tablesRouter = Router();
tablesRouter.use(authMiddleware, tenantMiddleware);

tablesRouter.get("/", asyncHandler(ctrl.listTables));
tablesRouter.post("/", rbac("admin"), asyncHandler(ctrl.createTable));
tablesRouter.post("/merge", rbac("admin", "employee"), asyncHandler(ctrl.mergeTables));
tablesRouter.post("/unmerge", rbac("admin", "employee"), asyncHandler(ctrl.unmergeTables));
tablesRouter.put("/:id", rbac("admin"), asyncHandler(ctrl.updateTable));
tablesRouter.delete("/:id", rbac("admin"), asyncHandler(ctrl.deleteTable));
tablesRouter.patch("/:id/status", rbac("admin"), asyncHandler(ctrl.setTableStatus));
tablesRouter.patch("/:id/occupancy", asyncHandler(ctrl.setTableOccupancy));
