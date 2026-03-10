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


// 3. PRODUCT GROUP SALES REPORT
// ============================================

export async function getProductGroupSalesReport(
  filter: DateRangeFilter,
): Promise<ProductGroupSalesReportData> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewScope =
    session.user.dataAccessByResource["report"] ||
    session.user.dataAccessByResource["sale"] ||
    null;

  if (!viewScope) throw new Error("Unauthorized");

  const { start, end } = getDateRange(filter);

  // Build scope filter
  // Build scope filter
  const scopeFilter = await buildScopeFilter(session, viewScope);
  // Get all product groups from database
  const productGroups = await repo.findManyProductGroupMastersData({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });

  const productGroupOptions = productGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  // Get group performance
  const groupPerformance = await Promise.all(
    productGroupOptions.map(async (groupOption) => {
      const group = groupOption.value;

      // Get products in this group
      const products = await repo.findManyProductsData({
        where: { productGroup: group },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);

      if (productIds.length === 0) {
        return {
          group: groupOption.label,
          totalSales: 0,
          totalQuantity: 0,
          orderCount: 0,
          productCount: 0,
          avgSalesPerProduct: 0,
        };
      }

      // Get sales data
      const salesData = await prisma.saleItem.aggregate({
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

      // Get order count
      const orderCount = await repo.groupSaleItemsData({
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

      const totalSales = Number(salesData._sum.totalPrice || 0);

      return {
        group: groupOption.label,
        totalSales,
        totalQuantity: Number(salesData._sum.quantity || 0),
        orderCount: orderCount.length,
        productCount: productIds.length,
        avgSalesPerProduct:
          productIds.length > 0 ? totalSales / productIds.length : 0,
      };
    }),
  );

  // Sort to find top and worst
  const sortedGroups = [...groupPerformance].sort(
    (a, b) => b.totalSales - a.totalSales,
  );
  const topGroup = sortedGroups[0] || { group: "-", totalSales: 0 };
  const worstGroupData = sortedGroups.filter((g) => g.totalSales > 0).pop() || {
    group: "-",
    totalSales: 0,
  };

  // Group peak periods
  const groupPeakPeriods = await Promise.all(
    productGroupOptions.map(async (groupOption) => {
      const monthlyData = await prisma.dailySalesSummary.groupBy({
        by: ["month", "year"],
        where: {
          productGroup: groupOption.value,
          date: { gte: start, lte: end },
          ...(viewScope === DataAccessLevel.VIEW_OWN
            ? { employeeId: session.user.employeeId! }
            : {}),
          ...(viewScope === ("VIEW_TEAM" as DataAccessLevel)
            ? { employeeId: { in: await getTeamEmployeeIds(session) } }
            : {}),
          ...(viewScope === DataAccessLevel.VIEW_DEPARTMENT
            ? { employee: { departmentId: session.user.departmentId! } }
            : {}),
        },
        _sum: { totalAmount: true },
      });

      let peakMonth = { month: "ไม่มีข้อมูล", sales: 0 };
      for (const data of monthlyData) {
        const sales = Number(data._sum.totalAmount || 0);
        if (sales > peakMonth.sales) {
          peakMonth = {
            month: format(new Date(data.year, data.month - 1), "MMM yyyy", {
              locale: th,
            }),
            sales,
          };
        }
      }

      return {
        group: groupOption.label,
        peakMonth: peakMonth.month,
        sales: peakMonth.sales,
      };
    }),
  );

  // Monthly trend per group
  const months = eachMonthOfInterval({ start, end });
  const groupMonthlyTrend = await Promise.all(
    months.map(async (monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const groupsData = await Promise.all(
        productGroupOptions.map(async (groupOption) => {
          const products = await repo.findManyProductsData({
            where: { productGroup: groupOption.value, deletedAt: null },
            select: { id: true },
          });
          const productIds = products.map((p) => p.id);

          if (productIds.length === 0) {
            return { group: groupOption.label, sales: 0, orders: 0 };
          }

          const data = await prisma.saleItem.aggregate({
            where: {
              productId: { in: productIds },
              sale: {
                saleDate: { gte: monthStart, lte: monthEnd },
                deletedAt: null,
                status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
                ...scopeFilter,
              },
            },
            _sum: { totalPrice: true },
          });

          const orderCount = await repo.groupSaleItemsData({
            by: ["saleId"],
            where: {
              productId: { in: productIds },
              sale: {
                saleDate: { gte: monthStart, lte: monthEnd },
                deletedAt: null,
                status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
                ...scopeFilter,
              },
            },
          });

          return {
            group: groupOption.label,
            sales: Number(data._sum.totalPrice || 0),
            orders: orderCount.length,
          };
        }),
      );

      return {
        month: format(monthDate, "MMM yyyy", { locale: th }),
        groups: groupsData,
      };
    }),
  );

  return {
    groupPerformance,
    topGroup: { group: topGroup.group, sales: topGroup.totalSales },
    worstGroup: {
      group: worstGroupData.group,
      sales: worstGroupData.totalSales,
    },
    groupPeakPeriods,
    groupMonthlyTrend,
  };
}

// ============================================
