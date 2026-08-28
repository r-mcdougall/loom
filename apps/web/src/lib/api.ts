import type {
  CreateClientInput,
  CreateInvoiceInput,
  InvoiceStatus,
  LoginInput,
  RegisterInput,
} from "@loom/types";

/**
 * Thin, fully-typed client for the Loom REST API (`apps/api`).
 *
 * We deliberately do NOT import the Hono app or its `hc` type here: that would
 * drag backend-only modules (`bun:sqlite`, Drizzle) across the workspace
 * boundary. Instead we mirror the response shapes and reuse the Zod-derived
 * request types from `@loom/types`.
 */

// Relative path — same origin as the app in production (Caddy proxies
// /api/* to apps/api) and proxied by Vite's dev server locally, so there is
// never a cross-origin request and no CORS handshake to worry about.
const API_BASE_URL = "/api";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  taxId: string | null;
}

export interface Client extends InvoiceClient {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  client: InvoiceClient;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    const message = body.success ? `Request to ${path} failed` : body.message;
    throw new ApiError(message, res.status);
  }

  return body.data;
}

export const authApi = {
  register: (input: RegisterInput): Promise<AuthTokens> =>
    request<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput): Promise<AuthTokens> =>
    request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: async (refreshToken: string): Promise<void> => {
    await request<unknown>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },
};

export const clientsApi = {
  list: (token: string): Promise<Client[]> =>
    request<Client[]>("/clients", { token }),

  create: (token: string, input: CreateClientInput): Promise<Client> =>
    request<Client>("/clients", {
      token,
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export const invoicesApi = {
  list: (token: string): Promise<Invoice[]> =>
    request<Invoice[]>("/invoices", { token }),

  create: (token: string, input: CreateInvoiceInput): Promise<Invoice> =>
    request<Invoice>("/invoices", {
      token,
      method: "POST",
      body: JSON.stringify(input),
    }),
};
