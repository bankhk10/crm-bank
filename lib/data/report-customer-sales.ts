import { db as prisma } from "@/src/infrastructure/database";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  differenceInDays,
} from "date-fns";

const SALE_STATUS_FILTER = {
  notIn: ["CANCELLED", "REJECTED", "EXPIRED"],
} as const;

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface NormalizedDateRange {
  start: Date;
  end: Date;
  from: string;
  to: string;
}

export interface CustomerSalesShopSummary {
  id: string;
  name: string;
  code: string;
  totalSales: number;
  orderCount: number;
  lastPurchaseDate?: string;
}

export interface CustomerSalesOrderItem {
  id: string;
  saleNumber: string;
  saleDate: string;
  totalItems: number;
  totalAmount: number;
  status: string;
}

export interface CustomerSalesShopDetail {
  shop: {
    id: string;
    name: string;
    code: string;
  };
  range: {
    from: string;
    to: string;
  };
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    lastPurchaseDate?: string;
  };
  topProducts: {
    id: string;
    code: string;
    name: string;
    brand?: string | null;
    totalQuantity: number;
    totalSales: number;
    lastBoughtDate?: string;
  }[];
  finance: {
    granularity: "daily" | "monthly";
    series: {
      label: string;
      date: string;
      totalSales: number;
      orderCount: number;
    }[];
  };
  orders: {
    data: CustomerSalesOrderItem[];
    page: number;
    pageSize: number;
    total: number;
  };
}

const defaultRange = () => ({
  start: startOfDay(startOfMonth(new Date())),
  end: endOfDay(endOfMonth(new Date())),
});

export const normalizeDateRange = (
  params: DateRangeParams,
): NormalizedDateRange => {
  const fallback = defaultRange();
  const parsedFrom = params.from ? parseISO(params.from) : fallback.start;
  const parsedTo = params.to ? parseISO(params.to) : fallback.end;
  const start = startOfDay(isValid(parsedFrom) ? parsedFrom : fallback.start);
  const end = endOfDay(isValid(parsedTo) ? parsedTo : fallback.end);

  return {
    start,
    end,
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
  };
};

export const fetchCustomerSalesShops = async (
  params: DateRangeParams,
): Promise<{ range: NormalizedDateRange; shops: CustomerSalesShopSummary[] }> => {
  const range = normalizeDateRange(params);

  const salesByCustomer = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      saleDate: { gte: range.start, lte: range.end },
      deletedAt: null,
      status: SALE_STATUS_FILTER,
    },
    _sum: { totalAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  if (salesByCustomer.length === 0) {
    return { range, shops: [] };
  }

  const customerIds = salesByCustomer.map((entry) => entry.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      customerCode: true,
      name: true,
      sales: {
        where: {
          deletedAt: null,
          status: SALE_STATUS_FILTER,
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
    },
  });

  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

  const shops = salesByCustomer.map((entry) => {
    const customer = customerMap.get(entry.customerId);
    const lastPurchaseDate = customer?.sales[0]?.saleDate
      ? format(customer.sales[0].saleDate, "yyyy-MM-dd")
      : undefined;

    return {
      id: entry.customerId,
      name: customer?.name || "-",
      code: customer?.customerCode || "-",
      totalSales: Number(entry._sum.totalAmount || 0),
      orderCount: entry._count._all,
      lastPurchaseDate,
    } satisfies CustomerSalesShopSummary;
  });

  return { range, shops };
};

