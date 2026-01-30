"use server";

import { db as prisma } from "@/src/infrastructure/database";
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

// ============================================
// TYPES
// ============================================

export interface DateRangeFilter {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface TimeSalesReportData {
  // Summary
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  growthPercentage: number;

  // Daily data
  dailyData: {
    date: string;
    sales: number;
    orders: number;
  }[];

  // Monthly data
  monthlyData: {
    month: string;
    sales: number;
    orders: number;
  }[];

  // Yearly data
  yearlyData: {
    year: number;
    sales: number;
    orders: number;
  }[];

  // Best selling periods
  bestSellingHour?: {
    hour: number;
    sales: number;
    orders: number;
  };
  bestSellingDay: {
    dayOfWeek: string;
    sales: number;
    orders: number;
  };
  bestSellingMonth: {
    month: string;
    sales: number;
    orders: number;
  };

  // Seasonality (Quarterly)
  seasonalityData: {
    quarter: string;
    sales: number;
    orders: number;
    percentage: number;
  }[];

  // Sales by region
  salesByRegion: {
    region: string;
    totalSales: number;
    orderCount: number;
  }[];
}

export interface ProductSalesReportData {
  // Top selling products
  topProducts: {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
  }[];

  // Slow selling products
  slowProducts: {
    id: string;
    code: string;
    name: string;
    brand: string;
    productGroup: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    lastSoldDate?: string;
  }[];

  // Best selling period per product (top 5)
  productPeakPeriods: {
    productId: string;
    productName: string;
    peakMonth: string;
    peakSales: number;
  }[];

  // Low stock products
  lowStockProducts: {
    id: string;
    code: string;
    name: string;
    physicalBalance: number;
    reservedQuantity: number;
    availableQuantity: number;
    upcomingExpiry?: string;
  }[];

  // Products not sold (stagnant stock)
  stagnantProducts: {
    id: string;
    code: string;
    name: string;
    stock: number;
    daysSinceLastSale: number;
    lastSoldDate?: string;
  }[];
}

export interface ProductGroupSalesReportData {
  // Group performance
  groupPerformance: {
    group: string;
    totalSales: number;
    totalQuantity: number;
    orderCount: number;
    productCount: number;
    avgSalesPerProduct: number;
  }[];

  // Best/Worst groups
  topGroup: {
    group: string;
    sales: number;
  };
  worstGroup: {
    group: string;
    sales: number;
  };

  // Peak periods per group
  groupPeakPeriods: {
    group: string;
    peakMonth: string;
    sales: number;
  }[];

  // Monthly trend per group
  groupMonthlyTrend: {
    month: string;
    groups: {
      group: string;
      sales: number;
      orders: number;
    }[];
  }[];
}

export interface CustomerSalesReportData {
  // Top customers
  topCustomers: {
    id: string;
    code: string;
    name: string;
    type: string;
    province: string;
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    purchaseFrequency: number; // orders per month
    lifetimeValue: number; // all time sales
    lastPurchaseDate?: string;
  }[];

  // Customer types breakdown
  customerTypeBreakdown: {
    type: string;
    customerCount: number;
    totalSales: number;
    avgSalesPerCustomer: number;
  }[];

  // New vs returning customers
  customerAcquisition: {
    newCustomers: number;
    newCustomersSales: number;
    returningCustomers: number;
    returningCustomersSales: number;
  };

  // Customer by region
  customerByRegion: {
    region: string;
    customerCount: number;
    totalSales: number;
  }[];

  // Inactive customers
  inactiveCustomers: {
    id: string;
    code: string;
    name: string;
    daysSinceLastPurchase: number;
    lifetimeValue: number;
  }[];
}

export interface SalespersonReportData {
  // Individual performance
  salespersonPerformance: {
    id: string;
    name: string;
    employeeCode: string;
    department: string;
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    customerCount: number;
    conversionRate: number;
  }[];

  // Top salesperson
  topSalesperson: {
    id: string;
    name: string;
    sales: number;
  };

  // Product groups sold per salesperson
  salespersonProductGroups: {
    salespersonId: string;
    salespersonName: string;
    groups: {
      group: string;
      sales: number;
      quantity: number;
    }[];
  }[];

  // Products sold per salesperson (top 5 each)
  salespersonProducts: {
    salespersonId: string;
    salespersonName: string;
    products: {
      productId: string;
      productName: string;
      sales: number;
      quantity: number;
    }[];
  }[];

