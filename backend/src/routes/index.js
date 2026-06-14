import { Router } from "express";
import authRouter from "./auth.routes.js";
import customersRouter from "./customers.routes.js";
import { couponsRouter, promotionsRouter } from "./coupons-promotions.routes.js";
import usersRouter from "./users.routes.js";
import reportsRouter from "./reports.routes.js";
import sessionsRouter from "./sessions.routes.js";
import { categoriesRouter, productsRouter } from "./categories-products.routes.js";
import { floorsRouter, tablesRouter } from "./floors-tables.routes.js";
import { ordersRouter, kdsRouter } from "./orders.routes.js";
import { paymentsRouter, paymentMethodsRouter } from "./payments.routes.js";
import { receiptsRouter } from "./receipts.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/coupons", couponsRouter);
apiRouter.use("/promotions", promotionsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/floors", floorsRouter);
apiRouter.use("/tables", tablesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/kds", kdsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/payment-methods", paymentMethodsRouter);
apiRouter.use("/receipts", receiptsRouter);

export default apiRouter;
