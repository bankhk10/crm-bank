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
                  },
                  productABCType: {
                    select: { code: true, name: true }
                  },
                  totalPackageSizePerBox: true,
                  packageSizeUnit: true,
                  unit: true,
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



/**
 * ดึงยอดขายจริง โดยแยก:
 * 1. Shipment-based: แต่ละ Shipment นับตาม scheduledDate (วันที่จัดส่งของ)
 * 2. Legacy: Sale ที่ไม่มี Shipment → นับตาม requestedDeliveryDate
 * ใช้เกณฑ์เดียวกับ Dashboard Invoice
 */
export async function findActualSalesWithShipments(startDate: Date, endDate: Date) {
  // 1. Shipment-based: แต่ละ Shipment นับตาม scheduledDate ของตัวเอง
  const shipments = await prisma.shipment.findMany({
    where: {
      status: {
        in: ["DELIVERED", "IN_TRANSIT"],
      },
      OR: [
        { scheduledDate: { gte: startDate, lte: endDate } },
        { scheduledDate: null, actualDate: { gte: startDate, lte: endDate } },
        { scheduledDate: null, actualDate: null, sale: { requestedDeliveryDate: { gte: startDate, lte: endDate } } }
      ],
      sale: { deletedAt: null },
    },
    select: {
      scheduledDate: true,
      actualDate: true,
      totalAmount: true,
      sale: {
        select: {
          requestedDeliveryDate: true,
        },
      },
    },
  });

  // 2. Legacy: Sale ที่ไม่มี Shipment เลย
  const INVOICE_SALE_STATUSES: SaleStatus[] = [
    "PAID", "DELIVERY_COMPLETED", "COMPLETED",
  ];

  const legacySales = await prisma.sale.findMany({
    where: {
      OR: [
        { deliveryDate: { gte: startDate, lte: endDate } },
        { deliveryDate: null, requestedDeliveryDate: { gte: startDate, lte: endDate } },
        { deliveryDate: null, requestedDeliveryDate: null, saleDate: { gte: startDate, lte: endDate } },
      ],
      deletedAt: null,
      status: { in: INVOICE_SALE_STATUSES },
      shipments: { none: {} },
    },
    select: {
      deliveryDate: true,
      requestedDeliveryDate: true,
      saleDate: true,
      totalAmount: true,
    },
  });

  return { shipments, legacySales };
}

export async function findTradeNameGroups() {
  return prisma.tradeNameGroup.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}

export async function findProductABCTypes() {
  return prisma.productABCTypes.findMany({
    where: { deletedAt: null },
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });
}
