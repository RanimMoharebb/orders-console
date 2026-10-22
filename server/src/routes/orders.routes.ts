import { Router } from "express";
import { deleteCancelledOrders } from "../services/order-management.service";
import {
createOrder,
IdempotencyConflictError,
OrderCreationError,
} from "../services/order.service";
import { listOrders } from "../services/order-list.service";
import {
requireAuth,
requireAdmin,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
createOrderSchema,
idempotencyKeySchema,
type CreateOrderInput,
type IdempotencyKey,
} from "../schemas/order.schema";
import {
orderQuerySchema,
type OrderQuery,
} from "../schemas/order-query.schema";

const router = Router();

// Permanently delete cancelled orders.
// Authentication and administrator authorization are enforced server-side.
router.delete(
"/cancelled",
requireAuth,
requireAdmin,
async (_req, res) => {
try {
const deletedCount = await deleteCancelledOrders();

  if (deletedCount === 0) {
  res.status(200).json({
    message: "There are no cancelled orders to delete.",
    deletedCount: 0,
  });
  return;
  }

  res.status(200).json({
    message: "Cancelled orders deleted successfully.",
    deletedCount,
  });

} catch (error) {
  console.error("Failed to delete cancelled orders:", error);

  res.status(500).json({
    error: "An unexpected error occurred while deleting cancelled orders.",
  });
}

},
);

// Retrieve orders using validated server-side query parameters.
router.get(
"/",
requireAuth,
validate({
target: "query",
schema: orderQuerySchema,
errorMessage: "Invalid order query parameters.",
includeDetails: true,
localName: "validatedQuery",
}),
async (_req, res) => {
const query = res.locals.validatedQuery as OrderQuery;

try {
  const result = await listOrders(query);

  res.status(200).json(result);
} catch (error) {
  console.error("Failed to list orders:", error);

  res.status(500).json({
    error: "An unexpected error occurred while retrieving orders.",
  });
}

},
);

// Create an order using validated body data and an idempotency key.
router.post(
"/",
requireAuth,
validate({
target: "header",
headerName: "Idempotency-Key",
schema: idempotencyKeySchema,
}),
validate({
target: "body",
schema: createOrderSchema,
errorMessage: "Invalid order data.",
includeDetails: true,
}),
async (_req, res) => {
const idempotencyKey = res.locals.validatedHeader as IdempotencyKey;
const orderInput = res.locals.validatedBody as CreateOrderInput;

try {
  const order = await createOrder(orderInput, idempotencyKey);

  res.status(201).json({
    data: order,
  });
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

},
);

export default router;
