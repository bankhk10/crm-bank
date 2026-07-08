import { db as prisma, SaleStatus } from "@/lib/db";
import { getRegionByProvince } from "@/lib/province-region-mapping";

export async function aggregateSalesAmount(
  start: Date,
  end: Date,
  statuses?: SaleStatus[],
  excludedStatuses?: SaleStatus[],
) {
  const whereClause: any = {
    saleDate: { gte: start, lte: end },
    deletedAt: null,
  };

  if (statuses && statuses.length > 0) {
    whereClause.status = { in: statuses };
  } else if (excludedStatuses && excludedStatuses.length > 0) {
    whereClause.status = { notIn: excludedStatuses };
  }

  const result = await prisma.sale.aggregate({
    where: whereClause,
    _sum: { totalAmount: true },
  });

  return Number(result._sum.totalAmount || 0);
}

export async function aggregateTotalSalesAmountByRequestedDate(
  start: Date,
  end: Date,
  excludedStatuses?: SaleStatus[],
) {
  const whereClause: any = {
    requestedDeliveryDate: { gte: start, lte: end },
    deletedAt: null,
  };

  if (excludedStatuses && excludedStatuses.length > 0) {
    whereClause.status = { notIn: excludedStatuses };
  }

  const result = await prisma.sale.aggregate({
    where: whereClause,
    _sum: { totalAmount: true },
  });

  return Number(result._sum.totalAmount || 0);
}


export async function aggregateSaleItemAmount(
  start: Date,
  end: Date,
  productIds: string[],
  statuses?: SaleStatus[],
) {
  const whereClause: any = {
    productId: { in: productIds },
    sale: {
      requestedDeliveryDate: { gte: start, lte: end },
      deletedAt: null,
    },
  };

  if (statuses && statuses.length > 0) {
    whereClause.sale.status = { in: statuses };
  }

  const result = await prisma.saleItem.aggregate({
    where: whereClause,
    _sum: { totalPrice: true },
  });

  return Number(result._sum.totalPrice || 0);
}

export async function findAllProductGroups() {
  const abcTypes = await prisma.productABCTypes.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return abcTypes.map((c) => ({ code: c.id, description: c.name }));
}

export async function findAllTradeNameGroups() {
  const groups = await prisma.tradeNameGroup.findMany({
    where: { deletedAt: null },
    select: { id: true, description: true },
    orderBy: { description: "asc" },
  });
  return groups.map((g) => ({ code: g.id, description: g.description }));
}

export async function findProductGroupTargets(year: number, month?: number | null) {
  const whereClause: any = {
    salesTargetStore: {
      salesTarget: {
        year,
      },
    },
  };
  if (month) {
    whereClause.salesTargetStore.salesTarget.month = month;
  }

  const items = await prisma.salesTargetItem.findMany({
    where: whereClause,
    include: {
      product: true,
    },
  });

  const groupMap = new Map<string, number>();
  for (const item of items) {
    const groupId = item.product.productABCTypeId;
    if (groupId) {
      const current = groupMap.get(groupId) || 0;
      groupMap.set(groupId, current + Number(item.targetAmount));
    }
  }

  return Array.from(groupMap.entries()).map(([productGroup, targetAmount]) => ({
    productGroup,
    targetAmount,
  }));
}

export async function findProductIdsByGroup(groupCode: string) {
  const products = await prisma.product.findMany({
    where: { productABCTypeId: groupCode, deletedAt: null },
    select: { id: true },
  });
  return products.map((p) => p.id);
}

export async function findProductIdsByTradeNameGroup(groupId: string) {
  const products = await prisma.product.findMany({
    where: { tradeNameGroupId: groupId, deletedAt: null },
    select: { id: true },
  });
  return products.map((p) => p.id);
}

export async function findRegionTargets(year: number, month?: number | null) {
  const whereClause: any = {
    salesTargetStore: {
      salesTarget: {
        year,
      },
    },
  };
  if (month) {
    whereClause.salesTargetStore.salesTarget.month = month;
  }

  const items = await prisma.salesTargetItem.findMany({
    where: whereClause,
    include: {
      salesTargetStore: {
        include: {
          customer: true,
        },
      },
    },
  });

  const regionMap = new Map<string, number>();
  for (const item of items) {
    const province = item.salesTargetStore.customer.province;
    if (province) {
      const region = getRegionByProvince(province);
      if (region) {
        const current = regionMap.get(region) || 0;
        regionMap.set(region, current + Number(item.targetAmount));
      }
    }
  }

  return Array.from(regionMap.entries()).map(([region, targetAmount]) => ({
    region,
    targetAmount,
  }));
}