  // Monthly trend per salesperson
  salespersonMonthlyTrend: {
    month: string;
    salespeople: {
      id: string;
      name: string;
      sales: number;
      orders: number;
    }[];
  }[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getDateRange(filter: DateRangeFilter) {
  const start = startOfDay(parseISO(filter.startDate));
  const end = endOfDay(parseISO(filter.endDate));
  return { start, end };
}

function getDayOfWeekThai(dayIndex: number): string {
  const days = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  return days[dayIndex];
}

function getQuarterLabel(quarter: number): string {
  return `ไตรมาส ${quarter}`;
}

const regionMapping: Record<string, string[]> = {
  ภาคเหนือ: [
    "เชียงใหม่",
    "เชียงราย",
    "ลำปาง",
    "ลำพูน",
    "แม่ฮ่องสอน",
    "น่าน",
    "พะเยา",
    "แพร่",
    "อุตรดิตถ์",
    "ตาก",
    "สุโขทัย",
    "พิษณุโลก",
    "พิจิตร",
    "กำแพงเพชร",
    "เพชรบูรณ์",
    "นครสวรรค์",
    "อุทัยธานี",
  ],
  ภาคตะวันออกเฉียงเหนือ: [
    "ขอนแก่น",
    "อุดรธานี",
    "นครราชสีมา",
    "อุบลราชธานี",
    "ร้อยเอ็ด",
    "มหาสารคาม",
    "สกลนคร",
    "นครพนม",
    "กาฬสินธุ์",
    "หนองคาย",
    "หนองบัวลำภู",
    "เลย",
    "ชัยภูมิ",
    "บุรีรัมย์",
    "สุรินทร์",
    "ศรีสะเกษ",
    "ยโสธร",
    "อำนาจเจริญ",
    "มุกดาหาร",
    "บึงกาฬ",
  ],
  ภาคตะวันออก: [
    "ชลบุรี",
    "ระยอง",
    "จันทบุรี",
    "ตราด",
    "ฉะเชิงเทรา",
    "ปราจีนบุรี",
    "สระแก้ว",
  ],
  ภาคตะวันตก: [
    "ราชบุรี",
    "กาญจนบุรี",
    "สุพรรณบุรี",
    "นครปฐม",
    "สมุทรสาคร",
    "สมุทรสงคราม",
    "เพชรบุรี",
    "ประจวบคีรีขันธ์",
  ],
  ภาคกลาง: [
    "กรุงเทพมหานคร",
    "นนทบุรี",
    "ปทุมธานี",
    "สมุทรปราการ",
    "พระนครศรีอยุธยา",
    "อ่างทอง",
    "ลพบุรี",
    "สิงห์บุรี",
    "ชัยนาท",
    "สระบุรี",
    "นครนายก",
  ],
  ภาคใต้: [
    "นครศรีธรรมราช",
    "กระบี่",
    "พังงา",
    "ภูเก็ต",
    "สุราษฎร์ธานี",
    "ระนอง",
    "ชุมพร",
    "สงขลา",
    "สตูล",
    "ตรัง",
    "พัทลุง",
    "ปัตตานี",
    "ยะลา",
    "นราธิวาส",
  ],
};

function getRegionFromProvince(province: string | null): string {
  if (!province) return "ไม่ระบุ";
  for (const [region, provinces] of Object.entries(regionMapping)) {
    if (provinces.some((p) => province.includes(p) || p.includes(province))) {
      return region;
    }
  }
  return "อื่นๆ";
}

// ============================================
// 1. TIME-BASED SALES REPORT
// ============================================

export async function getTimeSalesReport(
  filter: DateRangeFilter,
): Promise<TimeSalesReportData> {
  const { start, end } = getDateRange(filter);
  const durationInDays = differenceInDays(end, start) + 1; // +1 to include both start and end dates

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
  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, province: true },
  });
  const customerProvinceMap = new Map(customers.map((c) => [c.id, c.province]));

