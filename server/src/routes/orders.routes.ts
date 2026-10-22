import { Router } from "express";
import {
  deleteCancelledOrdersController,
  listOrdersController,
  createOrderController,
} from "../controllers/orders.controller";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createOrderSchema,
  idempotencyKeySchema,
} from "../schemas/order.schema";
import { orderQuerySchema } from "../schemas/order-query.schema";

const router = Router();

// Permanently delete cancelled orders.
// Authentication and administrator authorization are enforced server-side.
router.delete(
  "/cancelled",
  requireAuth,
  requireAdmin,
  deleteCancelledOrdersController,
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
  listOrdersController,
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
  createOrderController,
);

export default router;
