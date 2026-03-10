import { db as prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ==========================================
// SHARED QUERIES
// ==========================================

export async function findTeamEmployeeIds(
  employeeId: string,
  managerId?: string | null,
): Promise<string[]> {
  const teamMembers = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        ...(managerId ? [{ managerId }] : []),
        ...(managerId ? [{ id: managerId }] : []),
        { managerId: employeeId },
        { id: employeeId },
      ],
    },
    select: { id: true },
  });
  return [...new Set(teamMembers.map((m) => m.id))];
}

// ==========================================
// GET-SALES-REPORT QUERIES
// ==========================================

export async function findCustomersWithScope(
  whereCustomer: Prisma.CustomerWhereInput,
) {
  return prisma.customer.findMany({
    select: { id: true, name: true, customerCode: true },
    where: { ...whereCustomer, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function findEmployeesWithScope(
  whereEmployee: Prisma.EmployeeWhereInput,
) {
  return prisma.employee.findMany({
    select: { id: true, name: true },
    where: { ...whereEmployee, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function findDailySalesSummaryYears() {
  return prisma.dailySalesSummary.groupBy({
    by: ["year"],
    orderBy: { year: "desc" },
  });
}

export async function findMonthlyTrendSummary(
  year: number,
  whereConstraint: Prisma.DailySalesSummaryWhereInput,
) {
  return prisma.dailySalesSummary.groupBy({
    by: ["month"],
    where: {
      year,
      ...whereConstraint,
    },
    _sum: {
      totalAmount: true,
      quantity: true,
      orderCount: true,
    },
    orderBy: { month: "asc" },
  });
}

export async function findProductBreakdownSummary(
  year: number,
  whereConstraint: Prisma.DailySalesSummaryWhereInput,
  take = 5,
) {
  return prisma.dailySalesSummary.groupBy({
    by: ["productId", "brand"],
    where: {
      year,
      ...whereConstraint,
    },
    _sum: {
      totalAmount: true,
      quantity: true,
      orderCount: true,
    },
    orderBy: {
      _sum: { totalAmount: "desc" },
    },
    take,
  });
}

export async function findProductsByIds(productIds: string[]) {
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, productCode: true },
  });
}

export async function findSaleOrderHistory(
  startDate: Date,
  endDate: Date,
  whereConstraint: Prisma.SaleWhereInput,
  limit = 50,
) {
  return prisma.sale.findMany({
    where: {
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      status: "COMPLETED",
      ...whereConstraint,
    },
    select: {
      id: true,
      saleNumber: true,
      saleDate: true,
      totalAmount: true,
      items: {
        select: {
          product: { select: { name: true, productCode: true } },
          quantity: true,
          totalPrice: true,
          unitPrice: true,
        },
      },
    },
    orderBy: {
      saleDate: "desc",
    },
    take: limit,
  });
}

// ==========================================
// GET-REPORTS: TIME SALES REPORT
// ==========================================

export async function findSalesInPeriod(
  start: Date,
  end: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    select: {
      id: true,
      saleDate: true,
      totalAmount: true,
      createdAt: true,
      customerId: true,
    },
  });
}

export async function findCustomerProvincesByIds(customerIds: string[]) {
  return prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, province: true },
  });
}

export async function aggregateSalesAmountInPeriod(
  start: Date,
  end: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.sale.aggregate({
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
  });
}

// ==========================================
// GET-REPORTS: PRODUCT SALES REPORT
// ==========================================

export async function groupProductSalesInPeriod(
  start: Date,
  end: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        ...scopeFilter,
      },
    },
    _sum: {
      totalPrice: true,
      quantity: true,
    },
    _count: true,
    orderBy: {
      _sum: { totalPrice: "desc" },
    },
  });
}

export async function findProductsDetailsByIds(productIds: string[]) {
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      productCode: true,
      name: true,
      brand: true,
      productGroup: true,
    },
  });
}

