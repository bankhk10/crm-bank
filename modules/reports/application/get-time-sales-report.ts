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


// 1. TIME-BASED SALES REPORT
// ============================================

export async function getTimeSalesReport(
  filter: DateRangeFilter,
): Promise<TimeSalesReportData> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] || // Fallback
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const { start, end } = getDateRange(filter);
  const durationInDays = differenceInDays(end, start) + 1; // +1 to include both start and end dates

  // Build scope filter
  const scopeFilter = await buildScopeFilter(session, viewScope);

  let previousStart: Date;
  let previousEnd: Date;

  if (durationInDays > 360) {
    // Year-over-Year for long periods (> approx 1 year)
    previousStart = subYears(start, 1);
    previousEnd = subYears(end, 1);
  } else if (durationInDays > 27) {
    // Month-over-Month for medium periods (> approx 1 month)
    previousStart = subMonths(start, 1);
    previousEnd = subMonths(end, 1);
  } else {
    // Previous contiguous period for short periods
    previousStart = subDays(start, durationInDays);
    previousEnd = subDays(end, durationInDays);
  }

  // Get main sales data
  const sales = await repo.findManySalesData({
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

  // Get customer provinces for region calculation
  const customerIds = [...new Set(sales.map((s) => s.customerId))];
  const customers = await repo.findManyCustomersData({
    where: { id: { in: customerIds } },
    select: { id: true, province: true },
  });
  const customerProvinceMap = new Map(customers.map((c) => [c.id, c.province]));

  // Get previous period sales for growth calculation
  const previousSales = await repo.aggregateSalesData({
    where: {
      saleDate: { gte: previousStart, lte: previousEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
  });

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const prevTotal = Number(previousSales._sum.totalAmount || 0);
  const growthPercentage =
    prevTotal > 0 ? ((totalSales - prevTotal) / prevTotal) * 100 : 0;

  // Daily data
  const dailyMap = new Map<string, { sales: number; orders: number }>();
  const dayOfWeekMap = new Map<number, { sales: number; orders: number }>();

  for (const sale of sales) {
    const dateKey = format(sale.saleDate, "yyyy-MM-dd");
    const dayOfWeek = sale.saleDate.getDay();

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { sales: 0, orders: 0 });
    }
    const daily = dailyMap.get(dateKey)!;
    daily.sales += Number(sale.totalAmount);
    daily.orders += 1;

    if (!dayOfWeekMap.has(dayOfWeek)) {
      dayOfWeekMap.set(dayOfWeek, { sales: 0, orders: 0 });
    }
    const dow = dayOfWeekMap.get(dayOfWeek)!;
    dow.sales += Number(sale.totalAmount);
    dow.orders += 1;
  }

  const dailyData = eachDayOfInterval({ start, end }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const data = dailyMap.get(key) || { sales: 0, orders: 0 };
    return {
      date: format(date, "dd MMM", { locale: th }),
      sales: data.sales,
      orders: data.orders,
    };
  });

  // Monthly data
  const monthlyMap = new Map<string, { sales: number; orders: number }>();
  for (const sale of sales) {
    const monthKey = format(sale.saleDate, "yyyy-MM");
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { sales: 0, orders: 0 });
    }
    const monthly = monthlyMap.get(monthKey)!;
    monthly.sales += Number(sale.totalAmount);
    monthly.orders += 1;
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy", { locale: th }),
      sales: data.sales,
      orders: data.orders,
    }));

  // Yearly data
  const yearlyMap = new Map<number, { sales: number; orders: number }>();
  for (const sale of sales) {
    const year = sale.saleDate.getFullYear();
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { sales: 0, orders: 0 });
    }
    const yearly = yearlyMap.get(year)!;
    yearly.sales += Number(sale.totalAmount);
    yearly.orders += 1;
  }

  const yearlyData = Array.from(yearlyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, data]) => ({
      year,
      sales: data.sales,
      orders: data.orders,
    }));

  // Best selling day of week
  let bestDay = { dayOfWeek: "ไม่มีข้อมูล", sales: 0, orders: 0 };
  for (const [dow, data] of dayOfWeekMap.entries()) {
    if (data.sales > bestDay.sales) {
      bestDay = {
        dayOfWeek: getDayOfWeekThai(dow),
        sales: data.sales,
        orders: data.orders,
      };
    }
  }

  // Best selling month
  let bestMonth = { month: "ไม่มีข้อมูล", sales: 0, orders: 0 };
  for (const data of monthlyData) {
    if (data.sales > bestMonth.sales) {
      bestMonth = data;
    }
  }

  // Seasonality (Quarterly)
  const quarterlyMap = new Map<number, { sales: number; orders: number }>();
  for (const sale of sales) {
    const month = sale.saleDate.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    if (!quarterlyMap.has(quarter)) {
      quarterlyMap.set(quarter, { sales: 0, orders: 0 });
    }
    const q = quarterlyMap.get(quarter)!;
    q.sales += Number(sale.totalAmount);
    q.orders += 1;
  }

  const seasonalityData = [1, 2, 3, 4].map((quarter) => {
    const data = quarterlyMap.get(quarter) || { sales: 0, orders: 0 };
    return {
      quarter: getQuarterLabel(quarter),
      sales: data.sales,
      orders: data.orders,
      percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
    };
  });

  // Sales by region
  const regionMap = new Map<string, { sales: number; orders: number }>();
  for (const sale of sales) {
    const province = customerProvinceMap.get(sale.customerId) ?? null;
    const region = getRegionFromProvince(province);

    if (!regionMap.has(region)) {
      regionMap.set(region, { sales: 0, orders: 0 });
    }
    const rd = regionMap.get(region)!;
    rd.sales += Number(sale.totalAmount);
    rd.orders += 1;
  }

  const salesByRegion = Array.from(regionMap.entries())
    .map(([region, data]) => ({
      region,
      totalSales: data.sales,
      orderCount: data.orders,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  return {
    totalSales,
    totalOrders,
    avgOrderValue,
    growthPercentage,
    dailyData,
    monthlyData,
    yearlyData,
    bestSellingDay: bestDay,
    bestSellingMonth: bestMonth,
    seasonalityData,
    salesByRegion,
  };
}

// ============================================
