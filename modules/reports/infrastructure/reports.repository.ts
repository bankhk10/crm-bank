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

export async function findSalesYears() {
  const result = await prisma.$queryRaw`
    SELECT DISTINCT CAST(EXTRACT(YEAR FROM "saleDate") AS INTEGER) as year
    FROM "Sale"
    WHERE "deletedAt" IS NULL
    ORDER BY year DESC
  `;
  return result as { year: number }[];
}

export async function findMonthlyTrendSummary(
  year: number,
  whereConstraint: Prisma.SaleWhereInput,
) {
  // Use raw query for accurate month grouping
  let query = Prisma.sql`
    SELECT 
      CAST(EXTRACT(MONTH FROM "saleDate") AS INTEGER) as month,
      SUM("totalAmount") as "totalAmountSum",
      COUNT("id") as "orderCountSum"
    FROM "Sale"
    WHERE EXTRACT(YEAR FROM "saleDate") = ${year}
      AND "deletedAt" IS NULL
      AND "status" NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
  `;

  if (whereConstraint.customerId) {
    query = Prisma.sql`${query} AND "customerId" = ${whereConstraint.customerId}`;
  }
  if (whereConstraint.employeeId) {
    query = Prisma.sql`${query} AND "employeeId" = ${whereConstraint.employeeId}`;
  }

  query = Prisma.sql`${query} GROUP BY EXTRACT(MONTH FROM "saleDate") ORDER BY month ASC`;

  const result = (await prisma.$queryRaw(query)) as any[];

  return result.map((r) => ({
    month: r.month,
    _sum: {
      totalAmount: Number(r.totalAmountSum || 0),
      orderCount: Number(r.orderCountSum || 0),
    },
  }));
}

export async function findProductBreakdownSummary(
  year: number,
  whereConstraint: Prisma.SaleWhereInput,
  take = 5,
) {
  let query = Prisma.sql`
    SELECT 
      si."productId",
      p."brand",
      SUM(si."totalPrice") as "totalAmountSum",
      SUM(si."quantity") as "quantitySum",
      COUNT(DISTINCT s."id") as "orderCountSum"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s."id"
    JOIN "Product" p ON si."productId" = p."id"
    WHERE EXTRACT(YEAR FROM s."saleDate") = ${year}
      AND s."deletedAt" IS NULL
      AND s."status" NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
  `;

  if (whereConstraint.customerId) {
    query = Prisma.sql`${query} AND s."customerId" = ${whereConstraint.customerId}`;
  }
  if (whereConstraint.employeeId) {
    query = Prisma.sql`${query} AND s."employeeId" = ${whereConstraint.employeeId}`;
  }

  query = Prisma.sql`${query} 
    GROUP BY si."productId", p."brand" 
    ORDER BY "totalAmountSum" DESC 
    LIMIT ${take}`;

  const result = (await prisma.$queryRaw(query)) as any[];

  return result.map((r) => ({
    productId: r.productId,
    brand: r.brand,
    _sum: {
      totalAmount: Number(r.totalAmountSum || 0),
      quantity: Number(r.quantitySum || 0),
      orderCount: Number(r.orderCountSum || 0),
    },
  }));
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
      tradeNameGroup: { select: { description: true } },
    },
  } as any);
}

export async function groupDailySalesSummaryByMonthAndYear(
  productId: string,
  start: Date,
  end: Date,
  options: any,
) {
  // options could contain employeeId, customerId etc.
  let query = Prisma.sql`
    SELECT 
      CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
      CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
      SUM(si."totalPrice") as "totalAmountSum"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s."id"
    WHERE si."productId" = ${productId}
      AND s."saleDate" >= ${start}
      AND s."saleDate" <= ${end}
      AND s."deletedAt" IS NULL
      AND s."status" NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
  `;

  if (options.employeeId) {
    if (typeof options.employeeId === "object" && options.employeeId.in) {
      query = Prisma.sql`${query} AND s."employeeId" = ANY(${options.employeeId.in}::text[])`;
    } else {
      query = Prisma.sql`${query} AND s."employeeId" = ${options.employeeId}`;
    }
  }
  if (options.customerId) {
    query = Prisma.sql`${query} AND s."customerId" = ${options.customerId}`;
  }

  query = Prisma.sql`${query} GROUP BY year, month ORDER BY year ASC, month ASC`;

  const result = (await prisma.$queryRaw(query)) as any[];

  return result.map((r) => ({
    month: r.month,
    year: r.year,
    _sum: {
      totalAmount: Number(r.totalAmountSum || 0),
    },
  }));
}

