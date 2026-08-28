import { z } from "zod";

export const invoiceStatusEnum = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Item description is required").max(300),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.string().date("Invalid issue date"),
  dueDate: z.string().date("Invalid due date"),
  status: invoiceStatusEnum.default("draft"),
  notes: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, "Invoice must have at least one item"),
});

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
