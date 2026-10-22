import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { CreateOrderInput } from "../schemas/order.schema";
import { prisma } from "../lib/prisma";
import {
  IdempotencyConflictError,
  OrderCreationError,
} from "../errors/http-errors";

export { IdempotencyConflictError, OrderCreationError };

const MAX_TOTAL_AMOUNT_CENTS = 2_000_000_000;

function calculateTotal(items: CreateOrderInput["items"]): number {
  let total = 0;

  for (const item of items) {
    const itemTotal = item.quantity * item.unitPriceCents;

    if (!Number.isSafeInteger(itemTotal)) {
      throw new OrderCreationError("The item total is too large.");
    }

    total += itemTotal;

    if (!Number.isSafeInteger(total) || total > MAX_TOTAL_AMOUNT_CENTS) {
      throw new OrderCreationError("The order total exceeds the allowed limit.");
    }
  }

  return total;
}

function hashRequest(input: CreateOrderInput): string {
  // Build the hash from the validated, normalized request.
  // Property order is explicit so equivalent requests hash consistently.
  const canonicalRequest = JSON.stringify({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    items: input.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  });

  return createHash("sha256").update(canonicalRequest).digest("hex");
}

export async function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
) {
  const requestHash = hashRequest(input);

  // Validate the total before opening a transaction.
  const totalAmountCents = calculateTotal(input.items);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingRecord = await tx.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (existingRecord) {
        if (existingRecord.requestHash !== requestHash) {
          throw new IdempotencyConflictError();
        }

        return existingRecord.order;
      }

      const order = await tx.order.create({
        data: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          totalAmountCents,
          items: {
            create: input.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        },
        include: { items: true },
      });

      await tx.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          requestHash,
          orderId: order.id,
        },
      });

      return order;
    });
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      throw error;
    }

    // Concurrent requests can race to create the same unique key.
    // A losing transaction is rolled back, including its order and items.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingRecord = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
        include: {
          order: {
            include: { items: true },
          },
        },
      });

      if (existingRecord) {
        if (existingRecord.requestHash !== requestHash) {
          throw new IdempotencyConflictError();
        }

        return existingRecord.order;
      }
    }

    throw error;
  }
}
