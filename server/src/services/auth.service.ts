import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "../lib/jwt-config";

export class AuthenticationConfigurationError extends Error {
  constructor() {
    super("Authentication is not configured correctly.");
    this.name = "AuthenticationConfigurationError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new AuthenticationConfigurationError();
  }

  return secret;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }

  const secret = getJwtSecret();

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
