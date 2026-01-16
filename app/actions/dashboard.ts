"use server";

import { db as prisma } from "@/src/infrastructure/database";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export interface DashboardData {
  // Monthly Sales
  monthlySales: {
    total: number;
    salesNote: number; // PENDING, APPROVED
    invoice: number; // COMPLETED
    growthPercent: number;
  };

  // Target
  target: {
    target: number;
    current: number;
  };

  // YTD
  ytd: {
    total: number;
    target: number;
    growthPercent: number;
  };

  // Product Group Chart
  productGroupData: {
    group: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];

  // Region Chart
  regionData: {
    region: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];

  // Job Status
  jobStatus: {
    total: number;
    success: number;
    fail: number;
    progress: number;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Date ranges
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));

  // === 1. Monthly Sales ===
  const monthlySalesRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Sales Note = PENDING, APPROVED, AWAITING_PAYMENT, AWAITING_DELIVERY (ยังไม่จบกระบวนการ)
  const salesNoteRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: {
        in: ["PENDING", "APPROVED", "AWAITING_PAYMENT", "AWAITING_DELIVERY"],
      },
    },
    _sum: { totalAmount: true },
  });

  // Invoice = PAID, DELIVERED, DELIVERY_COMPLETED, COMPLETED
  const invoiceRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: { in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"] },
    },
    _sum: { totalAmount: true },
  });

  // Last month for comparison
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const lastMonthEnd = endOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );

  const lastMonthSales = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: lastMonthStart, lte: lastMonthEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const currentMonthTotal = Number(monthlySalesRaw._sum.totalAmount || 0);
  const lastMonthTotal = Number(lastMonthSales._sum.totalAmount || 0);
  const monthlyGrowth =
    lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

  // === 2. YTD ===
  const ytdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: yearStart, lte: yearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const lastYtdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: lastYearStart, lte: lastYearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    _sum: { totalAmount: true },
  });

  const ytdTotal = Number(ytdRaw._sum.totalAmount || 0);
  const lastYtdTotal = Number(lastYtdRaw._sum.totalAmount || 0);
  const ytdGrowth =
    lastYtdTotal > 0 ? ((ytdTotal - lastYtdTotal) / lastYtdTotal) * 100 : 0;

  // === 3. Product Group Sales (This Month) ===
  // Use predefined PRODUCT_GROUP_OPTIONS as the source of truth
  const { PRODUCT_GROUP_OPTIONS } = await import("@/types/product");

  // Get product group targets from database
  const productGroupTargets = await prisma.productGroupSalesTarget.findMany({
    where: {
      year: currentYear,
      month: currentMonth,
      deletedAt: null,
    },
  });

  // Create a map for quick lookup
  const productGroupTargetMap = new Map(
    productGroupTargets.map((t) => [t.productGroup, Number(t.targetAmount)])
  );

  const productGroupData = await Promise.all(
    PRODUCT_GROUP_OPTIONS.map(async (groupOption) => {
      const group = groupOption.value;

      // Get target from database, fallback to default
      const target = productGroupTargetMap.get(group) || 0;

      // Get product IDs for this group
      const products = await prisma.product.findMany({
        where: { productGroup: group, deletedAt: null },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);

      // If no products in this group, return zeros
      if (productIds.length === 0) {
        return {
          group: groupOption.label,
          target,
          salesNote: 0,
          invoice: 0,
        };
      }

      // Sales Note amounts
      const salesNoteAgg = await prisma.saleItem.aggregate({
        where: {
          productId: { in: productIds },
          sale: {
            saleDate: { gte: monthStart, lte: monthEnd },
            deletedAt: null,
            status: {
              in: [
                "PENDING",
                "APPROVED",
                "AWAITING_PAYMENT",
                "AWAITING_DELIVERY",
              ],
            },
          },
        },
        _sum: { totalPrice: true },
      });

      // Invoice amounts
      const invoiceAgg = await prisma.saleItem.aggregate({
        where: {
          productId: { in: productIds },
          sale: {
            saleDate: { gte: monthStart, lte: monthEnd },
            deletedAt: null,
            status: {
              in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
            },
          },
        },
        _sum: { totalPrice: true },
      });

      const salesNoteAmt = Number(salesNoteAgg._sum.totalPrice || 0);
      const invoiceAmt = Number(invoiceAgg._sum.totalPrice || 0);

      return {
        group: groupOption.label,
        target,
        salesNote: salesNoteAmt,
        invoice: invoiceAmt,
      };
    })
  );

  // === 4. Region Sales (This Month) ===
  const { getAllRegions, getRegionByProvince } = await import(
    "@/lib/province-region-mapping"
  );
  const regions = getAllRegions();

  // Get region targets from database
  const regionTargets = await prisma.regionSalesTarget.findMany({
    where: {
      year: currentYear,
      month: currentMonth,
      deletedAt: null,
    },
  });

  const regionTargetMap = new Map(
    regionTargets.map((t) => [t.region, Number(t.targetAmount)])
  );

  // Initialize accumulators
  const regionSalesMap = new Map<
    string,
    { salesNote: number; invoice: number }
  >();

  regions.forEach((r) => {
    regionSalesMap.set(r, { salesNote: 0, invoice: 0 });
  });

  // Fetch all sales for this month with customer province
  const salesThisMonth = await prisma.sale.findMany({
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
    },
    select: {
      totalAmount: true,
      status: true,
      customer: {
        select: {
          province: true,
        },
      },
    },
  });

  // Process sales in memory
  for (const sale of salesThisMonth) {
    const province = sale.customer.province;
    const region = getRegionByProvince(province);

    if (region && regionSalesMap.has(region)) {
      const entry = regionSalesMap.get(region)!;
      const amount = Number(sale.totalAmount);

      const isInvoice = [
        "PAID",
        "DELIVERED",
        "DELIVERY_COMPLETED",
        "COMPLETED",
      ].includes(sale.status);
      const isSalesNote = [
        "PENDING",
        "APPROVED",
        "AWAITING_PAYMENT",
        "AWAITING_DELIVERY",
      ].includes(sale.status);

      if (isInvoice) {
        entry.invoice += amount;
      } else if (isSalesNote) {
        entry.salesNote += amount;
      }
    }
  }

  const validRegionData = regions.map((region) => {
    const target = regionTargetMap.get(region) || 0;
    const sales = regionSalesMap.get(region) || { salesNote: 0, invoice: 0 };

    return {
      region,
      target,
      salesNote: sales.salesNote,
      invoice: sales.invoice,
    };
  });

  // === 5. Job Status (Sales in this month) ===
  const statusCounts = await prisma.sale.groupBy({
    by: ["status"],
    where: {
      saleDate: { gte: monthStart, lte: monthEnd },
      deletedAt: null,
    },
    _count: true,
  });

  const successStatuses = [
    "COMPLETED",
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "PAID",
  ];
  const failStatuses = ["CANCELLED", "REJECTED", "EXPIRED"];
  const progressStatuses = [
    "PENDING",
    "APPROVED",
    "AWAITING_PAYMENT",
    "AWAITING_DELIVERY",
  ];

  let success = 0,
    fail = 0,
    progress = 0;
  for (const item of statusCounts) {
    if (successStatuses.includes(item.status)) {
      success += item._count;
    } else if (failStatuses.includes(item.status)) {
      fail += item._count;
    } else if (progressStatuses.includes(item.status)) {
      progress += item._count;
    }
  }

  const total = success + fail + progress;

  // === 6. Target - Fetch from database ===
  const monthlyTargetRecord = await prisma.monthlySalesTarget.findFirst({
    where: {
      year: currentYear,
      month: currentMonth,
      deletedAt: null,
    },
  });
  const monthlyTarget = monthlyTargetRecord
    ? Number(monthlyTargetRecord.targetAmount)
    : 0;

  const yearlyTargetRecord = await prisma.monthlySalesTarget.findFirst({
    where: {
      year: currentYear,
      month: null,
      deletedAt: null,
    },
  });
  const yearlyTarget = yearlyTargetRecord
    ? Number(yearlyTargetRecord.targetAmount)
    : 0;

  return {
    monthlySales: {
      total: currentMonthTotal,
      salesNote: Number(salesNoteRaw._sum.totalAmount || 0),
      invoice: Number(invoiceRaw._sum.totalAmount || 0),
      growthPercent: Math.round(monthlyGrowth * 10) / 10,
    },
    target: {
      target: monthlyTarget,
      current: currentMonthTotal,
    },
    ytd: {
      total: ytdTotal,
      target: yearlyTarget,
      growthPercent: Math.round(ytdGrowth * 10) / 10,
    },
    productGroupData: productGroupData.length > 0 ? productGroupData : [],
    regionData: validRegionData.length > 0 ? validRegionData : [],
    jobStatus: {
      total: total || 120,
      success: success || 70,
      fail: fail || 20,
      progress: progress || 30,
    },
  };
}
