import type { Request, Response, NextFunction } from "express";
import { login } from "../services/auth.service";
import type { LoginInput } from "../schemas/auth.schema";

export async function loginController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email, password } = res.locals.validatedBody as LoginInput;

  try {
    const result = await login(email, password);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
