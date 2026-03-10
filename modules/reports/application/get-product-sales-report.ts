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


// 2. PRODUCT SALES REPORT
// ============================================

export async function getProductSalesReport(
  filter: DateRangeFilter,
): Promise<ProductSalesReportData> {
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

  // Get all products with their sales in the period
  const productSales = await repo.groupSaleItemsData({
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

  // Get product details
  const productIds = productSales.map((p) => p.productId);
  const products = await repo.findManyProductsData({
    where: { id: { in: productIds } },
    select: {
      id: true,
      productCode: true,
      name: true,
      brand: true,
      productGroup: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Top products (top 20)
  const topProducts = productSales.slice(0, 20).map((ps) => {
    const product = productMap.get(ps.productId);
    return {
      id: ps.productId,
      code: product?.productCode || "",
      name: product?.name || "Unknown",
      brand: product?.brand || "-",
      productGroup: product?.productGroup || "-",
      totalSales: Number(ps._sum.totalPrice || 0),
      totalQuantity: Number(ps._sum.quantity || 0),
      orderCount: ps._count,
    };
  });

  // Slow products (bottom 20 with at least 1 sale)
  const slowProducts = productSales
    .slice(-20)
    .reverse()
    .map((ps) => {
      const product = productMap.get(ps.productId);
      return {
        id: ps.productId,
        code: product?.productCode || "",
        name: product?.name || "Unknown",
        brand: product?.brand || "-",
        productGroup: product?.productGroup || "-",
        totalSales: Number(ps._sum.totalPrice || 0),
        totalQuantity: Number(ps._sum.quantity || 0),
        orderCount: ps._count,
      };
    });

  // Product peak periods (for top 5 products)
  const productPeakPeriods = await Promise.all(
    topProducts.slice(0, 5).map(async (product) => {
      const monthlyData = await prisma.dailySalesSummary.groupBy({
        by: ["month", "year"],
        where: {
          productId: product.id,
          date: { gte: start, lte: end },
          // TODO: DailySalesSummary might need scope filtering too if it has employeeId relation
          // DailySalesSummary has employeeId.
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
        productId: product.id,
        productName: product.name,
        peakMonth: peakMonth.month,
        peakSales: peakMonth.sales,
      };
    }),
  );

  // Low stock products (available < 50)
  const lowStockProducts = await prisma.productStock.findMany({
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

  const lowStock = lowStockProducts.map((ps) => ({
    id: ps.product.id,
    code: ps.product.productCode,
    name: ps.product.name,
    physicalBalance: ps.physicalBalance,
    reservedQuantity: ps.reservedQuantity,
    availableQuantity: ps.availableQuantity,
    upcomingExpiry: ps.product.stockLots[0]?.expiryDate
      ? format(ps.product.stockLots[0].expiryDate, "dd/MM/yyyy")
      : undefined,
  }));

  // Stagnant products (no sales in last 90 days but has stock)
  const ninetyDaysAgo = subMonths(new Date(), 3);
  const recentSoldProducts = await prisma.saleItem.findMany({
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
  const recentSoldIds = new Set(recentSoldProducts.map((p) => p.productId));

  const stagnantProducts = await repo.findManyProductsData({
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

  const stagnant = stagnantProducts.map((p) => ({
    id: p.id,
    code: p.productCode,
    name: p.name,
    stock: p.stock?.physicalBalance || 0,
    daysSinceLastSale: p.saleItems[0]?.createdAt
      ? differenceInDays(new Date(), p.saleItems[0].createdAt)
      : 999,
    lastSoldDate: p.saleItems[0]?.createdAt
      ? format(p.saleItems[0].createdAt, "dd/MM/yyyy")
      : undefined,
  }));

  return {
    topProducts,
    slowProducts,
    productPeakPeriods,
    lowStockProducts: lowStock,
    stagnantProducts: stagnant.sort(
      (a, b) => b.daysSinceLastSale - a.daysSinceLastSale,
    ),
  };
}

// ============================================
