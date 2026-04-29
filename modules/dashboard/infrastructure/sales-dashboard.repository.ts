import { db as prisma, SaleStatus } from "@/lib/db";

/**
 * Aggregate sales amount for a specific employee within a date range.
 */
export async function aggregateSalesAmountByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
  statuses?: SaleStatus[],
  excludedStatuses?: SaleStatus[],
) {
  const whereClause: any = {
    employeeId,
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

export async function aggregateTotalSalesAmountByRequestedDateByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
  excludedStatuses?: SaleStatus[],
) {
  const whereClause: any = {
    employeeId,
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

/**
 * Find sale items with product details for a specific employee.
 */
export async function findSaleItemsByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
  excludedStatuses: SaleStatus[] = [],
) {
  return prisma.saleItem.findMany({
    where: {
      sale: {
        employeeId,
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: excludedStatuses },
      },
    },
    select: {
      totalPrice: true,
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

/**
 * Group sale status counts for a specific employee.
 */
export async function groupSaleStatusCountsByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.sale.groupBy({
    by: ["status"],
    where: {
      employeeId,
      saleDate: { gte: start, lte: end },
      deletedAt: null,
    },
    _count: true,
  });
}

/**
 * Sum sales target items for a specific employee.
 */
export async function sumSalesTargetItemsByEmployee(
  employeeId: string,
  year: number,
  month?: number,
) {
  const whereClause: any = {
    salesTargetStore: {
      salesTarget: {
        year,
        employeeId,
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
 * Find sales with customer province for a specific employee.
 */
export async function findSalesWithProvinceByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
  excludedStatuses: SaleStatus[],
) {
  return prisma.sale.findMany({
    where: {
      employeeId,
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

/**
 * Get the employee's name for display.
 */
export async function findEmployeeName(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true },
  });
  if (!employee) return null;
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    fullName: `${employee.firstName} ${employee.lastName}`,
  };
}
