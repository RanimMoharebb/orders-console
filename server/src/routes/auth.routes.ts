import { Router } from "express";
import { loginController } from "../controllers/auth.controller";
import { loginSchema } from "../schemas/auth.schema";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.post(
  "/login",
  validate({
    target: "body",
    schema: loginSchema,
  }),
  loginController,
);

export default router;
