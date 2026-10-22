import { Router } from "express";
import { ZodError } from "zod";
import { createOrderSchema } from "../schemas/order.schema";
import {
  createOrder,
  IdempotencyConflictError,
  OrderCreationError,
} from "../services/order.service";

const router = Router();

router.post("/", async (req, res) => {
  const idempotencyKey = req.get("Idempotency-Key");

  if (!idempotencyKey || idempotencyKey.trim().length === 0) {
    res.status(400).json({
      error: "The Idempotency-Key header is required.",
    });
    return;
  }

  if (idempotencyKey.length > 200) {
    res.status(400).json({
      error: "The Idempotency-Key header must not exceed 200 characters.",
    });
    return;
  }

  const validation = createOrderSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: "Invalid order data.",
      details: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const order = await createOrder(
      validation.data,
      idempotencyKey,
    );

    res.status(201).json({ data: order });
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      res.status(409).json({
        error: error.message,
      });
      return;
    }

    if (error instanceof OrderCreationError) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    console.error("Failed to create order:", error);

    res.status(500).json({
      error: "An unexpected error occurred while creating the order.",
    });
  }
});

export default router;
