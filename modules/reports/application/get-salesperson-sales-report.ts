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


// 5. SALESPERSON SALES REPORT
// ============================================

export async function getSalespersonSalesReport(
  filter: DateRangeFilter,
): Promise<SalespersonReportData> {
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

  // Get salesperson performance
  const employeeSales = await repo.groupSalesData({
    by: ["employeeId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const employeeIds = employeeSales.map((e) => e.employeeId);

  // Get employee details
  const employees = await repo.findManyEmployeesData({
    where: { id: { in: employeeIds } },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      department: { select: { name: true } },
    },
  });
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Get customer count per employee
  const customerCounts = await repo.groupSalesData({
    by: ["employeeId", "customerId"],
    where: {
      employeeId: { in: employeeIds },
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
      ...scopeFilter,
    },
  });

  const customerCountMap = new Map<string, Set<string>>();
  for (const cc of customerCounts) {
    if (!customerCountMap.has(cc.employeeId)) {
      customerCountMap.set(cc.employeeId, new Set());
    }
    customerCountMap.get(cc.employeeId)!.add(cc.customerId);
  }

  const salespersonPerformance = employeeSales.map((es) => {
    const employee = employeeMap.get(es.employeeId);
    const totalSales = Number(es._sum.totalAmount || 0);
    const orderCount = es._count;

    return {
      id: es.employeeId,
      name: employee?.name || "Unknown",
      employeeCode: employee?.employeeCode || "-",
      department: employee?.department?.name || "-",
      totalSales,
      orderCount,
      avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      customerCount: customerCountMap.get(es.employeeId)?.size || 0,
      conversionRate: 100, // Placeholder, would need leads data
    };
  });

  const topSalesperson = salespersonPerformance[0] || {
    id: "",
    name: "-",
    sales: 0,
  };

  // Product groups sold per salesperson
  const salespersonProductGroups = await Promise.all(
    employeeIds.slice(0, 10).map(async (employeeId) => {
      const employee = employeeMap.get(employeeId);

      const groupData = await repo.groupSaleItemsData({
        by: ["productId"],
        where: {
          sale: {
            employeeId,
            saleDate: { gte: start, lte: end },
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            ...scopeFilter, // Keep this for consistency, though Salesperson report by nature shows by employee
            // But if manager views department, they see all employees in department.
          },
        },
        _sum: {
          totalPrice: true,
          quantity: true,
        },
      });

      const productIds = groupData.map((g) => g.productId);
      const products = await repo.findManyProductsData({
        where: { id: { in: productIds } },
        select: { id: true, productGroup: true },
      });
      const productGroupMap = new Map(
        products.map((p) => [p.id, p.productGroup]),
      );

      const groupAgg = new Map<string, { sales: number; quantity: number }>();
      for (const gd of groupData) {
        const group = productGroupMap.get(gd.productId) || "OTHER";
        if (!groupAgg.has(group)) {
          groupAgg.set(group, { sales: 0, quantity: 0 });
        }
        const agg = groupAgg.get(group)!;
        agg.sales += Number(gd._sum.totalPrice || 0);
        agg.quantity += Number(gd._sum.quantity || 0);
      }

      return {
        salespersonId: employeeId,
        salespersonName: employee?.name || "Unknown",
        groups: Array.from(groupAgg.entries())
          .map(([group, data]) => ({
            group,
            sales: data.sales,
            quantity: data.quantity,
          }))
          .sort((a, b) => b.sales - a.sales),
      };
    }),
  );

  // Products sold per salesperson (top 5 each)
  const salespersonProducts = await Promise.all(
    employeeIds.slice(0, 10).map(async (employeeId) => {
      const employee = employeeMap.get(employeeId);

      const productData = await repo.groupSaleItemsData({
        by: ["productId"],
        where: {
          sale: {
            employeeId,
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
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5,
      });

      const productIds = productData.map((p) => p.productId);
      const products = await repo.findManyProductsData({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      const productNameMap = new Map(products.map((p) => [p.id, p.name]));

      return {
        salespersonId: employeeId,
        salespersonName: employee?.name || "Unknown",
        products: productData.map((pd) => ({
          productId: pd.productId,
          productName: productNameMap.get(pd.productId) || "Unknown",
          sales: Number(pd._sum.totalPrice || 0),
          quantity: Number(pd._sum.quantity || 0),
        })),
      };
    }),
  );

  // Monthly trend per salesperson
  const months = eachMonthOfInterval({ start, end });
  const salespersonMonthlyTrend = await Promise.all(
    months.map(async (monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthData = await repo.groupSalesData({
        by: ["employeeId"],
        where: {
          saleDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          ...scopeFilter,
        },
        _sum: { totalAmount: true },
        _count: true,
      });

      return {
        month: format(monthDate, "MMM yyyy", { locale: th }),
        salespeople: monthData
          .map((md) => {
            const employee = employeeMap.get(md.employeeId);
            return {
              id: md.employeeId,
              name: employee?.name || "Unknown",
              sales: Number(md._sum.totalAmount || 0),
              orders: md._count,
            };
          })
          .sort((a, b) => b.sales - a.sales),
      };
    }),
  );

  return {
    salespersonPerformance,
    topSalesperson: {
      id: topSalesperson.id,
      name: topSalesperson.name,
      sales: topSalesperson.totalSales || 0,
    },
    salespersonProductGroups,
    salespersonProducts,
    salespersonMonthlyTrend,
  };
}

// ============================================
