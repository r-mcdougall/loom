import { createMiddleware } from "hono/factory";
import { logger } from "../logger";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
    // Set by the auth guard; present only on authenticated requests.
    userId: string;
  }
}

/**
 * Assigns a request id, echoes it back as `x-request-id`, and logs one line per
 * request once the response is ready. Only non-sensitive metadata is logged —
 * never headers, cookies or bodies.
 */
export const requestLogger = createMiddleware(async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);

  const start = performance.now();

  await next();

  const fields = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Math.round((performance.now() - start) * 10) / 10,
    userId: c.get("userId"),
  };

  if (c.res.status >= 500) {
    logger.error("request", fields);
  } else if (c.res.status >= 400) {
    logger.warn("request", fields);
  } else {
    logger.info("request", fields);
  }
});
