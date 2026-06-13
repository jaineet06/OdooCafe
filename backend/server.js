import http from "http";
import { createApp } from "./src/app.js";
import { initWebSocket } from "./src/websocket/ws.server.js";
import { logger } from "./src/utils/logger.js";
import { env } from "./src/config/env.js";

const app = createApp();
const server = http.createServer(app);
initWebSocket(server);

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection", { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});
