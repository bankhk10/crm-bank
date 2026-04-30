import { db as prisma, SaleStatus } from "@/lib/db";

export async function findSalesTargetsWithDetails(year: number, month: number | null) {
  return prisma.salesTarget.findMany({
    where: {
      year,
      ...(month ? { month } : {}),
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          prefix: true,
          firstName: true,
          lastName: true,
          responsibilityArea: true,
        },
      },
      stores: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  productCode: true,
                  name: true,
                  tradeNameGroup: {
                    select: { code: true }
                  }
                },
              },
            },
          },
        },
      },
    } as any,
    orderBy: [{ month: "asc" }, { createdAt: "desc" }],
  });
}

export async function findCompletedSalesSummary(startDate: Date, endDate: Date) {
  const excludedStatuses: SaleStatus[] = ["CANCELLED"];

  return prisma.sale.findMany({
    where: {
      requestedDeliveryDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        notIn: excludedStatuses,
      },
      deletedAt: null,
    },
    select: {
      requestedDeliveryDate: true,
      totalAmount: true,
    },
  });
}


export async function findTradeNameGroups() {
  return prisma.tradeNameGroup.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}
