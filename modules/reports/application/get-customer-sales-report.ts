import { db as prisma } from "@/lib/db";
import * as repo from "../infrastructure/reports.repository";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  eachMonthOfInterval,
  eachDayOfInterval,
  differenceInDays,
  subMonths,
  subYears,
  subDays,
} from "date-fns";
import { th } from "date-fns/locale";
import { getDateRange, getDayOfWeekThai, getQuarterLabel, getRegionFromProvince } from "../utils";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { DataAccessLevel } from "@/lib/db";
import {
  DateRangeFilter,
  TimeSalesReportData,
  ProductSalesReportData,
  ProductGroupSalesReportData,
  CustomerSalesReportData,
  SalespersonReportData,
} from "../types";
import { getTeamEmployeeIds, buildScopeFilter } from "./helpers";


// 4. CUSTOMER SALES REPORT
// ============================================

export async function getCustomerSalesReport(
  filter: DateRangeFilter,
): Promise<CustomerSalesReportData> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const { start, end } = getDateRange(filter);
  const dayCount = differenceInDays(end, start) + 1;
  const monthCount = Math.max(1, dayCount / 30);

  // Build scope filter
  // Build scope filter
  const scopeFilter = await buildScopeFilter(session, viewScope);

  // Top customers
  const customerSales = await repo.groupSalesData({
    by: ["customerId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 50,
  });

  const customerIds = customerSales.map((c) => c.customerId);

  // Get customer details and lifetime value
  const customers = await repo.findManyCustomersData({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      customerCode: true,
      name: true,
      customerType: true,
      province: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
      _count: {
        select: {
          sales: {
            where: {
              deletedAt: null,
              status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
              ...scopeFilter,
            },
          },
        },
      },
    },
  });

  // Get lifetime value for each customer
  const lifetimeValues = await repo.groupSalesData({
    by: ["customerId"],
    where: {
      customerId: { in: customerIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
  });
  const lifetimeMap = new Map(
    lifetimeValues.map((l) => [l.customerId, Number(l._sum.totalAmount || 0)]),
  );

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const topCustomers = customerSales.map((cs) => {
    const customer = customerMap.get(cs.customerId);
    const totalSales = Number(cs._sum.totalAmount || 0);
    const orderCount = cs._count;

    return {
      id: cs.customerId,
      code: customer?.customerCode || "",
      name: customer?.name || "Unknown",
      type: customer?.customerType || "-",
      province: customer?.province || "-",
      totalSales,
      orderCount,
      avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      purchaseFrequency: orderCount / monthCount,
      lifetimeValue: lifetimeMap.get(cs.customerId) || totalSales,
      lastPurchaseDate: customer?.sales[0]?.saleDate
        ? format(customer.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });

  // Customer type breakdown
  const allCustomerSales = await repo.groupSalesData({
    by: ["customerId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
  });

  const allCustomers = await repo.findManyCustomersData({
    where: { id: { in: allCustomerSales.map((c) => c.customerId) } },
    select: { id: true, customerType: true },
  });
  const typeMap = new Map(allCustomers.map((c) => [c.id, c.customerType]));

  const typeBreakdown = new Map<
    string,
    { count: Set<string>; sales: number }
  >();
  for (const cs of allCustomerSales) {
    const type = typeMap.get(cs.customerId) || "OTHER";
    if (!typeBreakdown.has(type)) {
      typeBreakdown.set(type, { count: new Set(), sales: 0 });
    }
    const breakdown = typeBreakdown.get(type)!;
    breakdown.count.add(cs.customerId);
    breakdown.sales += Number(cs._sum.totalAmount || 0);
  }

  const customerTypeBreakdown = Array.from(typeBreakdown.entries()).map(
    ([type, data]) => ({
      type,
      customerCount: data.count.size,
      totalSales: data.sales,
      avgSalesPerCustomer:
        data.count.size > 0 ? data.sales / data.count.size : 0,
    }),
  );

  // New vs returning customers
  const customersWithFirstPurchase = await repo.findManyCustomersData({
    where: {
      sales: {
        some: {
          saleDate: { gte: start, lte: end },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
      },
    },
    select: {
      id: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
        orderBy: { saleDate: "asc" },
        take: 1,
        select: { saleDate: true },
      },
    },
  });

  let newCustomers = 0,
    newCustomersSales = 0;
  let returningCustomers = 0,
    returningCustomersSales = 0;

  for (const customer of customersWithFirstPurchase) {
    const firstPurchase = customer.sales[0]?.saleDate;
    const customerData = allCustomerSales.find(
      (cs) => cs.customerId === customer.id,
    );
    const sales = Number(customerData?._sum.totalAmount || 0);

    if (firstPurchase && firstPurchase >= start && firstPurchase <= end) {
      newCustomers++;
      newCustomersSales += sales;
    } else {
      returningCustomers++;
      returningCustomersSales += sales;
    }
  }

  // Customer by region
  const customersWithProvince = await repo.findManyCustomersData({
    where: { id: { in: allCustomerSales.map((c) => c.customerId) } },
    select: { id: true, province: true },
  });
  const provinceMap = new Map(
    customersWithProvince.map((c) => [c.id, c.province]),
  );

  const regionData = new Map<string, { count: Set<string>; sales: number }>();
  for (const cs of allCustomerSales) {
    const province = provinceMap.get(cs.customerId) || null;
    const region = getRegionFromProvince(province);

    if (!regionData.has(region)) {
      regionData.set(region, { count: new Set(), sales: 0 });
    }
    const rd = regionData.get(region)!;
    rd.count.add(cs.customerId);
    rd.sales += Number(cs._sum.totalAmount || 0);
  }

  const customerByRegion = Array.from(regionData.entries())
    .map(([region, data]) => ({
      region,
      customerCount: data.count.size,
      totalSales: data.sales,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // Inactive customers (no purchase in selected period but had previous purchases)
  const inactiveCustomersData = await repo.findManyCustomersData({
    where: {
      sales: {
        some: {
          saleDate: { lt: start },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
        none: {
          saleDate: { gte: start, lte: end },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
      },
    },
    select: {
      id: true,
      customerCode: true,
      name: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true, totalAmount: true },
      },
    },
    take: 20,
  });

  // Get lifetime values for inactive customers
  const inactiveIds = inactiveCustomersData.map((c) => c.id);
  const inactiveLifetimeValues = await repo.groupSalesData({
    by: ["customerId"],
    where: {
      customerId: { in: inactiveIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
  });
  const inactiveLifetimeMap = new Map(
    inactiveLifetimeValues.map((l) => [
      l.customerId,
      Number(l._sum.totalAmount || 0),
    ]),
  );

  const inactiveCustomers = inactiveCustomersData
    .map((c) => ({
      id: c.id,
      code: c.customerCode,
      name: c.name,
      daysSinceLastPurchase: c.sales[0]?.saleDate
        ? differenceInDays(new Date(), c.sales[0].saleDate)
        : 999,
      lifetimeValue: inactiveLifetimeMap.get(c.id) || 0,
    }))
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  return {
    topCustomers,
    customerTypeBreakdown,
    customerAcquisition: {
      newCustomers,
      newCustomersSales,
      returningCustomers,
      returningCustomersSales,
    },
    customerByRegion,
    inactiveCustomers,
  };
}

// ============================================