  // Get previous period sales for growth calculation
  const previousSales = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: previousStart, lte: previousEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
// 2. PRODUCT SALES REPORT
// ============================================

export async function getProductSalesReport(
  filter: DateRangeFilter,
): Promise<ProductSalesReportData> {
  const { start, end } = getDateRange(filter);

  // Get all products with their sales in the period
  const productSales = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
  const products = await prisma.product.findMany({
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
      },
    },
    select: { productId: true },
    distinct: ["productId"],
  });
  const recentSoldIds = new Set(recentSoldProducts.map((p) => p.productId));

  const stagnantProducts = await prisma.product.findMany({
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
// 3. PRODUCT GROUP SALES REPORT
// ============================================

export async function getProductGroupSalesReport(
  filter: DateRangeFilter,
): Promise<ProductGroupSalesReportData> {
  const { start, end } = getDateRange(filter);
  // Get all product groups from database
  const productGroups = await prisma.productGroupMaster.findMany({
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
      const products = await prisma.product.findMany({
        where: { productGroup: group, deletedAt: null },
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
          },
        },
        _sum: {
          totalPrice: true,
          quantity: true,
        },
      });

      // Get order count
      const orderCount = await prisma.saleItem.groupBy({
        by: ["saleId"],
        where: {
          productId: { in: productIds },
          sale: {
            saleDate: { gte: start, lte: end },
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
          const products = await prisma.product.findMany({
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
              },
            },
            _sum: { totalPrice: true },
          });

          const orderCount = await prisma.saleItem.groupBy({
            by: ["saleId"],
            where: {
              productId: { in: productIds },
              sale: {
                saleDate: { gte: monthStart, lte: monthEnd },
                deletedAt: null,
                status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
// 4. CUSTOMER SALES REPORT
// ============================================

export async function getCustomerSalesReport(
  filter: DateRangeFilter,
): Promise<CustomerSalesReportData> {
  const { start, end } = getDateRange(filter);
  const dayCount = differenceInDays(end, start) + 1;
  const monthCount = Math.max(1, dayCount / 30);

  // Top customers
  const customerSales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 50,
  });

  const customerIds = customerSales.map((c) => c.customerId);

  // Get customer details and lifetime value
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      customerCode: true,
      name: true,
      customerType: true,
      province: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
      _count: {
        select: {
          sales: {
            where: {
              deletedAt: null,
              status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            },
          },
        },
      },
    },
  });

  // Get lifetime value for each customer
  const lifetimeValues = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: customerIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });
  const lifetimeMap = new Map(
    lifetimeValues.map((l) => [l.customerId, Number(l._sum.totalAmount || 0)]),
  );

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const topCustomers = customerSales.map((cs) => {
    const customer = customerMap.get(cs.customerId);
    const totalSales = Number(cs._sum.totalAmount || 0);
    const orderCount = cs._count;

    return {
      id: cs.customerId,
      code: customer?.customerCode || "",
      name: customer?.name || "Unknown",
      type: customer?.customerType || "-",
      province: customer?.province || "-",
      totalSales,
      orderCount,
      avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      purchaseFrequency: orderCount / monthCount,
      lifetimeValue: lifetimeMap.get(cs.customerId) || totalSales,
      lastPurchaseDate: customer?.sales[0]?.saleDate
        ? format(customer.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });

  // Customer type breakdown
  const allCustomerSales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const allCustomers = await prisma.customer.findMany({
    where: { id: { in: allCustomerSales.map((c) => c.customerId) } },
    select: { id: true, customerType: true },
  });
  const typeMap = new Map(allCustomers.map((c) => [c.id, c.customerType]));

  const typeBreakdown = new Map<
    string,
    { count: Set<string>; sales: number }
  >();
  for (const cs of allCustomerSales) {
    const type = typeMap.get(cs.customerId) || "OTHER";
    if (!typeBreakdown.has(type)) {
      typeBreakdown.set(type, { count: new Set(), sales: 0 });
    }
    const breakdown = typeBreakdown.get(type)!;
    breakdown.count.add(cs.customerId);
    breakdown.sales += Number(cs._sum.totalAmount || 0);
  }

  const customerTypeBreakdown = Array.from(typeBreakdown.entries()).map(
    ([type, data]) => ({
      type,
      customerCount: data.count.size,
      totalSales: data.sales,
      avgSalesPerCustomer:
        data.count.size > 0 ? data.sales / data.count.size : 0,
    }),
  );

  // New vs returning customers
  const customersWithFirstPurchase = await prisma.customer.findMany({
    where: {
      sales: {
        some: {
          saleDate: { gte: start, lte: end },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
      },
    },
    select: {
      id: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        orderBy: { saleDate: "asc" },
        take: 1,
        select: { saleDate: true },
      },
    },
  });

  let newCustomers = 0,
    newCustomersSales = 0;
  let returningCustomers = 0,
    returningCustomersSales = 0;

  for (const customer of customersWithFirstPurchase) {
    const firstPurchase = customer.sales[0]?.saleDate;
    const customerData = allCustomerSales.find(
      (cs) => cs.customerId === customer.id,
    );
    const sales = Number(customerData?._sum.totalAmount || 0);

    if (firstPurchase && firstPurchase >= start && firstPurchase <= end) {
      newCustomers++;
      newCustomersSales += sales;
    } else {
      returningCustomers++;
      returningCustomersSales += sales;
    }
  }

  // Customer by region
  const customersWithProvince = await prisma.customer.findMany({
    where: { id: { in: allCustomerSales.map((c) => c.customerId) } },
    select: { id: true, province: true },
  });
  const provinceMap = new Map(
    customersWithProvince.map((c) => [c.id, c.province]),
  );

  const regionData = new Map<string, { count: Set<string>; sales: number }>();
  for (const cs of allCustomerSales) {
    const province = provinceMap.get(cs.customerId) || null;
    const region = getRegionFromProvince(province);

    if (!regionData.has(region)) {
      regionData.set(region, { count: new Set(), sales: 0 });
    }
    const rd = regionData.get(region)!;
    rd.count.add(cs.customerId);
    rd.sales += Number(cs._sum.totalAmount || 0);
  }

  const customerByRegion = Array.from(regionData.entries())
    .map(([region, data]) => ({
      region,
      customerCount: data.count.size,
      totalSales: data.sales,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // Inactive customers (no purchase in selected period but had previous purchases)
  const inactiveCustomersData = await prisma.customer.findMany({
    where: {
      sales: {
        some: {
          saleDate: { lt: start },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        none: {
          saleDate: { gte: start, lte: end },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
      },
    },
    select: {
      id: true,
      customerCode: true,
      name: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true, totalAmount: true },
      },
    },
    take: 20,
  });

  // Get lifetime values for inactive customers
  const inactiveIds = inactiveCustomersData.map((c) => c.id);
  const inactiveLifetimeValues = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: inactiveIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });
  const inactiveLifetimeMap = new Map(
    inactiveLifetimeValues.map((l) => [
      l.customerId,
      Number(l._sum.totalAmount || 0),
    ]),
  );

  const inactiveCustomers = inactiveCustomersData
    .map((c) => ({
      id: c.id,
      code: c.customerCode,
      name: c.name,
      daysSinceLastPurchase: c.sales[0]?.saleDate
        ? differenceInDays(new Date(), c.sales[0].saleDate)
        : 999,
      lifetimeValue: inactiveLifetimeMap.get(c.id) || 0,
    }))
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  return {
    topCustomers,
    customerTypeBreakdown,
    customerAcquisition: {
      newCustomers,
      newCustomersSales,
      returningCustomers,
      returningCustomersSales,
    },
    customerByRegion,
    inactiveCustomers,
  };
}

// ============================================
// 5. SALESPERSON SALES REPORT
// ============================================

export async function getSalespersonSalesReport(
  filter: DateRangeFilter,
): Promise<SalespersonReportData> {
  const { start, end } = getDateRange(filter);

  // Get salesperson performance
  const employeeSales = await prisma.sale.groupBy({
    by: ["employeeId"],
    where: {
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const employeeIds = employeeSales.map((e) => e.employeeId);

  // Get employee details
  const employees = await prisma.employee.findMany({
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
  const customerCounts = await prisma.sale.groupBy({
    by: ["employeeId", "customerId"],
    where: {
      employeeId: { in: employeeIds },
      saleDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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

      const groupData = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            employeeId,
            saleDate: { gte: start, lte: end },
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          },
        },
        _sum: {
          totalPrice: true,
          quantity: true,
        },
      });

      const productIds = groupData.map((g) => g.productId);
      const products = await prisma.product.findMany({
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

      const productData = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            employeeId,
            saleDate: { gte: start, lte: end },
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
      const products = await prisma.product.findMany({
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

      const monthData = await prisma.sale.groupBy({
        by: ["employeeId"],
        where: {
          saleDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
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
// REPORT FILTER OPTIONS
// ============================================

export async function getReportFilterOptions() {
  const [customers, employees, products, productGroups] = await Promise.all([
    prisma.customer.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, customerCode: true, customerType: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, employeeCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, productCode: true, productGroup: true },
      orderBy: { name: "asc" },
    }),
    prisma.productGroupMaster
      .findMany({
        where: { deletedAt: null },
        select: { code: true, description: true },
        orderBy: { code: "asc" },
      })
      .then((groups) =>
        groups.map((g) => ({ value: g.code, label: g.description })),
      ),
  ]);

  // Get available years from sales data
  const yearData = await prisma.sale.findMany({
    select: { saleDate: true },
    distinct: ["saleDate"],
    orderBy: { saleDate: "asc" },
    take: 1,
  });

  const earliestYear =
    yearData[0]?.saleDate.getFullYear() || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = earliestYear; y <= currentYear; y++) {
    years.push(y);
  }

  return {
    customers,
    employees,
    products,
    productGroups,
    years: years.reverse(),
  };
}

// ============================================
// CUSTOMER LIST FOR CUSTOMER REPORT PAGE
// ============================================

export interface CustomerListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  province: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  lifetimeValue: number;
  lastPurchaseDate?: string;
}

export async function getAllCustomersForReport(): Promise<CustomerListItem[]> {
  // Get all customers with their sales data
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      customerCode: true,
      name: true,
      customerType: true,
      province: true,
      createdAt: true,
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
      _count: {
        select: {
          sales: {
            where: {
              deletedAt: null,
              status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const customerIds = customers.map((c) => c.id);

  // Get lifetime sales for all customers
  const lifetimeSales = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: customerIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const salesMap = new Map(
    lifetimeSales.map((s) => [
      s.customerId,
      {
        totalSales: Number(s._sum.totalAmount || 0),
        orderCount: s._count,
      },
    ])
  );

  // Calculate months since customer creation for purchase frequency
  const now = new Date();

  return customers.map((customer) => {
    const salesData = salesMap.get(customer.id) || {
      totalSales: 0,
      orderCount: 0,
    };

    const monthsSinceCreation = Math.max(
      1,
      differenceInDays(now, customer.createdAt) / 30
    );

    return {
      id: customer.id,
      code: customer.customerCode,
      name: customer.name,
      type: customer.customerType,
      province: customer.province || "-",
      totalSales: salesData.totalSales,
      orderCount: salesData.orderCount,
      avgOrderValue:
        salesData.orderCount > 0
          ? salesData.totalSales / salesData.orderCount
          : 0,
      purchaseFrequency: salesData.orderCount / monthsSinceCreation,
      lifetimeValue: salesData.totalSales,
      lastPurchaseDate: customer.sales[0]?.saleDate
        ? format(customer.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });
}

// ============================================
// SALESPERSON LIST FOR SALESPERSON REPORT PAGE
// ============================================

export interface SalespersonListItem {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  customerCount: number;
  totalPoints: number;
  lastSaleDate?: string;
}

export async function getAllSalespersonsForReport(): Promise<SalespersonListItem[]> {
  // Get all employees who have made sales
  const employeeSales = await prisma.sale.groupBy({
    by: ["employeeId"],
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const employeeIds = employeeSales.map((e) => e.employeeId);

  // Get employee details
  const employees = await prisma.employee.findMany({
    where: { 
      id: { in: employeeIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      department: { select: { name: true } },
      pointSummary: { select: { totalPoints: true } },
      sales: {
        where: {
          deletedAt: null,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        },
        orderBy: { saleDate: "desc" },
        take: 1,
        select: { saleDate: true },
      },
    },
  });

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Get customer count per employee
  const customerCounts = await prisma.sale.groupBy({
    by: ["employeeId", "customerId"],
    where: {
      employeeId: { in: employeeIds },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
  });

  const customerCountMap = new Map<string, Set<string>>();
  for (const cc of customerCounts) {
    if (!customerCountMap.has(cc.employeeId)) {
      customerCountMap.set(cc.employeeId, new Set());
    }
    customerCountMap.get(cc.employeeId)!.add(cc.customerId);
  }

  return employeeSales.map((es) => {
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
      totalPoints: employee?.pointSummary?.totalPoints || 0,
      lastSaleDate: employee?.sales[0]?.saleDate
        ? format(employee.sales[0].saleDate, "dd/MM/yyyy")
        : undefined,
    };
  });
}

