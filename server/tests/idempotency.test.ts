const API_URL = "http://localhost:3000/api/orders";
const REQUEST_COUNT = 10;
const IDEMPOTENCY_KEY = `parallel-test-${Date.now()}`;

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
  const responses = await Promise.all(
    Array.from({ length: REQUEST_COUNT }, async (_, index) => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": IDEMPOTENCY_KEY,
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

  console.log("\n--- Summary ---");
  console.log(`Total requests: ${REQUEST_COUNT}`);
  console.log(`HTTP 201 responses: ${successful.length}`);
  console.log(`Other responses: ${failed.length}`);
  console.log(`Unique order IDs: ${uniqueOrderIds.size}`);

  if (
    successful.length === REQUEST_COUNT &&
    uniqueOrderIds.size === 1 &&
    orderIds.every(Boolean)
  ) {
    console.log("PASS: All requests returned the same order.");
  } else {
    console.error("FAIL: Concurrent idempotency needs investigation.");
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
