
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ORDER_COUNT = 50_000;
const BATCH_SIZE = 1_000;

const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const firstNames = [
  "Sara", "Omar", "Mariam", "Ahmed", "Nour",
  "Youssef", "Laila", "Adam", "Farah", "Karim",
];

const lastNames = [
  "Ahmed", "Mohamed", "Hassan", "Ibrahim", "Ali",
  "Mahmoud", "Khaled", "Mostafa", "Saleh", "Samir",
];

async function main() {
  console.log("Seeding database...");

  // Create a demo admin account with a hashed password.
  const adminPasswordHash = await hash("Admin123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("Demo admin account ready.");

  // Create a demo agent account with a hashed password.
  const agentPasswordHash = await hash("Agent123!", 12);

  await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {
      passwordHash: agentPasswordHash,
      role: "AGENT",
    },
    create: {
      email: "agent@example.com",
      passwordHash: agentPasswordHash,
      role: "AGENT",
    },
  });

  console.log("Demo agent account ready.");


  // Clear existing orders so rerunning the seed produces a predictable dataset.
  await prisma.idempotencyRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  const now = Date.now();
  const startDate = new Date("2024-01-01T00:00:00.000Z").getTime();

  for (let offset = 0; offset < ORDER_COUNT; offset += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, ORDER_COUNT - offset);

    const orders = Array.from({ length: batchSize }, (_, index) => {
      const number = offset + index;
      const firstName = firstNames[number % firstNames.length];
      const lastName =
        lastNames[Math.floor(number / firstNames.length) % lastNames.length];

      // Spread dates across the period from 2024 to now.
      const createdAt = new Date(
        startDate + Math.floor((number / ORDER_COUNT) * (now - startDate)),
      );

      return {
        id: randomUUID(),
        customerName: `${firstName} ${lastName}`,
        customerEmail: `customer${number + 1}@example.com`,
        status: statuses[number % statuses.length],
        totalAmountCents: 1_000 + ((number * 7919) % 499_000),
        createdAt,
      };
    });


    await prisma.order.createMany({ data: orders });

    // Create two items for each order using its exact ID.
    const orderItems = orders.flatMap((order, index) => {
      const number = offset + index;

      return [
        {
          orderId: order.id,
          name: "Wireless Mouse",
          quantity: 1 + (number % 3),
          unitPriceCents: 2_500,
        },
        {
          orderId: order.id,
          name: "USB-C Cable",
          quantity: 1,
          unitPriceCents: 1_000,
        },
      ];
    });

    await prisma.orderItem.createMany({ data: orderItems });


    console.log(`Inserted ${offset + batchSize} / ${ORDER_COUNT} orders`);
  }

  const totalOrders = await prisma.order.count();

  console.log(`Seeding complete. Total orders: ${totalOrders}`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

