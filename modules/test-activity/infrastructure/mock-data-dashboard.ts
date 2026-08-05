// ===== Mock Data for Activity Dashboard =====

export interface DashboardFilter {
  year: string;
  month: string;
  zone: string;
  activityType: string;
  responsible: string;
}

// ---- KPI 1: กิจกรรมทั้งหมด ----
export interface ActivitySummaryMock {
  total: number;
  completed: number;
  approved: number;
  inProgress: number;
  cancelled: number;
  pending: number;
}

// ---- KPI 2: งบประมาณ ----
export interface BudgetSummaryMock {
  totalApproved: number;
  breakdown: {
    label: string;
    percent: number;
    amount: number;
    color: string;
  }[];
}

// ---- KPI 3: ยอดขาย ----
export interface SalesSummaryMock {
  totalSales: number;
  roi: number; // percent
}

// ---- KPI 4: สุขภาพแปลง ----
export interface PlotHealthSummaryMock {
  totalPlots: number;
  good: number; // percent
  fair: number; // percent
  poor: number; // percent
}

// ---- Chart 1: Plan vs Actual ----
export interface WeeklyComparisonMock {
  week: string;
  plan: number;
  actual: number;
  inProgress: number;
}

// ---- Chart 2: Activity Type Breakdown ----
export interface ActivityTypeBreakdownMock {
  name: string;
  value: number;
  percent: number;
  color: string;
}

// ===== Actual Mock Data =====

export const MOCK_ACTIVITY_SUMMARY: ActivitySummaryMock = {
  total: 180,
  completed: 110,
  approved: 95,
  inProgress: 55,
  cancelled: 5,
  pending: 10,
};

export const MOCK_BUDGET_SUMMARY: BudgetSummaryMock = {
  totalApproved: 2350000,
  breakdown: [
    { label: "งบการตลาด", percent: 55, amount: 1292500, color: "#22c55e" },
    {
      label: "งบส่งเสริมการขาย",
      percent: 30,
      amount: 705000,
      color: "#3b82f6",
    },
    { label: "ค่าใช้จ่ายอื่นๆ", percent: 15, amount: 352500, color: "#f59e0b" },
  ],
};

export const MOCK_SALES_SUMMARY: SalesSummaryMock = {
  totalSales: 8210000,
  roi: 249,
};

export const MOCK_PLOT_HEALTH_SUMMARY: PlotHealthSummaryMock = {
  totalPlots: 120,
  good: 70,
  fair: 20,
  poor: 10,
};

export const MOCK_WEEKLY_COMPARISON: WeeklyComparisonMock[] = [
  { week: "สัปดาห์ที่ 1", plan: 40, actual: 32, inProgress: 6 },
  { week: "สัปดาห์ที่ 2", plan: 50, actual: 42, inProgress: 5 },
  { week: "สัปดาห์ที่ 3", plan: 60, actual: 48, inProgress: 8 },
  { week: "สัปดาห์ที่ 4", plan: 50, actual: 48, inProgress: 2 },
];

export const MOCK_ACTIVITY_TYPE_BREAKDOWN: ActivityTypeBreakdownMock[] = [
  { name: "เข้าพบร้านค้า / เกษตรกร", value: 51, percent: 40, color: "#3b82f6" },
  {
    name: "ติดตามแปลงสาธิต / ทำแปลง",
    value: 38,
    percent: 30,
    color: "#22c55e",
  },
  {
    name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    value: 39,
    percent: 30,
    color: "#f59e0b",
  },
];

// Options for filters
export const YEAR_OPTIONS = ["ปี 2567", "ปี 2568", "ปี 2569"];
export const MONTH_OPTIONS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
export const ZONE_OPTIONS = [
  "ทั้งหมด",
  "ภาคเหนือ",
  "ภาคกลาง",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคใต้",
  "ภาคตะวันออก",
];
export const ACTIVITY_TYPE_OPTIONS = [
  "ทั้งหมด",
  "เยี่ยมเยียนลูกค้า",
  "เช็กสต็อกสินค้า",
  "ติดตามแปลงสาธิต",
  "Field Day",
  "จัดงานขาย",
];
export const RESPONSIBLE_OPTIONS = [
  "ทั้งหมด",
  "สมชาย ใจดี",
  "สมหญิง รักดี",
  "พิมพ์ใจ เรียนเก่ง",
  "ปรีชา ขยันงาน",
  "สมปอง คำดี",
  "สมเกียรติ โชคดี",
];
