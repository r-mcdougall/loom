import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createInvoiceSchema } from "@loom/types";
import { authGuard, type AuthVariables } from "../../shared/middleware/auth-guard";
import { createInvoice, getInvoice, listInvoices } from "./invoices.service";

export const invoicesRoutes = new Hono<{ Variables: AuthVariables }>()
  .use(authGuard)
  .get("/", async (c) => {
    const data = await listInvoices(c.get("userId"));
    return c.json({ success: true, data });
  })
  .get("/:id", async (c) => {
    const data = await getInvoice(c.get("userId"), c.req.param("id"));
    return c.json({ success: true, data });
  })
  .post("/", zValidator("json", createInvoiceSchema), async (c) => {
    const data = await createInvoice(c.get("userId"), c.req.valid("json"));
    return c.json({ success: true, data }, 201);
  });
