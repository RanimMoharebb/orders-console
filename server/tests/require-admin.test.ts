import type { Request, Response, NextFunction } from "express";
import { requireAdmin } from "../src/middleware/auth.middleware";

type MockResponse = {
  statusCode: number;
  body: unknown;
};

function runMiddleware(
  user: Request["user"],
): MockResponse & { nextCalled: boolean } {
  const result: MockResponse & { nextCalled: boolean } = {
    statusCode: 200,
    body: undefined,
    nextCalled: false,
  };

  const req = { user } as Request;

  const res = {
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    result.nextCalled = true;
  };

  requireAdmin(req, res, next);

  return result;
}

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }

  console.log(`PASS: ${message}`);
}

function main(): void {
  console.log("--- Test 1: Missing authenticated user ---");

  const unauthenticated = runMiddleware(undefined);

  assert(
    unauthenticated.statusCode === 401 &&
      !unauthenticated.nextCalled,
    "Unauthenticated requests are rejected with HTTP 401.",
  );

  console.log("\n--- Test 2: Agent role ---");

  const agent = runMiddleware({
    id: "test-agent",
    email: "agent@example.com",
    role: "AGENT",
  });

  assert(
    agent.statusCode === 403 && !agent.nextCalled,
    "Agents are rejected with HTTP 403.",
  );

  console.log("\n--- Test 3: Administrator role ---");

  const admin = runMiddleware({
    id: "test-admin",
    email: "admin@example.com",
    role: "ADMIN",
  });

  assert(
    admin.nextCalled,
    "Administrators pass the authorization middleware.",
  );

  console.log("\nAll requireAdmin middleware tests passed.");
}

main();
