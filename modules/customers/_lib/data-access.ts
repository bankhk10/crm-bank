import { db } from "@/src/infrastructure/database";
import { Prisma } from "@/src/infrastructure/database";

export async function getCustomers(params?: { q?: string; take?: number }) {
  const { q, take = 1000 } = params || {};

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { customerCode: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      customerCode: true,
    },
    take,
    orderBy: { customerCode: "asc" },
  });

  return customers;
}
