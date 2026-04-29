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
  type SalesDashboardData,
  type DashboardPeriod,
  type SalesDashboardPeriodData,
} from "../types";
import * as salesRepo from "../infrastructure/sales-dashboard.repository";
import * as repo from "../infrastructure/dashboard.repository";

/**
 * Get dashboard data scoped to a specific sales employee.
 */
export async function getSalesDashboardDataUseCase(
  employeeId: string,
): Promise<SalesDashboardData> {
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

  // Get employee name
  const employeeInfo = await salesRepo.findEmployeeName(employeeId);
  const employeeName = employeeInfo?.fullName ?? "พนักงาน";

  // Aggregate sales for the employee
  const aggregateSales = async (start: Date, end: Date) => {
    const total = await salesRepo.aggregateTotalSalesAmountByRequestedDateByEmployee(
      employeeId,
      start,
      end,
      ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
    );
    const salesNote = await salesRepo.aggregateSalesAmountByEmployee(
      employeeId,
      start,
      end,
      [
        "PENDING",
        "PENDING_APPROVAL",
        "WAITING_FOR_CORRECTION",
        "APPROVED",
        "AWAITING_PAYMENT",
        "AWAITING_DELIVERY",
      ],
    );
    const invoice = await salesRepo.aggregateSalesAmountByEmployee(
      employeeId,
      start,
      end,
      ["PAID", "PARTIALLY_DELIVERED", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"],
    );

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

  // === YTD ===
  const ytdTotal = await salesRepo.aggregateTotalSalesAmountByRequestedDateByEmployee(
    employeeId,
    yearStart,
    yearEnd,
    ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
  );
  const lastYtdTotal = await salesRepo.aggregateTotalSalesAmountByRequestedDateByEmployee(
    employeeId,
    lastYearStart,
    lastYearEnd,
    ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
  );

  const ytdGrowth =
    lastYtdTotal > 0 ? ((ytdTotal - lastYtdTotal) / lastYtdTotal) * 100 : 0;

  // === Product Group Data ===
  const productGroups = await repo.findAllProductGroups();
  const productGroupOptions = productGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  const tradeNameGroups = await repo.findAllTradeNameGroups();
  const tradeNameGroupOptions = tradeNameGroups.map((g) => ({
    value: g.code,
    label: g.description,
  }));

  const getProductAndTradeNameGroupData = async (
    start: Date,
    end: Date,
    lastYearStart: Date,
    lastYearEnd: Date,
  ) => {
    const currentItems = await salesRepo.findSaleItemsByEmployee(
      employeeId,
      start,
      end,
      ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
    );
    const lastYearItems = await salesRepo.findSaleItemsByEmployee(
      employeeId,
      lastYearStart,
      lastYearEnd,
      ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE"],
    );

    const invoiceStatuses = [
      "PAID",
      "PARTIALLY_DELIVERED",
      "DELIVERED",
      "DELIVERY_COMPLETED",
      "COMPLETED",
    ];
    const salesNoteStatuses = [
      "PENDING",
      "PENDING_APPROVAL",
      "WAITING_FOR_CORRECTION",
      "APPROVED",
      "AWAITING_PAYMENT",
      "AWAITING_DELIVERY",
    ];

    const buildProductGroupData = () => {
      return productGroupOptions.map((groupOption) => {
        const group = groupOption.value;
        let salesNote = 0;
        let invoice = 0;
        let lastYearSalesNote = 0;
        let lastYearInvoice = 0;

        for (const item of currentItems) {
          if (item.product.productABCTypeId === group) {
            const amount = Number(item.totalPrice);
            if (invoiceStatuses.includes(item.sale.status)) invoice += amount;
            else if (salesNoteStatuses.includes(item.sale.status))
              salesNote += amount;
          }
        }
        for (const item of lastYearItems) {
          if (item.product.productABCTypeId === group) {
            const amount = Number(item.totalPrice);
            if (invoiceStatuses.includes(item.sale.status))
              lastYearInvoice += amount;
            else if (salesNoteStatuses.includes(item.sale.status))
              lastYearSalesNote += amount;
          }
        }

        return {
          group: groupOption.label,
          code: groupOption.value,
          target: 0,
          salesNote,
          invoice,
          lastYearSalesNote,
          lastYearInvoice,
        };
      });
    };

    const buildTradeNameGroupData = () => {
      return tradeNameGroupOptions.map((groupOption) => {
        const group = groupOption.value;
        let salesNote = 0;
        let invoice = 0;
        let lastYearSalesNote = 0;
        let lastYearInvoice = 0;

        for (const item of currentItems) {
          if (item.product.tradeNameGroupId === group) {
            const amount = Number(item.totalPrice);
            if (invoiceStatuses.includes(item.sale.status)) invoice += amount;
            else if (salesNoteStatuses.includes(item.sale.status))
              salesNote += amount;
          }
        }
        for (const item of lastYearItems) {
          if (item.product.tradeNameGroupId === group) {
            const amount = Number(item.totalPrice);
            if (invoiceStatuses.includes(item.sale.status))
              lastYearInvoice += amount;
            else if (salesNoteStatuses.includes(item.sale.status))
              lastYearSalesNote += amount;
          }
        }

        return {
          group: groupOption.label,
          code: groupOption.value,
          target: 0,
          salesNote,
          invoice,
          lastYearSalesNote,
          lastYearInvoice,
        };
      });
    };

    return {
      productGroupData: buildProductGroupData(),
      tradeNameGroupData: buildTradeNameGroupData(),
    };
  };

  const lastYearSameDayStart = startOfDay(subYears(now, 1));
  const lastYearSameDayEnd = endOfDay(subYears(now, 1));
  const lastYearSameMonthStart = startOfMonth(subYears(now, 1));
  const lastYearSameMonthEnd = endOfMonth(subYears(now, 1));

  const [dayData, monthData, yearData] = await Promise.all([
    getProductAndTradeNameGroupData(
      dayStart,
      dayEnd,
      lastYearSameDayStart,
      lastYearSameDayEnd,
    ),
    getProductAndTradeNameGroupData(
      monthStart,
      monthEnd,
      lastYearSameMonthStart,
      lastYearSameMonthEnd,
    ),
    getProductAndTradeNameGroupData(
      yearStart,
      yearEnd,
      lastYearStart,
      lastYearEnd,
    ),
  ]);

  // === Job Status ===
  const getJobStatus = async (start: Date, end: Date) => {
    const statusCounts = await salesRepo.groupSaleStatusCountsByEmployee(
      employeeId,
      start,
      end,
    );

    const successStatuses = [
      "COMPLETED",
      "PARTIALLY_DELIVERED",
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
    return { total, success, fail, progress };
  };

  const [jobStatusDay, jobStatusMonth, jobStatusYear] = await Promise.all([
    getJobStatus(dayStart, dayEnd),
    getJobStatus(monthStart, monthEnd),
    getJobStatus(yearStart, yearEnd),
  ]);

  // === Target — employee-level ===
  const monthlyTarget = await salesRepo.sumSalesTargetItemsByEmployee(
    employeeId,
    currentYear,
    currentMonth,
  );
  const yearlyTarget = await salesRepo.sumSalesTargetItemsByEmployee(
    employeeId,
    currentYear,
  );

  const daysInMonth = getDaysInMonth(now);
  const dailyTarget = monthlyTarget > 0 ? monthlyTarget / daysInMonth : 0;

  const periodData: Record<DashboardPeriod, SalesDashboardPeriodData> = {
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
      productGroupData: dayData.productGroupData,
      tradeNameGroupData: dayData.tradeNameGroupData,
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
      productGroupData: monthData.productGroupData,
      tradeNameGroupData: monthData.tradeNameGroupData,
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
      productGroupData: yearData.productGroupData,
      tradeNameGroupData: yearData.tradeNameGroupData,
      jobStatus: jobStatusYear,
    },
  };

  return {
    employeeName,
    periodData,
    ytd: {
      total: ytdTotal,
      target: yearlyTarget,
      growthPercent: Math.round(ytdGrowth * 10) / 10,
    },
  };
}
