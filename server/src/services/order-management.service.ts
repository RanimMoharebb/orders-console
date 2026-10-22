import { prisma } from "../lib/prisma";

export async function deleteCancelledOrders() {
  const result = await prisma.order.deleteMany({
    where: {
      status: "CANCELLED",
    },
  });

  return result.count;
}
