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

/**
 * คำนวณยอดขายจริงรวมสะสม (YTD) ของปีที่ระบุ
 * โดยใช้เกณฑ์เดียวกับ Dashboard (อิงตาม requestedDeliveryDate และไม่รวม CANCELLED)
 */
export async function findActualSalesYTD(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  const excludedStatuses: SaleStatus[] = ["CANCELLED"];

  const result = await prisma.sale.aggregate({
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
    _sum: {
      totalAmount: true,
    },
  });

  return Number(result._sum.totalAmount || 0);
}



export async function findTradeNameGroups() {
  return prisma.tradeNameGroup.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}
