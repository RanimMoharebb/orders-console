import { Router } from "express";
import {
login,
AuthenticationConfigurationError,
InvalidCredentialsError,
} from "../services/auth.service";
import { loginSchema, type LoginInput } from "../schemas/auth.schema";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.post(
"/login",
validate({
target: "body",
schema: loginSchema,
}),
async (_req, res) => {
const { email, password } = res.locals.validatedBody as LoginInput;

try {
  const result = await login(email, password);

  res.status(200).json({
    data: result,
  });
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    res.status(401).json({
      error: error.message,
    });
    return;
  }

  if (error instanceof AuthenticationConfigurationError) {
    res.status(500).json({
      error: error.message,
    });
    return;
  }

  console.error("Login failed:", error);

  res.status(500).json({
    error: "An unexpected error occurred during login.",
  });
}

},
);

export default router;
