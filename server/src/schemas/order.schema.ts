import { z } from "zod";

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(1, "Customer name is required").max(120),

    customerEmail: z
      .string()
      .trim()
      .email("A valid customer email is required")
      .max(254)
      .transform((email) => email.toLowerCase()),

    items: z
      .array(
        z
          .object({
            name: z.string().trim().min(1, "Item name is required").max(120),

            quantity: z
              .number()
              .int("Quantity must be a whole number")
              .min(1, "Quantity must be at least 1")
              .max(10000),

            unitPriceCents: z
              .number()
              .int("Unit price must be a whole number of cents")
              .min(0, "Unit price cannot be negative")
              .max(100_000_000),
          })
          .strict(),
      )
      .min(1, "An order must contain at least one item")
      .max(100, "An order cannot contain more than 100 items"),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
