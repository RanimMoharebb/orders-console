export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Invalid request data.", details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Authentication required.") {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Administrator access required.") {
    super(message, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict with existing resource.") {
    super(message, 409);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "An unexpected error occurred.") {
    super(message, 500);
  }
}

// Domain-specific aliases to preserve existing service/test contracts
export class AuthenticationConfigurationError extends HttpError {
  constructor(message = "Authentication is not configured correctly.") {
    super(message, 500);
  }
}

export class InvalidCredentialsError extends HttpError {
  constructor(message = "Invalid email or password.") {
    super(message, 401);
  }
}

export class IdempotencyConflictError extends HttpError {
  constructor(
    message = "This idempotency key has already been used with a different request.",
  ) {
    super(message, 409);
  }
}

export class OrderCreationError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}
