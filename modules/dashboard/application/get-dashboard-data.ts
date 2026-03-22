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
import {
  type DashboardData,
  type DashboardPeriod,
  type PeriodData,
} from "../types";
import * as repo from "../infrastructure/dashboard.repository";
import {
  getAllRegions,
  getRegionByProvince,
} from "@/lib/province-region-mapping";

export async function getDashboardDataUseCase(): Promise<DashboardData> {
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
    const total = await repo.aggregateSalesAmount(start, end, undefined, [
      "CANCELLED",
      "REJECTED",
      "EXPIRED",
      "OVERDUE",
    ]);
    const salesNote = await repo.aggregateSalesAmount(start, end, [
      "PENDING",
      "PENDING_APPROVAL",
      "WAITING_FOR_CORRECTION",
      "APPROVED",
      "AWAITING_PAYMENT",
      "AWAITING_DELIVERY",
    ]);
    const invoice = await repo.aggregateSalesAmount(start, end, [
      "PAID",
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "COMPLETED",
    ]);

    return { total, salesNote, invoice };
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
  const ytdTotal = await repo.aggregateSalesAmount(
    yearStart,
    yearEnd,
    undefined,
    ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
  );
  const lastYtdTotal = await repo.aggregateSalesAmount(
    lastYearStart,
    lastYearEnd,
    undefined,
    ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
  );

  const ytdGrowth =
    lastYtdTotal > 0 ? ((ytdTotal - lastYtdTotal) / lastYtdTotal) * 100 : 0;

  // === 2. Product Group Sales (This Month) ===
  const productGroups = await repo.findAllProductGroups();

  const productGroupOptions = productGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  const productGroupTargets = await repo.findProductGroupTargets(
    currentYear,
    currentMonth,
  );

  const productGroupTargetMap = new Map(
    productGroupTargets.map((t) => [t.productGroup, Number(t.targetAmount)]),
  );

  const getProductGroupData = async (
    start: Date,
    end: Date,
    lastYearStart: Date,
    lastYearEnd: Date,
  ) =>
    Promise.all(
      productGroupOptions.map(async (groupOption) => {
        const group = groupOption.value;
        const target = productGroupTargetMap.get(group) || 0;

        const productIds = await repo.findProductIdsByGroup(group);

        if (productIds.length === 0) {
          return {
            group: groupOption.label,
            code: groupOption.value,
            target,
            salesNote: 0,
            invoice: 0,
            lastYearSalesNote: 0,
            lastYearInvoice: 0,
          };
        }

        const salesNoteAmt = await repo.aggregateSaleItemAmount(
          start,
          end,
          productIds,
          [
            "PENDING",
            "PENDING_APPROVAL",
            "WAITING_FOR_CORRECTION",
            "APPROVED",
            "AWAITING_PAYMENT",
            "AWAITING_DELIVERY",
          ],
        );

        const invoiceAmt = await repo.aggregateSaleItemAmount(
          start,
          end,
          productIds,
          ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
        );

        const lastYearSalesNoteAmt = await repo.aggregateSaleItemAmount(
          lastYearStart,
          lastYearEnd,
          productIds,
          [
            "PENDING",
            "PENDING_APPROVAL",
            "WAITING_FOR_CORRECTION",
            "APPROVED",
            "AWAITING_PAYMENT",
            "AWAITING_DELIVERY",
          ],
        );

        const lastYearInvoiceAmt = await repo.aggregateSaleItemAmount(
          lastYearStart,
          lastYearEnd,
          productIds,
          ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
        );

        return {
          group: groupOption.label,
          code: groupOption.value,
          target,
          salesNote: salesNoteAmt,
          invoice: invoiceAmt,
          lastYearSalesNote: lastYearSalesNoteAmt,
          lastYearInvoice: lastYearInvoiceAmt,
        };
      }),
    );

  const lastYearSameDayStart = startOfDay(subYears(now, 1));
  const lastYearSameDayEnd = endOfDay(subYears(now, 1));
  const lastYearSameMonthStart = startOfMonth(subYears(now, 1));
  const lastYearSameMonthEnd = endOfMonth(subYears(now, 1));

  // Trade Name Group fetching logic
  const tradeNameGroups = await repo.findAllTradeNameGroups();
  const tradeNameGroupOptions = tradeNameGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  const getTradeNameGroupData = async (
    start: Date,
    end: Date,
    lastYearStart: Date,
    lastYearEnd: Date,
  ) =>
    Promise.all(
      tradeNameGroupOptions.map(async (groupOption) => {
        const group = groupOption.value;
        const target = 0; // ไม่มีเป้าหมายราย Trade Name Group

        const productIds = await repo.findProductIdsByTradeNameGroup(group);

        if (productIds.length === 0) {
          return {
            group: groupOption.label,
            code: groupOption.value,
            target,
            salesNote: 0,
            invoice: 0,
            lastYearSalesNote: 0,
            lastYearInvoice: 0,
          };
        }

        const salesNoteAmt = await repo.aggregateSaleItemAmount(
          start,
          end,
          productIds,
          [
            "PENDING",
            "PENDING_APPROVAL",
            "WAITING_FOR_CORRECTION",
            "APPROVED",
            "AWAITING_PAYMENT",
            "AWAITING_DELIVERY",
          ],
        );

        const invoiceAmt = await repo.aggregateSaleItemAmount(
          start,
          end,
          productIds,
          ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
        );

        const lastYearSalesNoteAmt = await repo.aggregateSaleItemAmount(
          lastYearStart,
          lastYearEnd,
          productIds,
          [
            "PENDING",
            "PENDING_APPROVAL",
            "WAITING_FOR_CORRECTION",
            "APPROVED",
            "AWAITING_PAYMENT",
            "AWAITING_DELIVERY",
          ],
        );

        const lastYearInvoiceAmt = await repo.aggregateSaleItemAmount(
          lastYearStart,
          lastYearEnd,
          productIds,
          ["PAID", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
        );

        return {
          group: groupOption.label,
          code: groupOption.value,
          target,
          salesNote: salesNoteAmt,
          invoice: invoiceAmt,
          lastYearSalesNote: lastYearSalesNoteAmt,
          lastYearInvoice: lastYearInvoiceAmt,
        };
      }),
    );

  const [
    productGroupDay, 
    productGroupMonth, 
    productGroupYear,
    tradeNameGroupDay,
    tradeNameGroupMonth,
    tradeNameGroupYear,
  ] = await Promise.all([
    getProductGroupData(
      dayStart,
      dayEnd,
      lastYearSameDayStart,
      lastYearSameDayEnd,
    ),
    getProductGroupData(
      monthStart,
      monthEnd,
      lastYearSameMonthStart,
      lastYearSameMonthEnd,
    ),
    getProductGroupData(yearStart, yearEnd, lastYearStart, lastYearEnd),
    getTradeNameGroupData(
      dayStart,
      dayEnd,
      lastYearSameDayStart,
      lastYearSameDayEnd,
    ),
    getTradeNameGroupData(
      monthStart,
      monthEnd,
      lastYearSameMonthStart,
      lastYearSameMonthEnd,
    ),
    getTradeNameGroupData(yearStart, yearEnd, lastYearStart, lastYearEnd),
  ]);

  // === 3. Region Sales (This Month) ===
  const regions = getAllRegions();

  const regionTargets = await repo.findRegionTargets(currentYear, currentMonth);

  const regionTargetMap = new Map(
    regionTargets.map((t) => [t.region, Number(t.targetAmount)]),
  );

  const getRegionData = async (
    start: Date,
    end: Date,
    lastYearStart: Date,
    lastYearEnd: Date,
  ) => {
    const regionSalesMap = new Map<
      string,
      {
        salesNote: number;
        invoice: number;
        lastYearSalesNote: number;
        lastYearInvoice: number;
      }
    >();

    regions.forEach((r) => {
      regionSalesMap.set(r, {
        salesNote: 0,
        invoice: 0,
        lastYearSalesNote: 0,
        lastYearInvoice: 0,
      });
    });

    const salesInRange = await repo.findSalesWithProvince(start, end, [
      "CANCELLED",
      "REJECTED",
      "EXPIRED",
      "OVERDUE",
    ]);

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

    const lastYearSalesInRange = await repo.findSalesWithProvince(
      lastYearStart,
      lastYearEnd,
      ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
    );

    for (const sale of lastYearSalesInRange) {
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
          entry.lastYearInvoice += amount;
        } else if (isSalesNote) {
          entry.lastYearSalesNote += amount;
        }
      }
    }

    return regions.map((region) => {
      const target = regionTargetMap.get(region) || 0;
      const sales = regionSalesMap.get(region) || {
        salesNote: 0,
        invoice: 0,
        lastYearSalesNote: 0,
        lastYearInvoice: 0,
      };

      return {
        region,
        target,
        salesNote: sales.salesNote,
        invoice: sales.invoice,
        lastYearSalesNote: sales.lastYearSalesNote,
        lastYearInvoice: sales.lastYearInvoice,
      };
    });
  };

  const [regionDay, regionMonth, regionYear] = await Promise.all([
    getRegionData(dayStart, dayEnd, lastYearSameDayStart, lastYearSameDayEnd),
    getRegionData(
      monthStart,
      monthEnd,
      lastYearSameMonthStart,
      lastYearSameMonthEnd,
    ),
    getRegionData(yearStart, yearEnd, lastYearStart, lastYearEnd),
  ]);

  // === 4. Job Status (Sales in this period) ===
  const getJobStatus = async (start: Date, end: Date) => {
    const statusCounts = await repo.groupSaleStatusCounts(start, end);

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
  const monthlyTargetRecord = await repo.findMonthlySalesTarget(
    currentYear,
    currentMonth,
  );
  const yearlyTargetRecord = await repo.findMonthlySalesTarget(
    currentYear,
    null,
  );

  const detailedMonthlyTarget = await repo.sumSalesTargetItems(
    currentYear,
    currentMonth,
  );
  const detailedYearlyTarget = await repo.sumSalesTargetItems(currentYear);

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
      tradeNameGroupData: tradeNameGroupDay.length > 0 ? tradeNameGroupDay: [],
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
      tradeNameGroupData: tradeNameGroupMonth.length > 0 ? tradeNameGroupMonth: [],
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
      tradeNameGroupData: tradeNameGroupYear.length > 0 ? tradeNameGroupYear: [],
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
