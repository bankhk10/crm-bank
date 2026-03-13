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
  const productGroups = await repo.findManyTradeNameGroupsData({
    where: { deletedAt: null },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });

  const productGroupOptions = productGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  // Helper to parse packageSize strings
  const parsePackageSize = (raw?: number | string | null) => {
    if (raw === null || raw === undefined) return { value: null as number | null, unit: "" };
    if (typeof raw === "number") return { value: raw, unit: "" };
    // Prisma Decimal objects are not plain strings — convert first
    const str = typeof raw === "string" ? raw : String(raw);
    const valueMatch = str.replace(/,/g, "").match(/[\d.]+/);
    const value = valueMatch ? parseFloat(valueMatch[0]) : null;
    const unit = str.replace(/[\d.,\s]/g, "").trim();
    return { value, unit };
  };

  const convertToLiters = (value: number, unit: string): number => {
    const u = unit.toUpperCase().trim();
    if (u === "L") return value;
    if (u === "ML" || u === "CC") return value / 1000;
    if (u === "KG") return value;
    if (u === "G") return value / 1000;
    return 0;
  };

  // Get group performance
  const groupPerformance = await Promise.all(
    productGroupOptions.map(async (groupOption) => {
      const group = groupOption.value;

      // Get products in this group (with packageSize fields)
      const products = await repo.findManyProductsData({
        where: { productGroup: group },
        select: {
          id: true,
          packageSize: true,
          packageSizeUnit: true,
          packageSizePerBox: true,
          totalPackageSizePerBox: true,
        },
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
          totalVolumeLiters: 0,
        };
      }

      // Get sales data per product (for volume calculation)
      const salesPerProduct = await repo.groupSaleItemsData({
        by: ["productId"],
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
        _count: true,
      });

      // Build product lookup
      const productLookup = new Map(products.map((p) => [p.id, p]));

      let totalSales = 0;
      let totalQuantity = 0;
      let totalVolumeLiters = 0;

      for (const sp of salesPerProduct) {
        const qty = Number(sp._sum.quantity || 0);
        totalSales += Number(sp._sum.totalPrice || 0);
        totalQuantity += qty;

        const prod = productLookup.get(sp.productId);
        if (prod) {
          const totalPerBox = parsePackageSize(prod.totalPackageSizePerBox as any);
          const packageSize = parsePackageSize(prod.packageSize as any);
          const perBox =
            totalPerBox.value ??
            (packageSize.value !== null
              ? packageSize.value * (parseFloat(prod.packageSizePerBox?.toString() || "1") || 1)
              : null);
          const packageSold = perBox !== null && !Number.isNaN(perBox) ? perBox * qty : 0;
          const pUnit = totalPerBox.unit || packageSize.unit || (prod as any).packageSizeUnit || "";
          totalVolumeLiters += convertToLiters(packageSold, pUnit);
        }
      }

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

      return {
        group: groupOption.label,
        totalSales,
        totalQuantity,
        orderCount: orderCount.length,
        productCount: productIds.length,
        avgSalesPerProduct:
          productIds.length > 0 ? totalSales / productIds.length : 0,
        totalVolumeLiters,
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
