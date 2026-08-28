import { app } from "./app";
import { env } from "./env";
import { logger } from "./shared/logger";

logger.info("api started", {
  port: env.PORT,
  env: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
});

export default {
  port: env.PORT,
  fetch: app.fetch,
};
