import express from "express";
import helmet from "helmet";
import cors from "cors";
import { morganMiddleware } from "./utils/logger.js";
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

import authRouter from "./modules/auth/auth.routes.js";
import productRouter from "./modules/products/products.routes.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import floorsRouter from "./modules/floors/floors.routes.js";
import tablesRouter from "./modules/tables/tables.routes.js";
import paymentMethodsRouter from "./modules/payment-methods/payment-methods.routes.js";
import couponsRouter from "./modules/coupons/coupons.routes.js";
import promotionsRouter from "./modules/promotions/promotions.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import customersRouter from "./modules/customers/customers.routes.js";
import sessionsRouter from "./modules/sessions/sessions.routes.js";
import ordersRouter from "./modules/orders/orders.routes.js";
import paymentsRouter from "./modules/payments/payments.routes.js";
import kdsRouter from "./modules/kds/kds.routes.js";
import reportsRouter from "./modules/reports/reports.routes.js";
import receiptsRouter from "./modules/receipts/receipts.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
  app.use(morganMiddleware);
  app.use(rateLimiter);

  app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/products", productRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/floors", floorsRouter);
  app.use("/api/tables", tablesRouter);
  app.use("/api/payment-methods", paymentMethodsRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/promotions", promotionsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/sessions", sessionsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/kds", kdsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/receipts", receiptsRouter);

  app.get("/health", (req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  );

  app.use(errorHandler);
  return app;
}
