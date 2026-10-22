import type { Request, Response, NextFunction } from "express";
import { deleteCancelledOrders } from "../services/order-management.service";
import { createOrder } from "../services/order.service";
import { listOrders } from "../services/order-list.service";
import type { CreateOrderInput, IdempotencyKey } from "../schemas/order.schema";
import type { OrderQuery } from "../schemas/order-query.schema";

export async function deleteCancelledOrdersController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
  } catch (err) {
    next(err);
  }
}

export async function listOrdersController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const query = res.locals.validatedQuery as OrderQuery;

  try {
    const result = await listOrders(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createOrderController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const idempotencyKey = res.locals.validatedHeader as IdempotencyKey;
  const orderInput = res.locals.validatedBody as CreateOrderInput;

  try {
    const order = await createOrder(orderInput, idempotencyKey);
    res.status(201).json({
      data: order,
    });
  } catch (err) {
    next(err);
  }
}
