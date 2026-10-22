const API_URL = "http://localhost:3000/api/orders";
const LOGIN_URL = "http://localhost:3000/api/auth/login";

type LoginResponse = {
  data?: {
    token?: string;
  };
};

type DeleteResponse = {
  message?: string;
  deletedCount?: number;
  error?: string;
};

async function login(
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      `Login failed for ${email}: HTTP ${response.status}.`,
    );
  }

  const body = (await response.json()) as LoginResponse;
  const token = body.data?.token;

  if (!token) {
    throw new Error(`No token returned for ${email}.`);
  }

  return token;
}

async function testUnauthenticatedDeletion(): Promise<void> {
  console.log("\n--- Test 1: Unauthenticated deletion ---");

  const response = await fetch(`${API_URL}/cancelled`, {
    method: "DELETE",
  });

  console.log(`HTTP status: ${response.status}`);

  if (response.status !== 401) {
    throw new Error(
      `Expected HTTP 401, received ${response.status}.`,
    );
  }

  console.log("PASS: Unauthenticated deletion was rejected.");
}

async function testAgentDeletion(agentToken: string): Promise<void> {
  console.log("\n--- Test 2: Agent deletion ---");

  const response = await fetch(`${API_URL}/cancelled`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${agentToken}`,
    },
  });

  console.log(`HTTP status: ${response.status}`);

  if (response.status !== 403) {
    throw new Error(
      `Expected HTTP 403 for an agent, received ${response.status}.`,
    );
  }

  console.log("PASS: Agent was forbidden from deleting orders.");
}

async function testAgentCanListOrders(
  agentToken: string,
): Promise<void> {
  console.log("\n--- Test 3: Agent order-list access ---");

  const response = await fetch(`${API_URL}?page=1&pageSize=5`, {
    headers: {
      Authorization: `Bearer ${agentToken}`,
    },
  });

  console.log(`HTTP status: ${response.status}`);

  if (!response.ok) {
    throw new Error(
      `Expected agent order-list access, received HTTP ${response.status}.`,
    );
  }

  console.log("PASS: Agent can still access the orders list.");
}

async function testAdministratorDeletion(
  adminToken: string,
): Promise<void> {
  console.log("\n--- Test 4: Administrator deletion ---");
  console.log(
    "WARNING: This permanently deletes every CANCELLED order in the configured database.",
  );

  const response = await fetch(`${API_URL}/cancelled`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  console.log(`HTTP status: ${response.status}`);

  const body = (await response.json()) as DeleteResponse;

  if (response.status !== 200) {
    throw new Error(
      `Expected HTTP 200 for an administrator, received HTTP ${response.status}. Error: ${body.error ?? "No error details"}`,
    );
  }

  if (
    typeof body.deletedCount !== "number" ||
    !Number.isInteger(body.deletedCount) ||
    body.deletedCount < 0
  ) {
    throw new Error(
      "Expected the response to contain a non-negative integer deletedCount.",
    );
  }

  console.log(`Deleted cancelled orders: ${body.deletedCount}`);
  console.log(
    "PASS: Administrator was authorized to delete cancelled orders.",
  );
}

async function main(): Promise<void> {
  const agentToken = await login(
    "agent@example.com",
    "Agent123!",
  );

  const adminToken = await login(
    "admin@example.com",
    "Admin123!",
  );

  console.log("Authenticated as the seeded agent and administrator.");

  await testUnauthenticatedDeletion();
  await testAgentDeletion(agentToken);
  await testAgentCanListOrders(agentToken);
  await testAdministratorDeletion(adminToken);

  console.log("\nAll authorization checks passed.");
}

main().catch((error: unknown) => {
  console.error("\nAuthorization test failed:", error);
  process.exitCode = 1;
});
