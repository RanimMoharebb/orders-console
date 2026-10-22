import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { OrderQuery } from "../schemas/order-query.schema";

export async function listOrders(query: OrderQuery) {
  const { search, status, sortBy, sortOrder, page, pageSize } = query;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              customerName: {
                contains: search,
              },
            },
            {
              customerEmail: {
                contains: search,
              },
            },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.OrderOrderByWithRelationInput[] = [
    { [sortBy]: sortOrder },
    { id: "asc" },
  ];

  const skip = (page - 1) * pageSize;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        totalAmountCents: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
