import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "@loom/types";
import {
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./auth.service";

export const authRoutes = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const tokens = await registerUser(c.req.valid("json"));
    return c.json({ success: true, data: tokens }, 201);
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const tokens = await loginUser(c.req.valid("json"));
    return c.json({ success: true, data: tokens }, 200);
  })
  .post("/refresh", zValidator("json", refreshSchema), async (c) => {
    const tokens = await rotateRefreshToken(c.req.valid("json"));
    return c.json({ success: true, data: tokens }, 200);
  })
  .post("/logout", zValidator("json", logoutSchema), async (c) => {
    await revokeRefreshToken(c.req.valid("json"));
    return c.json({ success: true, message: "Logged out" }, 200);
  });