export async function groupDailySalesSummaryByMonthAndYear(
  productId: string,
  start: Date,
  end: Date,
  options: any,
) {
  return prisma.dailySalesSummary.groupBy({
    by: ["month", "year"],
    where: {
      productId,
      date: { gte: start, lte: end },
      ...options,
    },
    _sum: { totalAmount: true },
  });
}

export async function findLowStockProducts() {
  return prisma.productStock.findMany({
    where: {
      availableQuantity: { lt: 50 },
      product: { deletedAt: null, status: "ACTIVE" },
    },
    include: {
      product: {
        select: {
          id: true,
          productCode: true,
          name: true,
          stockLots: {
            where: { expiryDate: { gte: new Date() } },
            orderBy: { expiryDate: "asc" },
            take: 1,
            select: { expiryDate: true },
          },
        },
      },
    },
    orderBy: { availableQuantity: "asc" },
    take: 20,
  });
}

export async function findRecentSoldProductIds(
  ninetyDaysAgo: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.saleItem.findMany({
    where: {
      sale: {
        saleDate: { gte: ninetyDaysAgo },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        ...scopeFilter,
      },
    },
    select: { productId: true },
    distinct: ["productId"],
  });
}

export async function findStagnantProducts(
  recentSoldIds: string[],
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.product.findMany({
    where: {
      id: { notIn: Array.from(recentSoldIds) },
      deletedAt: null,
      status: "ACTIVE",
      stock: { physicalBalance: { gt: 0 } },
    },
    include: {
      stock: true,
      saleItems: {
        where: {
          sale: {
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            ...scopeFilter,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    take: 20,
  });
}

// ==========================================
// GET-REPORTS: PRODUCT GROUP SALES REPORT
// ==========================================

export async function findProductGroupMasters() {
  return prisma.productGroupMaster.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}

export async function findProductIdsByGroup(productGroup: string) {
  return prisma.product.findMany({
    where: { productGroup, deletedAt: null },
    select: { id: true },
  });
}

export async function aggregateSaleItemsByProductIds(
  productIds: string[],
  start: Date,
  end: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.saleItem.aggregate({
    where: {
      productId: { in: productIds },
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        ...scopeFilter,
      },
    },
    _sum: {
      totalPrice: true,
      quantity: true,
    },
  });
}

export async function groupOrderCountByProductIds(
  productIds: string[],
  start: Date,
  end: Date,
  scopeFilter: Prisma.SaleWhereInput,
) {
  return prisma.saleItem.groupBy({
    by: ["saleId"],
    where: {
      productId: { in: productIds },
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        ...scopeFilter,
      },
    },
  });
}

export async function groupDailySalesSummaryByGroupMonthYear(
  productGroup: string,
  start: Date,
  end: Date,
  options: any,
) {
  return prisma.dailySalesSummary.groupBy({
    by: ["month", "year"],
    where: {
      productGroup,
      date: { gte: start, lte: end },
      ...options,
    },
    _sum: { totalAmount: true },
  });
}

// ==========================================
// GET-REPORTS: GENERIC FINDERS AND GROUPERS
// ==========================================

export const groupSalesData = prisma.sale.groupBy.bind(prisma.sale);
export const aggregateSalesData = prisma.sale.aggregate.bind(prisma.sale);
export const findManySalesData = prisma.sale.findMany.bind(prisma.sale);
export const groupSaleItemsData = prisma.saleItem.groupBy.bind(prisma.saleItem);
export const findManyCustomersData = prisma.customer.findMany.bind(
  prisma.customer,
);
export const findManyEmployeesData = prisma.employee.findMany.bind(
  prisma.employee,
);
export const findManyProductsData = prisma.product.findMany.bind(
  prisma.product,
);
export const findManyProductGroupMastersData =
  prisma.productGroupMaster.findMany.bind(prisma.productGroupMaster);
