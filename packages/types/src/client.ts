import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(150),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
