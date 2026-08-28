import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createClientSchema, updateClientSchema } from "@loom/types";
import { authGuard, type AuthVariables } from "../../shared/middleware/auth-guard";
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
} from "./clients.service";

export const clientsRoutes = new Hono<{ Variables: AuthVariables }>()
  .use(authGuard)
  .get("/", async (c) => {
    const data = await listClients(c.get("userId"));
    return c.json({ success: true, data });
  })
  .get("/:id", async (c) => {
    const data = await getClient(c.get("userId"), c.req.param("id"));
    return c.json({ success: true, data });
  })
  .post("/", zValidator("json", createClientSchema), async (c) => {
    const data = await createClient(c.get("userId"), c.req.valid("json"));
    return c.json({ success: true, data }, 201);
  })
  .patch("/:id", zValidator("json", updateClientSchema), async (c) => {
    const data = await updateClient(c.get("userId"), c.req.param("id"), c.req.valid("json"));
    return c.json({ success: true, data });
  })
  .delete("/:id", async (c) => {
    await deleteClient(c.get("userId"), c.req.param("id"));
    return c.json({ success: true, message: "Client deleted" });
  });
