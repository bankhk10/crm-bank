import { db as prisma } from "@/lib/db";
import * as repo from "../infrastructure/reports.repository";
import {
  format,
  subMonths,
  subYears,
  subDays,
  differenceInDays,
  startOfMonth,
  parseISO,
} from "date-fns";
import { th } from "date-fns/locale";
import { getDateRange, getRegionFromProvince } from "./utils";
import { DateRangeFilter, ExecutiveDashboardData } from "../types";
import { buildScopeFilter } from "./helpers";

export async function getExecutiveDashboardReport(filter: DateRangeFilter, session: any): Promise<ExecutiveDashboardData> {

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const { start, end } = getDateRange(filter);
  const durationInDays = differenceInDays(end, start) + 1;
  const scopeFilter = await buildScopeFilter(session, viewScope);

  // Growth calculation periods
  let previousStart: Date;
  let previousEnd: Date;
  if (durationInDays > 360) {
    previousStart = subYears(start, 1);
    previousEnd = subYears(end, 1);
  } else if (durationInDays > 27) {
    previousStart = subMonths(start, 1);
    previousEnd = subMonths(end, 1);
  } else {
    previousStart = subDays(start, durationInDays);
    previousEnd = subDays(end, durationInDays);
  }

  // 1. Fetch Sales Summary & Previous Period
  const [sales, previousSales] = await Promise.all([
    repo.findManySalesData({
      where: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        ...scopeFilter,
      },
      select: {
        totalAmount: true,
        saleDate: true,
        customerId: true,
        employeeId: true,
      },
    }),
    repo.aggregateSalesData({
      where: {
        saleDate: { gte: previousStart, lte: previousEnd },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        ...scopeFilter,
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const prevSalesTotal = Number(previousSales._sum.totalAmount || 0);
  const growthPercentage =
    prevSalesTotal > 0 ? ((totalSales - prevSalesTotal) / prevSalesTotal) * 100 : 0;

  // 2. Monthly Trend
  const monthlyMap = new Map<string, { sales: number; orders: number }>();
  for (const s of sales) {
    const key = format(s.saleDate, "yyyy-MM");
    const existing = monthlyMap.get(key) || { sales: 0, orders: 0 };
    monthlyMap.set(key, {
      sales: existing.sales + Number(s.totalAmount),
      orders: existing.orders + 1,
    });
  }
  const monthlySales = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy", { locale: th }),
      sales: data.sales,
      orders: data.orders,
    }));

  // 3. Top Products
  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        ...scopeFilter,
      },
    },
    _sum: { totalPrice: true, quantity: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 5,
  });

  const productIds = topProductsRaw.map((p) => p.productId);
  const products = await repo.findManyProductsData({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const topProducts = topProductsRaw.map((p) => ({
    name: productMap.get(p.productId) || "Unknown",
    sales: Number(p._sum.totalPrice || 0),
    quantity: Number(p._sum.quantity || 0),
  }));

  // 4. Top Customers
  const customerSales = new Map<string, { sales: number; orders: number }>();
  for (const s of sales) {
    const existing = customerSales.get(s.customerId) || { sales: 0, orders: 0 };
    customerSales.set(s.customerId, {
      sales: existing.sales + Number(s.totalAmount),
      orders: existing.orders + 1,
    });
  }

  const topCustomerIds = Array.from(customerSales.entries())
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 5);

  const customerDetails = await repo.findManyCustomersData({
    where: { id: { in: topCustomerIds.map((c) => c[0]) } },
    select: { id: true, name: true },
  });
  const customerMap = new Map(customerDetails.map((c) => [c.id, c.name]));

  const topCustomers = topCustomerIds.map(([id, data]) => ({
    name: customerMap.get(id) || "Unknown",
    sales: data.sales,
    orders: data.orders,
  }));

  // 5. Top Salespersons
  const employeeSales = new Map<string, { sales: number; orders: number }>();
  for (const s of sales) {
    const existing = employeeSales.get(s.employeeId) || { sales: 0, orders: 0 };
    employeeSales.set(s.employeeId, {
      sales: existing.sales + Number(s.totalAmount),
      orders: existing.orders + 1,
    });
  }

  const topEmployeeIds = Array.from(employeeSales.entries())
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 5);

  const employeeDetails = await prisma.employee.findMany({
    where: { id: { in: topEmployeeIds.map((e) => e[0]) } },
    select: { id: true, firstName: true, lastName: true },
  });
  const employeeMap = new Map(
    employeeDetails.map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );

  const topSalespersons = topEmployeeIds.map(([id, data]) => ({
    name: employeeMap.get(id) || "Unknown",
    sales: data.sales,
    orders: data.orders,
  }));

  // 6. Sales by Region
  const uniqueCustomerIdsForRegion = [...new Set(sales.map((s) => s.customerId))];
  const regionCustomers = await repo.findManyCustomersData({
    where: { id: { in: uniqueCustomerIdsForRegion } },
    select: { id: true, province: true },
  });
  const customerProvinceMap = new Map(regionCustomers.map((c) => [c.id, c.province]));

  const regionMap = new Map<string, number>();
  for (const s of sales) {
    const province = customerProvinceMap.get(s.customerId) || null;
    const region = getRegionFromProvince(province);
    regionMap.set(region, (regionMap.get(region) || 0) + Number(s.totalAmount));
  }

  const salesByRegion = Array.from(regionMap.entries())
    .map(([region, sales]) => ({ region, sales }))
    .sort((a, b) => b.sales - a.sales);

  return {
    summary: { totalSales, totalOrders, avgOrderValue, growthPercentage },
    monthlySales,
    topProducts,
    topCustomers,
    topSalespersons,
    salesByRegion,
  };
}