export async function groupAllProductsPeakPeriods(
  start: Date,
  end: Date,
  options: any,
) {
  // Use raw query with DISTINCT ON to get peak month for each product efficiently
  let query = Prisma.sql`
    WITH MonthlySales AS (
      SELECT 
        si."productId",
        CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
        CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
        SUM(si."totalPrice") as "totalAmountSum"
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s."id"
      WHERE s."saleDate" >= ${start}
        AND s."saleDate" <= ${end}
        AND s."deletedAt" IS NULL
        AND s."status" NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
  `;

  if (options.employeeId) {
    if (typeof options.employeeId === "object" && options.employeeId.in) {
      query = Prisma.sql`${query} AND s."employeeId" = ANY(${options.employeeId.in}::text[])`;
    } else {
      query = Prisma.sql`${query} AND s."employeeId" = ${options.employeeId}`;
    }
  }

  if (options.customerId) {
    query = Prisma.sql`${query} AND s."customerId" = ${options.customerId}`;
  }

  // Handle department scope which might be in options (from buildScopeFilter)
  if (options.employee?.departmentId) {
    query = Prisma.sql`${query} AND EXISTS (
      SELECT 1 FROM "Employee" e 
      WHERE e.id = s."employeeId" 
      AND e."departmentId" = ${options.employee.departmentId}
    )`;
  }

  query = Prisma.sql`${query} 
      GROUP BY si."productId", year, month
    )
    SELECT DISTINCT ON ("productId")
      "productId",
      month,
      year,
      "totalAmountSum"
    FROM MonthlySales
    ORDER BY "productId", "totalAmountSum" DESC
  `;

  const result = (await prisma.$queryRaw(query)) as any[];

  return result.map((r) => ({
    productId: r.productId,
    month: r.month,
    year: r.year,
    totalSales: Number(r.totalAmountSum || 0),
  }));
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

export async function findTradeNameGroups() {
  return prisma.tradeNameGroup.findMany({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });
}

export async function findProductIdsByGroup(tradeNameGroupId: string) {
  return prisma.product.findMany({
    where: { tradeNameGroupId, deletedAt: null },
    select: { id: true },
  } as any);
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
  tradeNameGroupId: string,
  start: Date,
  end: Date,
  options: any,
) {
  let query = Prisma.sql`
    SELECT 
      CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
      CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
      SUM(si."totalPrice") as "totalAmountSum"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s."id"
    JOIN "Product" p ON si."productId" = p."id"
    WHERE p."tradeNameGroupId" = ${tradeNameGroupId}
      AND s."saleDate" >= ${start}
      AND s."saleDate" <= ${end}
      AND s."deletedAt" IS NULL
      AND s."status" NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
  `;

  if (options.employeeId) {
    query = Prisma.sql`${query} AND s."employeeId" = ${options.employeeId}`;
  }
  if (options.customerId) {
    query = Prisma.sql`${query} AND s."customerId" = ${options.customerId}`;
  }

  query = Prisma.sql`${query} GROUP BY year, month ORDER BY year ASC, month ASC`;

  const result = (await prisma.$queryRaw(query)) as any[];

  return result.map((r) => ({
    month: r.month,
    year: r.year,
    _sum: {
      totalAmount: Number(r.totalAmountSum || 0),
    },
  }));
}

// ==========================================
// GET-REPORTS: SALESPERSON DETAIL
// ==========================================

export async function findEmployeeDetailById(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      employeeCode: true,
      birthDate: true,
      addressLine: true,
      province: true,
      district: true,
      subdistrict: true,
      postalCode: true,
      responsibilityArea: true,
      status: true,
      positionTitle: true,
      roleTitle: true,
      company: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      pointSummary: { select: { totalPoints: true } },
      responsibleCustomers: {
        where: { deletedAt: null },
        select: {
          id: true,
          customerCode: true,
          name: true,
          customerType: true,
          province: true,
          region: true,
          status: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function aggregateSalesKpiByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.sale.aggregate({
    where: {
      employeeId,
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });
}

export async function countUniqueCustomersByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
) {
  const result = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      employeeId,
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
  });
  return result.length;
}

export async function getLastSaleDateByEmployee(employeeId: string) {
  return prisma.sale.findFirst({
    where: {
      employeeId,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    orderBy: { saleDate: "desc" },
    select: { saleDate: true },
  });
}

export async function groupMonthlySalesByEmployee(
  employeeId: string,
  year: number,
) {
  return prisma.sale.groupBy({
    by: ["saleDate"],
    where: {
      employeeId,
      saleDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });
}

export async function groupProductSalesByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        employeeId,
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      },
    },
    _sum: { totalPrice: true, quantity: true },
    _count: true,
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 20,
  });
}

