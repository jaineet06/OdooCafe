import http from "http";
import { createApp } from "./app.js";
import { initSocket } from "./websocket/socket.server.js";
import { logger } from "./utils/logger.js";
import { env } from "./config/env.js";

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${env.PORT} is already in use. Exiting.`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection", { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});
