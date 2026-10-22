import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env, JWT_ISSUER, JWT_AUDIENCE } from "../config/env";
import {
  AuthenticationConfigurationError,
  InvalidCredentialsError,
} from "../errors/http-errors";

export { AuthenticationConfigurationError, InvalidCredentialsError };

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }

  const secret = env.getRequiredJwtSecret();

  const token = jwt.sign(
    { role: user.role },
    secret,
    {
      subject: user.id,
      expiresIn: "1h",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}
