import { PrismaClient } from "@prisma/client";

const API_URL = "http://localhost:3000/api/orders";
const LOGIN_URL = "http://localhost:3000/api/auth/login";

const REQUEST_COUNT = 10;

const prisma = new PrismaClient();

const payload = {
  customerName: "Parallel Test Customer",
  customerEmail: "parallel-test@example.com",
  items: [
    {
      name: "Test Product",
      quantity: 2,
      unitPriceCents: 2500,
    },
  ],
};

type CreateOrderResponse = {
  data?: {
    id?: string;
  };
};

async function authenticate(): Promise<string> {
  // Authenticate before sending requests to the protected endpoint
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "Admin123!",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as {
    data?: { token?: string };
  };

  const token = body.data?.token;

  if (!token) {
    throw new Error("Login response did not contain an access token.");
  }

  console.log("Authenticated successfully.");
 
  return token;
}

async function createOrder(
  token: string,
  idempotencyKey: string,
  orderPayload: typeof payload,
): Promise<{
  status: number;
  body: CreateOrderResponse;
}> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const body = (await response.json()) as CreateOrderResponse;

    return {
      status: response.status,
      body,
    };
  } catch (error) {
    throw new Error(
      `Order request failed for idempotency key "${idempotencyKey}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function testConcurrentRequests(token: string): Promise<void> {
  const key = `concurrent-test-${Date.now()}`;

  console.log(`\n--- Test 1: ${REQUEST_COUNT} concurrent requests ---`);

  const responses = await Promise.all(
    Array.from({ length: REQUEST_COUNT }, () =>
      createOrder(token, key, payload),
    ),
  );

  const successful = responses.filter(
    (response) => response.status === 201,
  );

  const orderIds = successful.map((response) => response.body.data?.id);

  const uniqueOrderIds = new Set(orderIds);

  const records = await prisma.idempotencyRecord.findMany({
    where: { key },
  });

  const passed =
    successful.length === REQUEST_COUNT &&
    orderIds.every(Boolean) &&
    uniqueOrderIds.size === 1 &&
    records.length === 1;

  console.log(`Requests sent: ${REQUEST_COUNT}`);
  console.log(`HTTP 201 responses: ${successful.length}`);
  console.log(`Unique order IDs: ${uniqueOrderIds.size}`);
  console.log(`Idempotency records: ${records.length}`);

  if (!passed) {
    throw new Error(
      "FAIL: Concurrent requests did not resolve to exactly one order.",
    );
  }

  console.log("PASS: Concurrent requests created exactly one order.");
}

async function testSequentialRetry(token: string): Promise<void> {
  const key = `retry-test-${Date.now()}`;

  console.log("\n--- Test 2: Sequential retry ---");

  const firstResponse = await createOrder(token, key, payload);
  const retryResponse = await createOrder(token, key, payload);

  const originalOrderId = firstResponse.body.data?.id;
  const retryOrderId = retryResponse.body.data?.id;

  const passed =
    firstResponse.status === 201 &&
    retryResponse.status === 201 &&
    Boolean(originalOrderId) &&
    retryOrderId === originalOrderId;

  if (!passed) {
    throw new Error(
      "FAIL: Retrying the same request did not return the existing order.",
    );
  }

  console.log(`Original order ID: ${originalOrderId}`);
  console.log(`Retry order ID: ${retryOrderId}`);
  console.log("PASS: Sequential retry returned the existing order.");
}

async function testConflictingPayload(token: string): Promise<void> {
  const key = `conflict-test-${Date.now()}`;

  console.log("\n--- Test 3: Conflicting payload ---");

  const firstResponse = await createOrder(token, key, payload);

  if (firstResponse.status !== 201 || !firstResponse.body.data?.id) {
    throw new Error("FAIL: Initial order creation failed.");
  }
  
  const orderCountBeforeConflict = await prisma.order.count();

  const conflictingPayload = {
    ...payload,
    customerName: "Different Customer",
  };

  const conflictResponse = await createOrder(
    token,
    key,
    conflictingPayload,
  );

  const records = await prisma.idempotencyRecord.findMany({
    where: { key },
  });

  const orderCountAfterConflict = await prisma.order.count();

  const orderIds = records.map((record) => record.orderId);
  const uniqueOrderIds = new Set(orderIds);

  const passed =
    conflictResponse.status === 409 &&
    records.length === 1 &&
    uniqueOrderIds.size === 1 &&
    uniqueOrderIds.has(firstResponse.body.data.id);
    orderCountAfterConflict === orderCountBeforeConflict;

  console.log(`Conflict response: HTTP ${conflictResponse.status}`);
  console.log(`Idempotency records: ${records.length}`);

  console.log(`Orders before conflict: ${orderCountBeforeConflict}`);
  console.log(`Orders after conflict: ${orderCountAfterConflict}`);

  if (!passed) {
    throw new Error(
      "FAIL: Conflicting payload was not rejected correctly.",
    );
  }

  console.log(
    "PASS: Reusing the key with a different payload returned HTTP 409.",
  );
}

async function main(): Promise<void> {
  const token = await authenticate();

  await testConcurrentRequests(token);
  await testSequentialRetry(token);
  await testConflictingPayload(token);

  console.log("\nAll idempotency tests passed.");
}

main()
  .catch((error: unknown) => {
    console.error("\nIdempotency test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
