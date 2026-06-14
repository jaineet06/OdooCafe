import express from "express";
import helmet from "helmet";
import cors from "cors";
import { getCorsOrigin } from "./config/cors.js";
import { morganMiddleware } from "./utils/logger.js";
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import apiRouter from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: getCorsOrigin(), credentials: true }));
  app.use(morganMiddleware);
  app.use(rateLimiter);

  app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRouter);

  app.get("/health", (req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  );

  app.use(errorHandler);
  return app;
}

