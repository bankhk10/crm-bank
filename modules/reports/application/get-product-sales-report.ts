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

  const teamEmployeeIds =
    viewScope === ("VIEW_TEAM" as DataAccessLevel)
      ? await getTeamEmployeeIds(session)
      : null;

  type ProductMeta = {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    parentId?: string | null;
    packageSize?: number | string | null;
    packageSizePerBox?: number | string | null;
    totalPackageSizePerBox?: number | string | null;
    abcTypeId?: string | null;
    abcTypeCode?: string | null;
    abcTypeName?: string | null;
  };

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

  const calculatePackageSold = (quantity: number, product: ProductMeta) => {
    const totalPerBox = parsePackageSize(product.totalPackageSizePerBox);
    const packageSize = parsePackageSize(product.packageSize);
    const perBox =
      totalPerBox.value ??
      (packageSize.value !== null
        ? packageSize.value * (parseFloat(product.packageSizePerBox?.toString() || "1") || 1)
        : null);

    const totalPackageSold =
      perBox !== null && !Number.isNaN(perBox) ? perBox * quantity : 0;

    return {
      totalPackageSold,
      unit: totalPerBox.unit || packageSize.unit,
    };
  };

  // Unit conversion to liters
  const convertToLiters = (value: number, unit: string): number => {
    const u = unit.toUpperCase().trim();
    if (u === "L") return value;
    if (u === "ML" || u === "CC") return value / 1000;
    if (u === "KG") return value; // KG kept as-is (weight), user converts on UI
    if (u === "G") return value / 1000; // G→KG equivalent, user converts on UI
    return 0;
  };
  // 1. Get all active products first
  const activeProducts = await repo.findManyProductsData({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      productCode: true,
      name: true,
      brand: true,
      tradeNameGroup: { select: { description: true } },
      productABCType: { select: { id: true, code: true, name: true } },
      parentId: true,
      packageSize: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
    },
  });

  // 2. Get all products with their sales in the period
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

  // 3. Combine active and sold product IDs
  const productIdsFromSales = productSales.map((p) => p.productId);
  const activeProductIds = activeProducts.map((p) => p.id);
  const allInitialIds = Array.from(
    new Set([...productIdsFromSales, ...activeProductIds]),
  );

  // 4. Get product details including parent chain
  const productMap = new Map<string, ProductMeta>();
  let pendingIds = allInitialIds;
  while (pendingIds.length > 0) {
    const products = await repo.findManyProductsData({
      where: { id: { in: pendingIds } },
      select: {
        id: true,
        productCode: true,
        name: true,
        brand: true,
        tradeNameGroup: { select: { description: true } },
        productABCType: { select: { id: true, code: true, name: true } },
        parentId: true,
        packageSize: true,
        packageSizePerBox: true,
        totalPackageSizePerBox: true,
      },
    });

    const nextParentIds: string[] = [];
    for (const p of products) {
      if (!productMap.has(p.id)) {
        productMap.set(p.id, {
          id: p.id,
          code: p.productCode,
          name: p.name,
          brand: p.brand || "-",
          productGroup: (p as any).tradeNameGroup?.description || "-",
          abcTypeId: (p as any).productABCType?.id || null,
          abcTypeCode: (p as any).productABCType?.code || null,
          abcTypeName: (p as any).productABCType?.name || null,
          parentId: p.parentId,
          packageSize: p.packageSize as any,
          packageSizePerBox: p.packageSizePerBox as any,
          totalPackageSizePerBox: p.totalPackageSizePerBox as any,
        });
      }

      if (p.parentId && !productMap.has(p.parentId)) {
        nextParentIds.push(p.parentId);
      }
    }

    pendingIds = Array.from(new Set(nextParentIds));
  }

  type AggregatedProduct = {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    totalPackageSold: number;
    totalVolumeLiters: number;
    packageUnit: string;
    childCount: number;
    relatedProductIds: Set<string>;
  };

  const productsMap = new Map<string, AggregatedProduct>();
  for (const p of activeProducts) {
    const prod = productMap.get(p.id);
    if (prod && !productsMap.has(p.id)) {
      productsMap.set(p.id, {
        id: p.id,
        code: prod.code,
        name: prod.name,
        brand: prod.brand,
        productGroup: prod.productGroup,
        totalSales: 0,
        totalQuantity: 0,
        orderCount: 0,
        totalPackageSold: 0,
        totalVolumeLiters: 0,
        packageUnit: parsePackageSize(prod.packageSize).unit || "",
        childCount: 0,
        relatedProductIds: new Set([p.id]),
      });
    }
  }

  // 6. Add sales data
  for (const ps of productSales) {
    const product = productMap.get(ps.productId);
    if (!product) continue;

    // Ensure entry exists for product
    if (!productsMap.has(ps.productId)) {
      productsMap.set(ps.productId, {
        id: ps.productId,
        code: product.code,
        name: product.name,
        brand: product.brand,
        productGroup: product.productGroup,
        totalSales: 0,
        totalQuantity: 0,
        orderCount: 0,
        totalPackageSold: 0,
        totalVolumeLiters: 0,
        packageUnit: parsePackageSize(product.packageSize).unit || "",
        childCount: 0,
        relatedProductIds: new Set([ps.productId]),
      });
    }

    const { totalPackageSold, unit } = calculatePackageSold(
      Number(ps._sum.quantity || 0),
      product,
    );

    const target = productsMap.get(ps.productId)!;

    target.totalSales += Number(ps._sum.totalPrice || 0);
    target.totalQuantity += Number(ps._sum.quantity || 0);
    target.orderCount += ps._count;
    target.totalPackageSold += totalPackageSold;
    target.totalVolumeLiters += convertToLiters(
      totalPackageSold,
      unit || target.packageUnit,
    );
    if (!target.packageUnit && unit) {
      target.packageUnit = unit;
    }
  }

  const aggregatedProducts = Array.from(productsMap.values());
  const sortedBySales = aggregatedProducts.sort(
    (a, b) => b.totalSales - a.totalSales,
  );

  const normalizeProduct = (p: AggregatedProduct) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    productGroup: p.productGroup,
    totalSales: p.totalSales,
    totalQuantity: p.totalQuantity,
    orderCount: p.orderCount,
    totalPackageSold: p.totalPackageSold,
    totalVolumeLiters: p.totalVolumeLiters,
    packageUnit: p.packageUnit,
    childCount: p.childCount,
  });

  const peakCandidates = sortedBySales.slice(0, 5);

  const topProducts = sortedBySales.map(normalizeProduct);

  const slowProducts = [...sortedBySales]
    .sort((a, b) => a.totalSales - b.totalSales)
    .slice(0, 20)
    .map(normalizeProduct);

  // Product peak periods (for top 5 products)
  const productPeakPeriods = await Promise.all(
    peakCandidates.map(async (product) => {
      const monthlyData = await prisma.dailySalesSummary.groupBy({
        by: ["month", "year"],
        where: {
          productId: { in: Array.from(product.relatedProductIds) },
          date: { gte: start, lte: end },
          // TODO: DailySalesSummary might need scope filtering too if it has employeeId relation
          // DailySalesSummary has employeeId.
          ...(viewScope === DataAccessLevel.VIEW_OWN
            ? { employeeId: session.user.employeeId! }
            : {}),
          ...(viewScope === ("VIEW_TEAM" as DataAccessLevel)
            ? { employeeId: { in: teamEmployeeIds || [] } }
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

  // ABC Code sales (aggregate by productABCType)
  type AbcAgg = {
    id: string;
    code: string;
    name: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productIds: Set<string>;
  };

  const abcAggregates = new Map<string, AbcAgg>();

  for (const ps of productSales) {
    const product = productMap.get(ps.productId);
    const abcId = product?.abcTypeId || "UNKNOWN";
    const abcCode = product?.abcTypeCode || "-";
    const abcName = product?.abcTypeName || "ไม่ระบุ";

    const existing = abcAggregates.get(abcId) || {
      id: abcId,
      code: abcCode,
      name: abcName,
      totalSales: 0,
      totalQuantity: 0,
      orderCount: 0,
      productIds: new Set<string>(),
    };

    existing.totalSales += Number(ps._sum.totalPrice || 0);
    existing.totalQuantity += Number(ps._sum.quantity || 0);
    existing.orderCount += ps._count;
    existing.productIds.add(ps.productId);

    abcAggregates.set(abcId, existing);
  }

  const abcSales = Array.from(abcAggregates.values())
    .map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      totalSales: a.totalSales,
      totalQuantity: a.totalQuantity,
      orderCount: a.orderCount,
      productCount: a.productIds.size,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  return {
    topProducts,
    slowProducts,
    productPeakPeriods,
    lowStockProducts: lowStock,
    stagnantProducts: stagnant.sort(
      (a, b) => b.daysSinceLastSale - a.daysSinceLastSale,
    ),
    abcSales,
  };
}

// ============================================