export async function groupCustomerSalesByEmployee(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      employeeId,
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });
}

export async function findSalesTargetsForEmployee(
  employeeId: string,
  year: number,
) {
  return prisma.salesTarget.findMany({
    where: { employeeId, year },
    include: {
      stores: {
        include: {
          customer: { select: { name: true, customerCode: true } },
          items: {
            include: {
              product: { select: { name: true, productCode: true } },
            },
          },
        },
      },
    },
    orderBy: { month: "asc" },
  });
}

export async function findPointHistoryByEmployee(
  employeeId: string,
  limit = 50,
) {
  return prisma.employeePointHistory.findMany({
    where: { employeeId },
    include: {
      product: { select: { name: true, productCode: true } },
      sale: { select: { saleNumber: true, saleDate: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findRecentSalesByEmployee(
  employeeId: string,
  limit = 20,
) {
  return prisma.sale.findMany({
    where: {
      employeeId,
      deletedAt: null,
    },
    select: {
      id: true,
      saleNumber: true,
      saleDate: true,
      status: true,
      totalAmount: true,
      customer: {
        select: { id: true, name: true, customerCode: true },
      },
    },
    orderBy: { saleDate: "desc" },
    take: limit,
  });
}

export async function countSalesByStatusForEmployee(
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
export const findManyTradeNameGroupsData =
  prisma.tradeNameGroup.findMany.bind(prisma.tradeNameGroup);

// ==========================================
// MONTHLY SALES OVERVIEW (Report List View)
// ==========================================

/**
 * ยอดขายรวม (Total Sales) ตาม requestedDeliveryDate กรุ๊ปรายเดือน
 * ไม่นับ CANCELLED
 */
export async function findMonthlyTotalSalesByYear(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const result = (await prisma.$queryRaw`
    SELECT 
      CAST(EXTRACT(MONTH FROM "requestedDeliveryDate") AS INTEGER) as month,
      SUM("totalAmount") as "totalAmountSum",
      COUNT("id") as "orderCount"
    FROM "Sale"
    WHERE "requestedDeliveryDate" >= ${start}
      AND "requestedDeliveryDate" <= ${end}
      AND "deletedAt" IS NULL
      AND "status" NOT IN ('CANCELLED')
    GROUP BY EXTRACT(MONTH FROM "requestedDeliveryDate")
    ORDER BY month ASC
  `) as any[];

  return result.map((r) => ({
    month: Number(r.month),
    totalAmount: Number(r.totalAmountSum || 0),
    orderCount: Number(r.orderCount || 0),
  }));
}

/**
 * ยอด SalesNote ตาม saleDate กรุ๊ปรายเดือน
 * ไม่นับ CANCELLED
 */
export async function findMonthlySalesNoteSalesByYear(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const result = (await prisma.$queryRaw`
    SELECT 
      CAST(EXTRACT(MONTH FROM "saleDate") AS INTEGER) as month,
      SUM("totalAmount") as "totalAmountSum",
      COUNT("id") as "orderCount"
    FROM "Sale"
    WHERE "saleDate" >= ${start}
      AND "saleDate" <= ${end}
      AND "deletedAt" IS NULL
      AND "status" NOT IN ('CANCELLED')
    GROUP BY EXTRACT(MONTH FROM "saleDate")
    ORDER BY month ASC
  `) as any[];

  return result.map((r) => ({
    month: Number(r.month),
    totalAmount: Number(r.totalAmountSum || 0),
    orderCount: Number(r.orderCount || 0),
  }));
}

/**
 * ยอด Invoice ตาม Shipment ที่ส่งเสร็จแล้ว (DELIVERED/IN_TRANSIT/COMPLETED) กรุ๊ปรายเดือน
 * ใช้ scheduledDate → actualDate → sale.requestedDeliveryDate เป็น fallback
 * + Sale ที่ไม่มี Shipment (flow เก่า) ที่มี invoice status
 */
export async function findMonthlyInvoiceSalesByYear(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  // 1. Shipment-based invoice
  const shipmentResult = (await prisma.$queryRaw`
    SELECT 
      CAST(EXTRACT(MONTH FROM COALESCE(
        sh."scheduledDate", 
        sh."actualDate", 
        s."requestedDeliveryDate"
      )) AS INTEGER) as month,
      SUM(sh."totalAmount") as "totalAmountSum",
      COUNT(sh."id") as "shipmentCount"
    FROM "Shipment" sh
    JOIN "Sale" s ON sh."saleId" = s."id"
    WHERE sh."status" IN ('DELIVERED', 'IN_TRANSIT', 'COMPLETED')
      AND s."deletedAt" IS NULL
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") >= ${start}
      AND COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate") <= ${end}
    GROUP BY EXTRACT(MONTH FROM COALESCE(sh."scheduledDate", sh."actualDate", s."requestedDeliveryDate"))
    ORDER BY month ASC
  `) as any[];

  // 2. Legacy: Sale ที่ไม่มี Shipment เลย + status invoice
  const legacyResult = (await prisma.$queryRaw`
    SELECT 
      CAST(EXTRACT(MONTH FROM COALESCE(
        s."deliveryDate", 
        s."requestedDeliveryDate",
        s."saleDate"
      )) AS INTEGER) as month,
      SUM(s."totalAmount") as "totalAmountSum",
      COUNT(s."id") as "orderCount"
    FROM "Sale" s
    WHERE s."deletedAt" IS NULL
      AND s."status" IN ('PAID', 'DELIVERED', 'DELIVERY_COMPLETED', 'COMPLETED')
      AND NOT EXISTS (SELECT 1 FROM "Shipment" sh WHERE sh."saleId" = s."id")
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") >= ${start}
      AND COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate") <= ${end}
    GROUP BY EXTRACT(MONTH FROM COALESCE(s."deliveryDate", s."requestedDeliveryDate", s."saleDate"))
    ORDER BY month ASC
  `) as any[];

  // Merge both results by month
  const monthMap = new Map<number, { totalAmount: number; count: number }>();

  for (const r of shipmentResult) {
    const m = Number(r.month);
    const existing = monthMap.get(m) || { totalAmount: 0, count: 0 };
    existing.totalAmount += Number(r.totalAmountSum || 0);
    existing.count += Number(r.shipmentCount || 0);
    monthMap.set(m, existing);
  }

  for (const r of legacyResult) {
    const m = Number(r.month);
    const existing = monthMap.get(m) || { totalAmount: 0, count: 0 };
    existing.totalAmount += Number(r.totalAmountSum || 0);
    existing.count += Number(r.orderCount || 0);
    monthMap.set(m, existing);
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      totalAmount: data.totalAmount,
      invoiceCount: data.count,
    }))
    .sort((a, b) => a.month - b.month);
}