export const fetchCustomerSalesShopDetail = async (
  shopId: string,
  params: DateRangeParams & { page?: number; pageSize?: number },
): Promise<CustomerSalesShopDetail | null> => {
  const range = normalizeDateRange(params);
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

  const shop = await prisma.customer.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, customerCode: true },
  });

  if (!shop) {
    return null;
  }

  const summaryAggregate = await prisma.sale.aggregate({
    where: {
      customerId: shopId,
      saleDate: { gte: range.start, lte: range.end },
      deletedAt: null,
      status: SALE_STATUS_FILTER,
    },
    _sum: { totalAmount: true },
    _count: { _all: true },
    _max: { saleDate: true },
  });

  const totalSales = Number(summaryAggregate._sum.totalAmount || 0);
  const totalOrders = summaryAggregate._count._all || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const lastPurchaseDate = summaryAggregate._max.saleDate
    ? format(summaryAggregate._max.saleDate, "yyyy-MM-dd")
    : undefined;

  const topProductsSummary = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        customerId: shopId,
        saleDate: { gte: range.start, lte: range.end },
        deletedAt: null,
        status: SALE_STATUS_FILTER,
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 10,
  });

  const productIds = topProductsSummary.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, productCode: true, name: true, brand: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const lastBoughtProducts = productIds.length
    ? await prisma.saleItem.findMany({
        where: {
          productId: { in: productIds },
          sale: {
            customerId: shopId,
            saleDate: { gte: range.start, lte: range.end },
            deletedAt: null,
            status: SALE_STATUS_FILTER,
          },
        },
        orderBy: { sale: { saleDate: "desc" } },
        distinct: ["productId"],
        select: { productId: true, sale: { select: { saleDate: true } } },
      })
    : [];

  const lastBoughtMap = new Map(
    lastBoughtProducts.map((item) => [
      item.productId,
      item.sale.saleDate ? format(item.sale.saleDate, "yyyy-MM-dd") : undefined,
    ]),
  );

  const topProducts = topProductsSummary.map((item) => {
    const product = productMap.get(item.productId);
    return {
      id: item.productId,
      code: product?.productCode || "-",
      name: product?.name || "-",
      brand: product?.brand ?? null,
      totalQuantity: item._sum.quantity || 0,
      totalSales: Number(item._sum.totalPrice || 0),
      lastBoughtDate: lastBoughtMap.get(item.productId),
    };
  });

  const salesForSeries = await prisma.sale.findMany({
    where: {
      customerId: shopId,
      saleDate: { gte: range.start, lte: range.end },
      deletedAt: null,
      status: SALE_STATUS_FILTER,
    },
    select: { saleDate: true, totalAmount: true },
  });

  const dayCount = differenceInDays(range.end, range.start) + 1;
  const granularity = dayCount > 60 ? "monthly" : "daily";
  const dateFormat = granularity === "daily" ? "yyyy-MM-dd" : "yyyy-MM";

  const seriesMap = new Map<string, { totalSales: number; orderCount: number }>();
  for (const sale of salesForSeries) {
    const key = format(sale.saleDate, dateFormat);
    const existing = seriesMap.get(key) || { totalSales: 0, orderCount: 0 };
    existing.totalSales += Number(sale.totalAmount || 0);
    existing.orderCount += 1;
    seriesMap.set(key, existing);
  }

  const seriesDates =
    granularity === "daily"
      ? eachDayOfInterval({ start: range.start, end: range.end }).map((date) =>
          format(date, dateFormat),
        )
      : eachMonthOfInterval({ start: range.start, end: range.end }).map((date) =>
          format(date, dateFormat),
        );

  const financeSeries = seriesDates.map((key) => ({
    label: key,
    date: key,
    totalSales: seriesMap.get(key)?.totalSales || 0,
    orderCount: seriesMap.get(key)?.orderCount || 0,
  }));

  const totalOrdersCount = await prisma.sale.count({
    where: {
      customerId: shopId,
      saleDate: { gte: range.start, lte: range.end },
      deletedAt: null,
      status: SALE_STATUS_FILTER,
    },
  });

  const orders = await prisma.sale.findMany({
    where: {
      customerId: shopId,
      saleDate: { gte: range.start, lte: range.end },
      deletedAt: null,
      status: SALE_STATUS_FILTER,
    },
    orderBy: { saleDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      saleNumber: true,
      saleDate: true,
      totalAmount: true,
      status: true,
      items: { select: { quantity: true } },
    },
  });

  const ordersData = orders.map((order) => ({
    id: order.id,
    saleNumber: order.saleNumber,
    saleDate: format(order.saleDate, "yyyy-MM-dd"),
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Number(order.totalAmount || 0),
    status: order.status,
  }));

  return {
    shop: {
      id: shop.id,
      name: shop.name,
      code: shop.customerCode,
    },
    range: { from: range.from, to: range.to },
    summary: {
      totalSales,
      totalOrders,
      avgOrderValue,
      lastPurchaseDate,
    },
    topProducts,
    finance: {
      granularity,
      series: financeSeries,
    },
    orders: {
      data: ordersData,
      page,
      pageSize,
      total: totalOrdersCount,
    },
  };
};
