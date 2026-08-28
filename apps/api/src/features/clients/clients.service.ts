import { and, eq } from "drizzle-orm";
import type { CreateClientInput, UpdateClientInput } from "@loom/types";
import { db } from "../../db";
import { clients } from "../../db/schema";
import { NotFoundError } from "../../shared/errors";

export async function listClients(userId: string) {
  return db.query.clients.findMany({ where: eq(clients.userId, userId) });
}

export async function getClient(userId: string, clientId: string) {
  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.userId, userId)),
  });
  if (!client) {
    throw new NotFoundError("Client not found");
  }
  return client;
}

export async function createClient(userId: string, input: CreateClientInput) {
  const [client] = await db
    .insert(clients)
    .values({ ...input, userId })
    .returning();
  if (!client) {
    throw new Error("Failed to create client");
  }
  return client;
}

export async function updateClient(userId: string, clientId: string, input: UpdateClientInput) {
  await getClient(userId, clientId);
  const [client] = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .returning();
  if (!client) {
    throw new Error("Failed to update client");
  }
  return client;
}

export async function deleteClient(userId: string, clientId: string) {
  await getClient(userId, clientId);
  await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}
