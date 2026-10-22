import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors/http-errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request data.",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "An unexpected error occurred.",
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "API endpoint not found.",
  });
}
