import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { env } from "../../env";
import { UnauthorizedError } from "../errors";

export type AuthVariables = {
  userId: string;
};

export const authGuard = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    throw new UnauthorizedError("Missing access token");
  }

  try {
    const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");
    if (typeof payload.sub !== "string") {
      throw new UnauthorizedError("Invalid access token");
    }
    c.set("userId", payload.sub);
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  await next();
});
