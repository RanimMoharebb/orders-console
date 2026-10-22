import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "../lib/jwt-config";

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.get("Authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  const secret = getJwtSecret();

  if (!secret) {
    res.status(500).json({
      error: "Authentication is not configured correctly.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (typeof payload === "string" || !payload.sub) {
      res.status(401).json({
        error: "Invalid or expired token.",
      });
      return;
    }

    // Load the current user so role changes take effect immediately.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Invalid or expired token.",
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res.status(403).json({
      error: "Administrator access required.",
    });
    return;
  }

  next();
}
