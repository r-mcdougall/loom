import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { env } from "../../env";
import { AppError } from "../errors";
import { logger } from "../logger";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, message: err.message }, err.status as never);
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join(", ");
    return c.json({ success: false, message }, 400);
  }

  logger.error("unhandled error", {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    name: err.name,
    error: err.message,
    stack: env.NODE_ENV === "production" ? undefined : err.stack,
  });

  return c.json({ success: false, message: "Internal server error" }, 500);
};
