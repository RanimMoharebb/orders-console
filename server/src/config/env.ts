import "dotenv/config";

export const JWT_ISSUER = "orders-console-api";
export const JWT_AUDIENCE = "orders-console-client";

function validateEnv() {
  const port = Number(process.env.PORT) || 3000;
  const jwtSecret = process.env.JWT_SECRET;

  return {
    PORT: port,
    JWT_SECRET: jwtSecret,
    JWT_ISSUER,
    JWT_AUDIENCE,
    DATABASE_URL: process.env.DATABASE_URL,
    isJwtSecretValid(): boolean {
      return Boolean(jwtSecret && jwtSecret.length >= 32);
    },
    getRequiredJwtSecret(): string {
      if (!this.isJwtSecretValid()) {
        throw new Error("Authentication is not configured correctly: JWT_SECRET must be at least 32 characters.");
      }
      return jwtSecret!;
    },
  };
}

export const env = validateEnv();
