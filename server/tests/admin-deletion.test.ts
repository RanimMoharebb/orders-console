import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const API_URL = "http://localhost:3000/api/orders";
const LOGIN_URL = "http://localhost:3000/api/auth/login";

type LoginResponse = {
  data?: {
    token?: string;
  };
};

type DeleteResponse = {
  deletedCount?: number;
  error?: string;
};

async function prepareAdmin(): Promise<void> {
  const passwordHash = await hash("Admin123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("PASS: Test administrator is ready.");
}

async function loginAsAdmin(): Promise<string> {
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
    throw new Error(`Admin login failed: HTTP ${response.status}.`);
  }

  const body = (await response.json()) as LoginResponse;
  const token = body.data?.token;

  if (!token) {
    throw new Error("The login response did not contain a token.");
  }

  return token;
}

async function main(): Promise<void> {
  const testEmail = `deletion-test-${randomUUID()}@example.com`;

  let testOrderId: string | undefined;
  let deletionSucceeded = false;

  try {
    console.log("--- Checking database safety ---");

    const existingCancelledOrders = await prisma.order.count({
      where: { status: "CANCELLED" },
    });

    if (existingCancelledOrders > 0) {
      throw new Error(
        `Refusing to run deletion test: found ${existingCancelledOrders} existing cancelled orders. Use an isolated test database.`,
      );
    }

    console.log("PASS: No existing cancelled orders found.");

    await prepareAdmin();

    console.log("\n--- Preparing temporary cancelled order ---");

    const testOrder = await prisma.order.create({
      data: {
        customerName: "Temporary Deletion Test",
        customerEmail: testEmail,
        status: "CANCELLED",
        totalAmountCents: 1000,
        items: {
          create: [
            {
              name: "Temporary Test Item",
              quantity: 1,
              unitPriceCents: 1000,
            },
          ],
        },
      },
    });

    testOrderId = testOrder.id;

    console.log(`Created test order: ${testOrderId}`);

    const itemCountBefore = await prisma.orderItem.count({
      where: { orderId: testOrderId },
    });

    if (itemCountBefore !== 1) {
      throw new Error(
        `Expected one associated item before deletion, found ${itemCountBefore}.`,
      );
    }

    console.log("PASS: Temporary order and its item exist.");

    console.log("\n--- Testing administrator deletion ---");

    const token = await loginAsAdmin();

    const response = await fetch(`${API_URL}/cancelled`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`HTTP status: ${response.status}`);

    const body = (await response.json()) as DeleteResponse;

    if (response.status !== 200) {
      throw new Error(
        `Expected HTTP 200, received HTTP ${response.status}: ${
          body.error ?? "Unknown error"
        }`,
      );
    }

    console.log(`Deleted count: ${body.deletedCount}`);

    if (body.deletedCount !== 1) {
      throw new Error(
        `Expected exactly one cancelled order to be deleted, received ${body.deletedCount}.`,
      );
    }

    console.log("PASS: Exactly one cancelled order was deleted.");

    const deletedOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
    });

    if (deletedOrder !== null) {
      throw new Error("The temporary order still exists after deletion.");
    }

    console.log("PASS: The temporary order no longer exists.");

    const remainingItems = await prisma.orderItem.count({
      where: { orderId: testOrderId },
    });

    if (remainingItems !== 0) {
      throw new Error(
        `Expected associated items to be deleted, found ${remainingItems}.`,
      );
    }

    console.log("PASS: Associated order items were deleted.");

    deletionSucceeded = true;

    console.log("\nAdministrator deletion test passed.");
  } finally {
    if (testOrderId && !deletionSucceeded) {
      await prisma.order.deleteMany({
        where: { id: testOrderId },
      });
    }

    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("\nAdministrator deletion test failed:", error);
  process.exitCode = 1;
});