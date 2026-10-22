import { z } from "zod";

export const orderQuerySchema = z
  .object({
    search: z.string().trim().max(100, "Search must not exceed 100 characters").optional(),

    status: z
      .enum([
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ])
      .optional(),

    sortBy: z
      .enum(["createdAt", "totalAmountCents"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    page: z.coerce.number().int().min(1).default(1),

    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export type OrderQuery = z.infer<typeof orderQuerySchema>;