export async function findSalesWithProvince(
  start: Date,
  end: Date,
  excludedStatuses: SaleStatus[],
) {
  return prisma.sale.findMany({
    where: {
      requestedDeliveryDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: excludedStatuses },
    },
    select: {
      totalAmount: true,
      status: true,
      customer: {
        select: {
          province: true,
        },
      },
    },
  });
}

export async function groupSaleStatusCounts(start: Date, end: Date) {
  return prisma.sale.groupBy({
    by: ["status"],
    where: {
      requestedDeliveryDate: { gte: start, lte: end },
      deletedAt: null,
    },
    _count: true,
  });
}

export async function findSaleItemsWithDetails(
  start: Date,
  end: Date,
  excludedStatuses: SaleStatus[] = [],
) {
  return prisma.saleItem.findMany({
    where: {
      sale: {
        requestedDeliveryDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: excludedStatuses }
      },
    },
    select: {
      totalPrice: true,
      productABCTypeId: true,
      tradeNameGroupId: true,
      sale: {
        select: { status: true },
      },
      product: {
        select: {
          productABCTypeId: true,
          tradeNameGroupId: true,
        },
      },
    },
  });
}

export async function findMonthlySalesTarget(
  year: number,
  month?: number | null,
) {
  return prisma.monthlySalesTarget.findFirst({
    where: {
      year,
      month: month || null,
      deletedAt: null,
    },
  });
}

export async function sumSalesTargetItems(year: number, month?: number) {
  const whereClause: any = {
    salesTargetStore: {
      salesTarget: {
        year,
      },
    },
  };
  if (month) {
    whereClause.salesTargetStore.salesTarget.month = month;
  }

  const result = await prisma.salesTargetItem.aggregate({
    where: whereClause,
    _sum: { targetAmount: true },
  });
  return Number(result._sum.targetAmount || 0);
}

/**
 * รวมมูลค่า Invoice โดย:
 * 1. Shipment ที่ส่งเสร็จแล้ว (status=DELIVERED) → ใช้ Shipment.totalAmount
 * 2. Sale ที่ไม่มี Shipment (flow เก่า) + status เป็น invoice status → ใช้ Sale.totalAmount
 */
export async function aggregateDeliveredShipmentAmount(
  start: Date,
  end: Date,
) {
  const INVOICE_SALE_STATUSES = [
    "PAID", "DELIVERY_COMPLETED", "COMPLETED",
  ] as const;

  // 1. Shipment-based: sum Shipment.totalAmount ที่ส่งเสร็จแล้ว
  // สำหรับ Split Shipment แต่ละ Shipment จะนับยอด Invoice ตามวันที่จัดส่งของ (scheduledDate) ของ Shipment นั้นๆ
  // ลำดับ fallback: scheduledDate → actualDate → sale.requestedDeliveryDate
  const shipmentResult = await prisma.shipment.aggregate({
    where: {
      status: {
        in: ["DELIVERED", "IN_TRANSIT", "COMPLETED"],
      },
      OR: [
        { scheduledDate: { gte: start, lte: end } },
        { scheduledDate: null, actualDate: { gte: start, lte: end } },
        { scheduledDate: null, actualDate: null, sale: { requestedDeliveryDate: { gte: start, lte: end } } }
      ],
      sale: { deletedAt: null },
    },
    _sum: { totalAmount: true },
  });
  const shipmentTotal = Number(shipmentResult._sum.totalAmount || 0);

  // 2. Legacy: Sale ที่ไม่มี Shipment เลย + status invoice
  const legacyResult = await prisma.sale.aggregate({
    where: {
      OR: [
        { deliveryDate: { gte: start, lte: end } },
        { deliveryDate: null, requestedDeliveryDate: { gte: start, lte: end } },
        { deliveryDate: null, requestedDeliveryDate: null, saleDate: { gte: start, lte: end } }
      ],
      deletedAt: null,
      status: { in: INVOICE_SALE_STATUSES as unknown as any[] },
      shipments: { none: {} },
    },
    _sum: { totalAmount: true },
  });
  const legacyTotal = Number(legacyResult._sum.totalAmount || 0);

  return shipmentTotal + legacyTotal;
}

/**
 * ดึง ShipmentItem ที่ส่งเสร็จแล้ว พร้อม product group info
 * + SaleItem จาก Sale ที่ไม่มี Shipment (flow เก่า) ที่มี invoice status
 * ใช้สำหรับแยกยอด Invoice ตาม Product Group / TradeNameGroup
 */
