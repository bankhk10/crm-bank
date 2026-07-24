import * as repo from "../infrastructure/reports.repository";
import {
  format,
  parseISO,
  eachDayOfInterval,
  differenceInDays,
  subMonths,
  subYears,
  subDays,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  getDateRange,
  getDayOfWeekThai,
  getQuarterLabel,
  getRegionFromProvince,
} from "./utils";
import { DateRangeFilter, TimeSalesReportData } from "../types";
import { buildScopeFilter } from "./helpers";

// 1. TIME-BASED SALES REPORT
// ============================================

export async function getTimeSalesReport(filter: DateRangeFilter, session: any): Promise<TimeSalesReportData> {

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

  // We fetch data for the entire year of the 'start' date (and up to the 'end' date) to provide annual context
  const fetchStart = startOfYear(start);
  const fetchEnd = end > endOfYear(start) ? end : endOfYear(start);

  // Get ALL sales for this trend range (for monthly charts)
  const allTrendSales = await repo.findManySalesData({
    where: {
      requestedDeliveryDate: { gte: fetchStart, lte: fetchEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED"] },
      ...scopeFilter,
    },
    select: {
      id: true,
      saleDate: true,
      requestedDeliveryDate: true,
      totalAmount: true,
      createdAt: true,
      customerId: true,
    },
  });

  // Filter for the SPECIFIC range selected (for KPIs and Daily/Other tables)
  const sales = allTrendSales.filter(s => {
    const d = s.requestedDeliveryDate;
    return d && d >= start && d <= end;
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
      requestedDeliveryDate: { gte: previousStart, lte: previousEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED"] },
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
    const targetDate = sale.requestedDeliveryDate;
    if (!targetDate) continue;
    const dateKey = format(targetDate, "yyyy-MM-dd");
    const dayOfWeek = targetDate.getDay();

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
      isoDate: key,
      sales: data.sales,
      orders: data.orders,
    };
  });

  // Monthly data (Always at least 12 months of the year)
  const monthlyMap = new Map<string, { sales: number; orders: number }>();
  for (const sale of allTrendSales) {
    const targetDate = sale.requestedDeliveryDate;
    if (!targetDate) continue;
    const monthKey = format(targetDate, "yyyy-MM");
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { sales: 0, orders: 0 });
    }
    const monthly = monthlyMap.get(monthKey)!;
    monthly.sales += Number(sale.totalAmount);
    monthly.orders += 1;
  }

  const monthlyData = eachMonthOfInterval({ start: fetchStart, end: fetchEnd }).map((date) => {
    const monthKey = format(date, "yyyy-MM");
    const data = monthlyMap.get(monthKey) || { sales: 0, orders: 0 };
    return {
      month: format(date, "MMM", { locale: th }), // Simpler month name for better chart fit
      fullName: `${format(date, "MMMM", { locale: th })} ${date.getFullYear() + 543}`,
      sales: data.sales,
      orders: data.orders,
    };
  });

  // Yearly data
  const yearlyMap = new Map<number, { sales: number; orders: number }>();
  for (const sale of sales) {
    const targetDate = sale.requestedDeliveryDate;
    if (!targetDate) continue;
    const year = targetDate.getFullYear();
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
      year: year + 543,
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
    const targetDate = sale.requestedDeliveryDate;
    if (!targetDate) continue;
    const month = targetDate.getMonth();
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
