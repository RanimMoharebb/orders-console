import { PrismaClient } from "@prisma/client";

const API_URL = "http://localhost:3000/api/orders";
const LOGIN_URL = "http://localhost:3000/api/auth/login";

const REQUEST_COUNT = 10;
const IDEMPOTENCY_KEY = `parallel-test-${Date.now()}`;

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

async function main() {
  // Authenticate before sending requests to the protected endpoint
  const loginResponse = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "Admin123!",
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed with HTTP ${loginResponse.status}.`);
  }

  const loginBody = (await loginResponse.json()) as {
    data?: { token?: string };
  };

  const token = loginBody.data?.token;

  if (!token) {
    throw new Error("Login response did not contain an access token.");
  }

  console.log("Authenticated successfully.");
  console.log(`Sending ${REQUEST_COUNT} concurrent requests...`);

  // Send all requests concurrently with the same key and payload
  const responses = await Promise.all(
    Array.from({ length: REQUEST_COUNT }, async (_, index) => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": IDEMPOTENCY_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const body: unknown = await response.json();

        return {
          request: index + 1,
          status: response.status,
          body,
        };
      } catch (error) {
        return {
          request: index + 1,
          status: 0,
          body: String(error),
        };
      }
    }),
  );

  for (const response of responses) {
    console.log(
      `Request ${response.request}: HTTP ${response.status}`,
      JSON.stringify(response.body),
    );
  }

  const successful = responses.filter(
    (response) => response.status === 201,
  );

  const failed = responses.filter(
    (response) => response.status !== 201,
  );

  const orderIds = successful.map((response) => {
    const body = response.body as {
      data?: { id?: string };
    };

    return body.data?.id;
  });

  const uniqueOrderIds = new Set(orderIds);

  // Verify the idempotency key corresponds to exactly one database record.
  const records = await prisma.idempotencyRecord.findMany({
    where: { key: IDEMPOTENCY_KEY },
    include: { order: true },
  });

  const uniqueDatabaseOrderIds = new Set(
    records.map((record) => record.orderId),
  );

  console.log("\n--- Summary ---");
  console.log(`Total requests: ${REQUEST_COUNT}`);
  console.log(`HTTP 201 responses: ${successful.length}`);
  console.log(`Other responses: ${failed.length}`);
  console.log(`Unique response order IDs: ${uniqueOrderIds.size}`);
  console.log(`Idempotency records in database: ${records.length}`);
  console.log(`Unique database order IDs: ${uniqueDatabaseOrderIds.size}`);

  if (
    successful.length === REQUEST_COUNT &&
    uniqueOrderIds.size === 1 &&
    orderIds.every(Boolean) &&
    records.length === 1 &&
    uniqueDatabaseOrderIds.size === 1
  ) {
    console.log(
        "PASS: Concurrent requests created exactly one order.",
    );
  } else {
    console.error("FAIL: Concurrent idempotency needs investigation.");
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error("Idempotency test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
});
