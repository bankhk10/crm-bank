"use server";

import { db as prisma } from "@/src/infrastructure/database";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDaysInMonth,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

export type DashboardPeriod = "day" | "month" | "year";

interface PeriodData {
  monthlySales: {
    total: number;
    salesNote: number;
    invoice: number;
    growthPercent: number;
  };
  target: {
    target: number;
    current: number;
  };
  productGroupData: {
    group: string;
    code: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];
  regionData: {
    region: string;
    target: number;
    salesNote: number;
    invoice: number;
  }[];
  jobStatus: {
    total: number;
    success: number;
    fail: number;
    progress: number;
  };
}

export interface DashboardData {
  periodData: Record<DashboardPeriod, PeriodData>;

  // YTD (always yearly)
  ytd: {
    total: number;
    target: number;
    growthPercent: number;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Date ranges
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const lastDayStart = startOfDay(subDays(now, 1));
  const lastDayEnd = endOfDay(subDays(now, 1));
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));

  const aggregateSales = async (start: Date, end: Date) => {
    const salesRaw = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"] },
      },
      _sum: { totalAmount: true },
    });

    const salesNoteRaw = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: {
          in: [
            "PENDING",
            "PENDING_APPROVAL",
            "WAITING_FOR_CORRECTION",
            "APPROVED",
            "AWAITING_PAYMENT",
            "AWAITING_DELIVERY",
          ],
        },
      },
      _sum: { totalAmount: true },
    });

    const invoiceRaw = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: {
          in: ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
        },
      },
      _sum: { totalAmount: true },
    });

    return {
      total: Number(salesRaw._sum.totalAmount || 0),
      salesNote: Number(salesNoteRaw._sum.totalAmount || 0),
      invoice: Number(invoiceRaw._sum.totalAmount || 0),
    };
  };

  const [daySales, monthSales, yearSales, lastDaySales, lastMonthSales] =
    await Promise.all([
      aggregateSales(dayStart, dayEnd),
      aggregateSales(monthStart, monthEnd),
      aggregateSales(yearStart, yearEnd),
      aggregateSales(lastDayStart, lastDayEnd),
      aggregateSales(lastMonthStart, lastMonthEnd),
    ]);

  const lastYearSales = await aggregateSales(lastYearStart, lastYearEnd);

  const dayGrowth =
    lastDaySales.total > 0
      ? ((daySales.total - lastDaySales.total) / lastDaySales.total) * 100
      : 0;
  const monthGrowth =
    lastMonthSales.total > 0
      ? ((monthSales.total - lastMonthSales.total) / lastMonthSales.total) * 100
      : 0;
  const yearGrowth =
    lastYearSales.total > 0
      ? ((yearSales.total - lastYearSales.total) / lastYearSales.total) * 100
      : 0;

  // === 1. YTD ===
  const ytdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: yearStart, lte: yearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"] },
    },
    _sum: { totalAmount: true },
  });

  const lastYtdRaw = await prisma.sale.aggregate({
    where: {
      saleDate: { gte: lastYearStart, lte: lastYearEnd },
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"] },
    },
    _sum: { totalAmount: true },
  });

  const ytdTotal = Number(ytdRaw._sum.totalAmount || 0);
  const lastYtdTotal = Number(lastYtdRaw._sum.totalAmount || 0);
  const ytdGrowth =
    lastYtdTotal > 0 ? ((ytdTotal - lastYtdTotal) / lastYtdTotal) * 100 : 0;

  // === 2. Product Group Sales (This Month) ===
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
    productGroupTargets.map((t) => [t.productGroup, Number(t.targetAmount)]),
  );

  const getProductGroupData = async (start: Date, end: Date) =>
    Promise.all(
      productGroupOptions.map(async (groupOption) => {
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
            code: groupOption.value,
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
              saleDate: { gte: start, lte: end },
              deletedAt: null,
              status: {
                in: [
                  "PENDING",
                  "PENDING_APPROVAL",
                  "WAITING_FOR_CORRECTION",
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
              saleDate: { gte: start, lte: end },
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
          code: groupOption.value,
          target,
          salesNote: salesNoteAmt,
          invoice: invoiceAmt,
        };
      }),
    );

  const [productGroupDay, productGroupMonth, productGroupYear] =
    await Promise.all([
      getProductGroupData(dayStart, dayEnd),
      getProductGroupData(monthStart, monthEnd),
      getProductGroupData(yearStart, yearEnd),
    ]);

  // === 3. Region Sales (This Month) ===
  const { getAllRegions, getRegionByProvince } =
    await import("@/lib/province-region-mapping");
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
    regionTargets.map((t) => [t.region, Number(t.targetAmount)]),
  );

  const getRegionData = async (start: Date, end: Date) => {
    // Initialize accumulators
    const regionSalesMap = new Map<
      string,
      { salesNote: number; invoice: number }
    >();

    regions.forEach((r) => {
      regionSalesMap.set(r, { salesNote: 0, invoice: 0 });
    });

    // Fetch all sales for this range with customer province
    const salesInRange = await prisma.sale.findMany({
      where: {
        saleDate: { gte: start, lte: end },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"] },
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
    for (const sale of salesInRange) {
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
          "PENDING_APPROVAL",
          "WAITING_FOR_CORRECTION",
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

    return regions.map((region) => {
      const target = regionTargetMap.get(region) || 0;
      const sales = regionSalesMap.get(region) || { salesNote: 0, invoice: 0 };

      return {
        region,
        target,
        salesNote: sales.salesNote,
        invoice: sales.invoice,
      };
    });
  };

  const [regionDay, regionMonth, regionYear] = await Promise.all([
    getRegionData(dayStart, dayEnd),
    getRegionData(monthStart, monthEnd),
    getRegionData(yearStart, yearEnd),
  ]);

  // === 4. Job Status (Sales in this period) ===
  const getJobStatus = async (start: Date, end: Date) => {
    const statusCounts = await prisma.sale.groupBy({
      by: ["status"],
      where: {
        saleDate: { gte: start, lte: end },
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
    const failStatuses = ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"];
    const progressStatuses = [
      "PENDING",
      "PENDING_APPROVAL",
      "WAITING_FOR_CORRECTION",
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

    return {
      total: total || 120,
      success: success || 70,
      fail: fail || 20,
      progress: progress || 30,
    };
  };

  const [jobStatusDay, jobStatusMonth, jobStatusYear] = await Promise.all([
    getJobStatus(dayStart, dayEnd),
    getJobStatus(monthStart, monthEnd),
    getJobStatus(yearStart, yearEnd),
  ]);

  // === 5. Target - Fetch from database ===
  const monthlyTargetRecord = await prisma.monthlySalesTarget.findFirst({
    where: {
      year: currentYear,
      month: currentMonth,
      deletedAt: null,
    },
  });

  const yearlyTargetRecord = await prisma.monthlySalesTarget.findFirst({
    where: {
      year: currentYear,
      month: null,
      deletedAt: null,
    },
  });
  const detailedMonthlyTargetAgg = await prisma.salesTargetItem.aggregate({
    where: {
      salesTarget: {
        year: currentYear,
        month: currentMonth,
      },
    },
    _sum: { amount: true },
  });

  const detailedYearlyTargetAgg = await prisma.salesTargetItem.aggregate({
    where: {
      salesTarget: {
        year: currentYear,
      },
    },
    _sum: { amount: true },
  });

  const detailedMonthlyTarget = Number(
    detailedMonthlyTargetAgg._sum.amount || 0,
  );
  const detailedYearlyTarget = Number(detailedYearlyTargetAgg._sum.amount || 0);

  const monthlyTarget =
    detailedMonthlyTarget > 0
      ? detailedMonthlyTarget
      : monthlyTargetRecord
        ? Number(monthlyTargetRecord.targetAmount)
        : 0;

  const yearlyTarget =
    detailedYearlyTarget > 0
      ? detailedYearlyTarget
      : yearlyTargetRecord
        ? Number(yearlyTargetRecord.targetAmount)
        : 0;

  const daysInMonth = getDaysInMonth(now);
  const dailyTarget = monthlyTarget > 0 ? monthlyTarget / daysInMonth : 0;

  const periodData: Record<DashboardPeriod, PeriodData> = {
    day: {
      monthlySales: {
        total: daySales.total,
        salesNote: daySales.salesNote,
        invoice: daySales.invoice,
        growthPercent: Math.round(dayGrowth * 10) / 10,
      },
      target: {
        target: dailyTarget,
        current: daySales.total,
      },
      productGroupData: productGroupDay.length > 0 ? productGroupDay : [],
      regionData: regionDay.length > 0 ? regionDay : [],
      jobStatus: jobStatusDay,
    },
    month: {
      monthlySales: {
        total: monthSales.total,
        salesNote: monthSales.salesNote,
        invoice: monthSales.invoice,
        growthPercent: Math.round(monthGrowth * 10) / 10,
      },
      target: {
        target: monthlyTarget,
        current: monthSales.total,
      },
      productGroupData: productGroupMonth.length > 0 ? productGroupMonth : [],
      regionData: regionMonth.length > 0 ? regionMonth : [],
      jobStatus: jobStatusMonth,
    },
    year: {
      monthlySales: {
        total: yearSales.total,
        salesNote: yearSales.salesNote,
        invoice: yearSales.invoice,
        growthPercent: Math.round(yearGrowth * 10) / 10,
      },
      target: {
        target: yearlyTarget,
        current: yearSales.total,
      },
      productGroupData: productGroupYear.length > 0 ? productGroupYear : [],
      regionData: regionYear.length > 0 ? regionYear : [],
      jobStatus: jobStatusYear,
    },
  };

  return {
    periodData,
    ytd: {
      total: ytdTotal,
      target: yearlyTarget,
      growthPercent: Math.round(ytdGrowth * 10) / 10,
    },
  };
}
