export type DashboardPeriod = "day" | "month" | "year";

export interface PeriodData {
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
    lastYearSalesNote: number;
    lastYearInvoice: number;
  }[];
  tradeNameGroupData: {
    group: string;
    code: string;
    target: number;
    salesNote: number;
    invoice: number;
    lastYearSalesNote: number;
    lastYearInvoice: number;
  }[];
  regionData: {
    region: string;
    target: number;
    salesNote: number;
    invoice: number;
    lastYearSalesNote: number;
    lastYearInvoice: number;
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
  ytd: {
    total: number;
    target: number;
    growthPercent: number;
  };
}
