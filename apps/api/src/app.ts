import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./features/auth/auth.routes";
import { clientsRoutes } from "./features/clients/clients.routes";
import { invoicesRoutes } from "./features/invoices/invoices.routes";
import { env } from "./env";
import { errorHandler } from "./shared/middleware/error-handler";
import { requestLogger } from "./shared/middleware/request-logger";

export const app = new Hono().basePath("/api");

app.use(requestLogger);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.onError(errorHandler);

app.get("/health", (c) => c.json({ success: true, message: "Loom API is running" }));

app.route("/auth", authRoutes);
app.route("/clients", clientsRoutes);
app.route("/invoices", invoicesRoutes);
