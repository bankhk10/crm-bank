import { db as prisma } from "@/lib/db";

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
                  productGroup: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ month: "asc" }, { createdAt: "desc" }],
  });
}

export async function findCompletedSalesSummary(startDate: Date, endDate: Date) {
  const validStatuses: any[] = ["COMPLETED"];

  return prisma.sale.findMany({
    where: {
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: validStatuses,
      },
    },
    select: {
      saleDate: true,
      totalAmount: true,
    },
  });
}

export async function findProductGroupMasters() {
  return prisma.productGroupMaster.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}