export async function findDeliveredShipmentItemsWithDetails(
  start: Date,
  end: Date,
) {
  const INVOICE_SALE_STATUSES = [
    "PAID", "DELIVERY_COMPLETED", "COMPLETED",
  ];

  // 1. ShipmentItems จาก Shipment ที่ DELIVERED
  // สำหรับ Split Shipment แต่ละ Shipment จะนับตาม scheduledDate (วันที่จัดส่งของ) ของ Shipment นั้นๆ
  const shipmentItems = await prisma.shipmentItem.findMany({
    where: {
      shipment: {
        status: {
          in: ["DELIVERED", "IN_TRANSIT", "COMPLETED"],
        },
        OR: [
          { scheduledDate: { gte: start, lte: end } },
          { scheduledDate: null, actualDate: { gte: start, lte: end } },
          { scheduledDate: null, actualDate: null, sale: { requestedDeliveryDate: { gte: start, lte: end } } }
        ],
        sale: { deletedAt: null },
      },
    },
    select: {
      totalPrice: true,
      saleItem: {
        select: {
          productABCTypeId: true,
          tradeNameGroupId: true,
          product: {
            select: {
              productABCTypeId: true,
              tradeNameGroupId: true,
            },
          },
        },
      },
    },
  });

  // 2. SaleItems จาก Sale ที่ไม่มี Shipment (flow เก่า)
  const legacySaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        OR: [
          { deliveryDate: { gte: start, lte: end } },
          { deliveryDate: null, requestedDeliveryDate: { gte: start, lte: end } },
          { deliveryDate: null, requestedDeliveryDate: null, saleDate: { gte: start, lte: end } }
        ],
        deletedAt: null,
        status: { in: INVOICE_SALE_STATUSES as any[] },
        shipments: { none: {} },
      },
    },
    select: {
      totalPrice: true,
      productABCTypeId: true,
      tradeNameGroupId: true,
      product: {
        select: {
          productABCTypeId: true,
          tradeNameGroupId: true,
        },
      },
    },
  });

  // Normalize ให้มี shape เดียวกัน
  const normalized = [
    ...shipmentItems,
    ...legacySaleItems.map((si) => ({
      totalPrice: si.totalPrice,
      saleItem: {
        productABCTypeId: si.productABCTypeId,
        tradeNameGroupId: si.tradeNameGroupId,
        product: si.product,
      },
    })),
  ];

  return normalized;
}

/**
 * ดึง Shipment ที่ส่งเสร็จแล้ว + Sale ที่ไม่มี Shipment (flow เก่า) พร้อมจังหวัดของลูกค้า
 * ใช้สำหรับแยกยอด Invoice ตาม Region
 */
export async function findDeliveredShipmentsWithProvince(
  start: Date,
  end: Date,
) {
  const INVOICE_SALE_STATUSES = [
    "PAID", "DELIVERY_COMPLETED", "COMPLETED",
  ];

  // 1. Shipment-based
  // สำหรับ Split Shipment แต่ละ Shipment จะนับตาม scheduledDate (วันที่จัดส่งของ) ของ Shipment นั้นๆ
  const shipments = await prisma.shipment.findMany({
    where: {
      status: {
        in: ["DELIVERED", "IN_TRANSIT", "COMPLETED"],
      },
      OR: [
        { scheduledDate: { gte: start, lte: end } },
        { scheduledDate: null, actualDate: { gte: start, lte: end } },
        { scheduledDate: null, actualDate: null, sale: { requestedDeliveryDate: { gte: start, lte: end } } }
      ],
      sale: { deletedAt: null },
    },
    select: {
      totalAmount: true,
      sale: {
        select: {
          customer: {
            select: { province: true },
          },
        },
      },
    },
  });

  // 2. Legacy: Sale ที่ไม่มี Shipment (flow เก่า)
  const legacySales = await prisma.sale.findMany({
    where: {
      OR: [
        { deliveryDate: { gte: start, lte: end } },
        { deliveryDate: null, requestedDeliveryDate: { gte: start, lte: end } },
        { deliveryDate: null, requestedDeliveryDate: null, saleDate: { gte: start, lte: end } }
      ],
      deletedAt: null,
      status: { in: INVOICE_SALE_STATUSES as any[] },
      shipments: { none: {} },
    },
    select: {
      totalAmount: true,
      customer: {
        select: { province: true },
      },
    },
  });

  // Normalize ให้มี shape เดียวกัน
  return [
    ...shipments,
    ...legacySales.map((sale) => ({
      totalAmount: sale.totalAmount,
      sale: { customer: { province: sale.customer.province } },
    })),
  ];
}
