import { and, eq } from "drizzle-orm";
import type { CreateInvoiceInput } from "@loom/types";
import { db } from "../../db";
import { invoiceItems, invoices } from "../../db/schema";
import { NotFoundError } from "../../shared/errors";

export async function listInvoices(userId: string) {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    with: { items: true, client: true },
  });
}

export async function getInvoice(userId: string, invoiceId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
    with: { items: true, client: true },
  });
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  return invoice;
}

export async function createInvoice(userId: string, input: CreateInvoiceInput) {
  const [invoice] = await db
    .insert(invoices)
    .values({
      userId,
      clientId: input.clientId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status: input.status,
      notes: input.notes,
    })
    .returning();

  if (!invoice) {
    throw new Error("Failed to create invoice");
  }

  await db.insert(invoiceItems).values(
    input.items.map((item) => ({
      invoiceId: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  );

  return getInvoice(userId, invoice.id);
}
