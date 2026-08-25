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
import { getDateRange, getDayOfWeekThai, getQuarterLabel, getRegionFromProvince } from "./utils";
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

export async function getProductSalesReport(filter: DateRangeFilter, session: any): Promise<ProductSalesReportData> {

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
    packageSizeUnit?: string | null;
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
    if (
      [
        "ML",
        "CC",
        "G",
        "GM",
        "GR",
        "มล.",
        "มล",
        "ซีซี",
        "กรัม",
        "ML.",
        "G.",
      ].includes(u)
    ) {
      return value / 1000;
    }
    if (
      [
        "L",
        "KG",
        "กก.",
        "กก",
        "ลิตร",
        "กิโลกรัม",
        "L.",
        "KG.",
        "LTR",
        "LITER",
        "LITRE",
        "KILO",
        "KILOGRAM",
      ].includes(u)
    ) {
      return value;
    }
    return value;
  };
  // 1. Get all active products first
  const activeProducts = await repo.findManyProductsData({
    where: { deletedAt: null },
    select: {
      id: true,
      productCode: true,
      name: true,
      brand: true,
      tradeNameGroup: { select: { description: true } },
      productABCType: { select: { id: true, code: true, name: true } },
      parentId: true,
      packageSize: true,
      packageSizeUnit: true,
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
        status: { notIn: ["CANCELLED", "REJECTED"] },
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
        packageSizeUnit: true,
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
          packageSizeUnit: p.packageSizeUnit as any,
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
    packageSizeUnit: string;
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
        packageUnit: parsePackageSize(prod.packageSize).unit || prod.packageSizeUnit || "",
        packageSizeUnit: prod.packageSizeUnit || "",
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
        packageUnit: parsePackageSize(product.packageSize).unit || product.packageSizeUnit || "",
        packageSizeUnit: product.packageSizeUnit || "",
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
    packageSizeUnit: p.packageSizeUnit,
    childCount: p.childCount,
  });

  const peakCandidates = sortedBySales;

  const topProducts = sortedBySales.map(normalizeProduct);

  const slowProducts = [...sortedBySales]
    .sort((a, b) => a.totalSales - b.totalSales)
    .map(normalizeProduct);

  // Product peak periods (for all products)
  const allPeakPeriods = await repo.groupAllProductsPeakPeriods(
    start,
    end,
    scopeFilter
  );

  const productPeakPeriods = allPeakPeriods.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      productName: product?.name || "ไม่ระบุชื่อสินค้า",
      peakMonth: format(new Date(item.year, item.month - 1), "MMM yyyy", {
        locale: th,
      }),
      peakSales: item.totalSales,
    };
  });

  // Low stock products (available < 50)
  const lowStockProducts = await prisma.productStock.findMany({
    where: {
      availableQuantity: { lt: 50 },
      product: { deletedAt: null },
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
        status: { notIn: ["CANCELLED", "REJECTED"] },
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
      stock: { physicalBalance: { gt: 0 } },
    },
    include: {
      stock: true,
      saleItems: {
        where: {
          sale: {
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED"] },
            ...scopeFilter,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
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
  const abcTypes = await prisma.productABCTypes.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true },
  });
  const abcTypeMap = new Map(abcTypes.map((a) => [a.id, a]));

  type AbcAgg = {
    id: string;
    code: string;
    name: string;
    salesNoteSales: number;
    salesNoteQuantity: number;
    salesNoteSaleIds: Set<string>;
    invoiceSales: number;
    invoiceQuantity: number;
    invoiceSaleIds: Set<string>;
    productIds: Set<string>;
  };

  const abcAggregates = new Map<string, AbcAgg>();

  const getOrCreateAbcRecord = (abcId: string) => {
    let abcRecord = abcAggregates.get(abcId);
    if (!abcRecord) {
      const typeInfo = abcTypeMap.get(abcId);
      abcRecord = {
        id: abcId,
        code: typeInfo?.code || "-",
        name: typeInfo?.name || "ไม่ระบุ",
        salesNoteSales: 0,
        salesNoteQuantity: 0,
        salesNoteSaleIds: new Set<string>(),
        invoiceSales: 0,
        invoiceQuantity: 0,
        invoiceSaleIds: new Set<string>(),
        productIds: new Set<string>(),
      };
      abcAggregates.set(abcId, abcRecord);
    }
    return abcRecord;
  };

  // 1. Sales Note Items (By Sale Date)
  const abcSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        ...scopeFilter,
      },
    },
    select: {
      productId: true,
      productABCTypeId: true,
      totalPrice: true,
      quantity: true,
      saleId: true,
      product: { select: { productABCTypeId: true } },
    },
  });

  for (const item of abcSaleItems) {
    const abcId =
      item.productABCTypeId || item.product?.productABCTypeId || "UNKNOWN";
    const abcRecord = getOrCreateAbcRecord(abcId);

    abcRecord.salesNoteSales += Number(item.totalPrice || 0);
    abcRecord.salesNoteQuantity += Number(item.quantity || 0);
    abcRecord.salesNoteSaleIds.add(item.saleId);
    abcRecord.productIds.add(item.productId);
  }

  // 2. Invoice Shipment Items (By Shipment Delivered/Scheduled Date)
  const invoiceShipmentItems = await prisma.shipmentItem.findMany({
    where: {
      shipment: {
        status: { in: ["DELIVERED", "IN_TRANSIT", "COMPLETED"] },
        sale: { deletedAt: null, ...scopeFilter },
        OR: [
          { scheduledDate: { gte: start, lte: end } },
          { scheduledDate: null, actualDate: { gte: start, lte: end } },
          {
            scheduledDate: null,
            actualDate: null,
            sale: { requestedDeliveryDate: { gte: start, lte: end } },
          },
        ],
      },
    },
    select: {
      totalPrice: true,
      quantity: true,
      shipment: { select: { id: true, saleId: true } },
      saleItem: {
        select: {
          productId: true,
          productABCTypeId: true,
          product: { select: { productABCTypeId: true } },
        },
      },
    },
  });

  for (const item of invoiceShipmentItems) {
    const abcId =
      item.saleItem.productABCTypeId ||
      item.saleItem.product?.productABCTypeId ||
      "UNKNOWN";
    const abcRecord = getOrCreateAbcRecord(abcId);

    abcRecord.invoiceSales += Number(item.totalPrice || 0);
    abcRecord.invoiceQuantity += Number(item.quantity || 0);
    abcRecord.invoiceSaleIds.add(item.shipment.saleId || item.shipment.id);
    abcRecord.productIds.add(item.saleItem.productId);
  }

  // 3. Legacy Sales without Shipments (By Delivery/Requested/Sale Date)
  const legacyInvoiceSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        deletedAt: null,
        status: { in: ["PAID", "DELIVERY_COMPLETED", "COMPLETED"] },
        shipments: { none: {} },
        ...scopeFilter,
        OR: [
          { deliveryDate: { gte: start, lte: end } },
          {
            deliveryDate: null,
            requestedDeliveryDate: { gte: start, lte: end },
          },
          {
            deliveryDate: null,
            requestedDeliveryDate: null,
            saleDate: { gte: start, lte: end },
          },
        ],
      },
    },
    select: {
      productId: true,
      productABCTypeId: true,
      totalPrice: true,
      quantity: true,
      saleId: true,
      product: { select: { productABCTypeId: true } },
    },
  });

  for (const item of legacyInvoiceSaleItems) {
    const abcId =
      item.productABCTypeId || item.product?.productABCTypeId || "UNKNOWN";
    const abcRecord = getOrCreateAbcRecord(abcId);

    abcRecord.invoiceSales += Number(item.totalPrice || 0);
    abcRecord.invoiceQuantity += Number(item.quantity || 0);
    abcRecord.invoiceSaleIds.add(item.saleId);
    abcRecord.productIds.add(item.productId);
  }

  const abcSales = Array.from(abcAggregates.values())
    .map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      totalSales: a.salesNoteSales,
      totalQuantity: a.salesNoteQuantity,
      orderCount: a.salesNoteSaleIds.size,
      productCount: a.productIds.size,
      salesNoteSales: a.salesNoteSales,
      salesNoteQuantity: a.salesNoteQuantity,
      salesNoteOrderCount: a.salesNoteSaleIds.size,
      invoiceSales: a.invoiceSales,
      invoiceQuantity: a.invoiceQuantity,
      invoiceOrderCount: a.invoiceSaleIds.size,
    }))
    .sort((a, b) =>
      (a.code || a.name || "").localeCompare(b.code || b.name || "", "th", {
        numeric: true,
      }),
    );

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
