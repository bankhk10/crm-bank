import { db as prisma, SaleStatus } from "@/lib/db";

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

export async function aggregateSaleItemAmount(
  start: Date,
  end: Date,
  productIds: string[],
  statuses?: SaleStatus[],
) {
  const whereClause: any = {
    productId: { in: productIds },
    sale: {
      saleDate: { gte: start, lte: end },
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

export async function findProductGroupTargets(year: number, month: number) {
  return prisma.productGroupSalesTarget.findMany({
    where: {
      year,
      month,
      deletedAt: null,
    },
  });
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

export async function findRegionTargets(year: number, month: number) {
  return prisma.regionSalesTarget.findMany({
    where: {
      year,
      month,
      deletedAt: null,
    },
  });
}

export async function findSalesWithProvince(
  start: Date,
  end: Date,
  excludedStatuses: SaleStatus[],
) {
  return prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
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
      saleDate: { gte: start, lte: end },
      deletedAt: null,
    },
    _count: true,
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
