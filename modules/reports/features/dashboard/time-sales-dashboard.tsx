"use client";

import { useId, useState, useTransition } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  BarChart3,
  Sun,
  Loader2,
  MapPin,
  Star,
  Award,
  Activity,
  Target,
  Clock,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import {
  getTimeSalesReportAction,
  type TimeSalesReportData,
  type DateRangeFilter,
} from "@/modules/reports";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const DAY_ORDER = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

const quickDateRanges = [
  {
    label: "30 วันล่าสุด",
    getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }),
  },
  {
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "เดือนก่อน",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    label: "ปีก่อน",
    getValue: () => ({
      from: startOfYear(subYears(new Date(), 1)),
      to: endOfYear(subYears(new Date(), 1)),
    }),
  },
];

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────
const formatTHB = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatNumber = (num: number) =>
  new Intl.NumberFormat("th-TH").format(num);

const formatShortTHB = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function GrowthBadge({ pct }: { pct: number }) {
  if (pct > 0)
    return (
      <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
        <ChevronUp className="h-3 w-3" />+{pct.toFixed(1)}%
      </Badge>
    );
  if (pct < 0)
    return (
      <Badge className="gap-1 bg-red-50 text-red-700 border-red-200 font-semibold text-xs">
        <ChevronDown className="h-3 w-3" />
        {pct.toFixed(1)}%
      </Badge>
    );
  return (
    <Badge className="gap-1 bg-slate-100 text-slate-500 border-slate-200 font-semibold text-xs">
      <Minus className="h-3 w-3" />
      0%
    </Badge>
  );
}

function KpiCard({
  label,
  sublabel,
  value,
  sub,
  icon: Icon,
  gradient,
  ring,
  barColor,
  barWidth,
}: {
  label: string;
  sublabel?: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  gradient: string;
  ring: string;
  barColor: string;
  barWidth: string;
}) {
  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(2,6,23,0.25)] hover:shadow-[0_16px_40px_-16px_rgba(2,6,23,0.35)] transition-all duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{label}</p>
            {sublabel && (
              <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
            )}
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-1.5 leading-none">
              {value}
            </p>
            {sub && <div className="mt-1.5">{sub}</div>}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-700`}
                style={{ width: barWidth }}
              />
            </div>
          </div>
          <div className={`shrink-0 grid place-items-center size-11 sm:size-12 rounded-2xl ${gradient} ${ring}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const chartTooltipStyle = {
  borderRadius: "14px",
  border: "1px solid rgba(226,232,240,0.8)",
  boxShadow: "0 18px 60px rgba(2,6,23,0.18)",
  padding: "10px 14px",
  fontSize: "13px",
};

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export function TimeSalesDashboard() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<TimeSalesReportData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getTimeSalesReportAction(filter);
      setReportData(data);
    });
  };

  // Build day-of-week summary from dailyData
  const dowData = (() => {
    if (!reportData) return [];
    const map = new Map<string, { sales: number; orders: number; count: number }>();
    for (const d of reportData.dailyData) {
      if (d.orders === 0) continue;
      // We store aggregated by weekday label from bestSellingDay reference.
      // Since dailyData uses "dd MMM" format, we approximate via index based distribution.
      // Instead we'll use seasonalityData which is already aggregated.
    }
    return map;
  })();

  // Derived: top region
  const topRegion = reportData?.salesByRegion[0];
  const totalRegionSales = reportData?.salesByRegion.reduce((s, r) => s + r.totalSales, 0) ?? 0;

  // Derived: best quarter
  const bestQuarter = reportData
    ? [...reportData.seasonalityData].sort((a, b) => b.sales - a.sales)[0]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
                รายงานยอดขายตามช่วงเวลา
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                วิเคราะห์ยอดขาย · ออเดอร์ · แนวโน้ม · ภูมิภาค
              </p>
            </div>
          </div>
          {reportData && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1 text-slate-600 bg-white">
                <Activity className="h-3 w-3" />
                {format(dateRange.from, "dd/MM/yyyy")} – {format(dateRange.to, "dd/MM/yyyy")}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Filter Card ── */}
        <Card className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-0">
              <p className="text-sm font-semibold text-slate-700">ตัวกรองช่วงเวลา</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-8 px-3 text-xs"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
                onClick={() => setFiltersOpen((p) => !p)}
              >
                {filtersOpen ? "ซ่อน" : "แสดง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 ${
                filtersOpen ? "block" : "hidden"
              } sm:block`}
            >
              {/* Date Picker */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  ช่วงวันที่
                </label>
                <div className="h-10">
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onSelect={(range) => {
                      if (range?.from && range?.to)
                        setDateRange({ from: range.from, to: range.to });
                    }}
                  />
                </div>
              </div>

              {/* Quick ranges */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  ช่วงเวลาด่วน
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      onClick={() => {
                        const { from, to } = r.getValue();
                        setDateRange({ from, to });
                      }}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-500/20 font-semibold text-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      ดูรายงาน
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Loading Skeleton ── */}
        {isPending && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        )}

        {/* ── Report Content ── */}
        {!isPending && reportData && (
          <div className="space-y-5 sm:space-y-6">

            {/* ── KPI Cards (4 cols) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="ยอดขายรวม"
                sublabel="รวมทุกออเดอร์"
                value={formatTHB(reportData.totalSales)}
                icon={DollarSign}
                gradient="bg-gradient-to-br from-blue-600 to-cyan-500"
                ring="shadow-lg shadow-blue-500/20"
                barColor="bg-gradient-to-r from-blue-500 to-cyan-400"
                barWidth="70%"
              />
              <KpiCard
                label="จำนวนออเดอร์"
                sublabel="ทั้งหมดในช่วงเวลา"
                value={formatNumber(reportData.totalOrders)}
                sub={<span className="text-xs text-slate-500">รายการ</span>}
                icon={ShoppingCart}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                ring="shadow-lg shadow-emerald-500/20"
                barColor="bg-gradient-to-r from-emerald-500 to-teal-400"
                barWidth="55%"
              />
              <KpiCard
                label="เฉลี่ยต่อออเดอร์"
                sublabel="มูลค่าเฉลี่ย"
                value={formatTHB(reportData.avgOrderValue)}
                icon={Target}
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                ring="shadow-lg shadow-amber-500/20"
                barColor="bg-gradient-to-r from-amber-500 to-orange-400"
                barWidth="60%"
              />
              <KpiCard
                label="การเติบโต"
                sublabel="เทียบช่วงก่อนหน้า"
                value={`${reportData.growthPercentage >= 0 ? "+" : ""}${reportData.growthPercentage.toFixed(1)}%`}
                sub={<GrowthBadge pct={reportData.growthPercentage} />}
                icon={reportData.growthPercentage >= 0 ? TrendingUp : TrendingDown}
                gradient={
                  reportData.growthPercentage >= 0
                    ? "bg-gradient-to-br from-purple-600 to-fuchsia-500"
                    : "bg-gradient-to-br from-red-500 to-rose-500"
                }
                ring={
                  reportData.growthPercentage >= 0
                    ? "shadow-lg shadow-purple-500/20"
                    : "shadow-lg shadow-red-500/20"
                }
                barColor={
                  reportData.growthPercentage >= 0
                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-400"
                    : "bg-gradient-to-r from-red-500 to-rose-400"
                }
                barWidth={`${Math.min(Math.abs(reportData.growthPercentage), 100)}%`}
              />
            </div>

            {/* ── Insights Bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Best Month */}
              <Card className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
                    <Star className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">เดือนขายดีที่สุด</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {reportData.bestSellingMonth.month || "–"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTHB(reportData.bestSellingMonth.sales)} · {reportData.bestSellingMonth.orders} ออเดอร์
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Best Day of Week */}
              <Card className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-cyan-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-blue-500/15 ring-1 ring-blue-500/20">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">วันขายดีที่สุด</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      วัน{reportData.bestSellingDay.dayOfWeek || "–"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTHB(reportData.bestSellingDay.sales)} · {reportData.bestSellingDay.orders} ออเดอร์
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Best Quarter */}
              <Card className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">ไตรมาสขายดีที่สุด</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {bestQuarter?.quarter || "–"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bestQuarter ? formatTHB(bestQuarter.sales) : "–"} · {bestQuarter?.percentage.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-1.5 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm flex flex-wrap gap-1">
                {[
                  { value: "overview", label: "ภาพรวม", icon: BarChart3 },
                  { value: "daily", label: "รายวัน", icon: Calendar },
                  { value: "monthly", label: "รายเดือน", icon: Activity },
                  { value: "seasonality", label: "ไตรมาส", icon: Sun },
                  { value: "region", label: "ภูมิภาค", icon: MapPin },
                ].map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600
                      hover:bg-slate-50
                      data-[state=active]:text-white
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500
                      data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/30
                      transition-all gap-1.5 flex items-center"
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ════ TAB: OVERVIEW ════ */}
              <TabsContent value="overview" className="mt-5 space-y-5">

                {/* Area Chart – Daily Trend */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      แนวโน้มยอดขายรายวัน
                    </CardTitle>
                    <CardDescription>ยอดขาย (THB) และจำนวนออเดอร์ตามวัน</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[320px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={reportData.dailyData}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis
                            yAxisId="sales"
                            tickFormatter={formatShortTHB}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="orders"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(value: number, name: string) =>
                              name === "ยอดขาย"
                                ? [formatTHB(value), name]
                                : [formatNumber(value), name]
                            }
                          />
                          <Legend />
                          <Area
                            yAxisId="sales"
                            type="monotone"
                            dataKey="sales"
                            name="ยอดขาย"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            fill="url(#salesGrad)"
                          />
                          <Line
                            yAxisId="orders"
                            type="monotone"
                            dataKey="orders"
                            name="ออเดอร์"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom row: Pie + Insight cards */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                  {/* Donut Chart – Quarterly */}
                  <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm lg:col-span-3">
                    <CardHeader className="border-b border-slate-100 pb-3">
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        สัดส่วนยอดขายตามไตรมาส
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.seasonalityData.filter((d) => d.percentage > 0)}
                              dataKey="sales"
                              nameKey="quarter"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              innerRadius={68}
                              paddingAngle={3}
                              labelLine={false}
                              label={({ quarter, percentage }) =>
                                `${quarter}: ${percentage.toFixed(1)}%`
                              }
                            >
                              {reportData.seasonalityData
                                .filter((d) => d.percentage > 0)
                                .map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number) => [formatTHB(v), "ยอดขาย"]}
                              contentStyle={chartTooltipStyle}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right: Seasonality Table + Growth */}
                  <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* Quarterly breakdown bars */}
                    <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm flex-1">
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-900">
                          รายละเอียดไตรมาส
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {reportData.seasonalityData.map((q, i) => (
                          <div key={q.quarter} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                {q.quarter}
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 text-xs">{formatTHB(q.sales)}</span>
                                <span className="text-slate-400 ml-1">({q.percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${q.percentage}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400">{q.orders} ออเดอร์</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                  </div>
                </div>
              </TabsContent>

              {/* ════ TAB: DAILY ════ */}
              <TabsContent value="daily" className="mt-5 space-y-5">
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      ยอดขายรายวัน
                    </CardTitle>
                    <CardDescription>แท่งยอดขายแต่ละวันในช่วงเวลาที่เลือก</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[360px] sm:h-[440px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.dailyData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis
                            tickFormatter={formatShortTHB}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(value: number, _n: string, p: any) => {
                              const k = p?.dataKey;
                              return [
                                k === "sales" ? formatTHB(value) : formatNumber(value),
                                k === "sales" ? "ยอดขาย" : "ออเดอร์",
                              ];
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="sales"
                            name="ยอดขาย"
                            fill="#2563eb"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Table */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      ตารางข้อมูลรายวัน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="text-xs">วันที่</TableHead>
                            <TableHead className="text-right text-xs">ยอดขาย</TableHead>
                            <TableHead className="text-right text-xs">ออเดอร์</TableHead>
                            <TableHead className="text-right text-xs">เฉลี่ย/ออเดอร์</TableHead>
                            <TableHead className="text-right text-xs w-32">สัดส่วน</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.dailyData
                            .filter((d) => d.sales > 0)
                            .map((day, idx) => {
                              const pct = reportData.totalSales > 0
                                ? (day.sales / reportData.totalSales) * 100
                                : 0;
                              return (
                                <TableRow key={idx} className="hover:bg-slate-50/70">
                                  <TableCell className="font-medium text-sm">{day.date}</TableCell>
                                  <TableCell className="text-right font-semibold text-sm">
                                    {formatTHB(day.sales)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatNumber(day.orders)}
                                  </TableCell>
                                  <TableCell className="text-right text-slate-600 text-sm">
                                    {day.orders > 0 ? formatTHB(day.sales / day.orders) : "–"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-slate-500 w-8 text-right">
                                        {pct.toFixed(1)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ TAB: MONTHLY ════ */}
              <TabsContent value="monthly" className="mt-5 space-y-5">
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      ยอดขายรายเดือน
                    </CardTitle>
                    <CardDescription>เปรียบเทียบยอดขายและออเดอร์แต่ละเดือน</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[380px] sm:h-[460px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={reportData.monthlyData}>
                          <defs>
                            <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis
                            yAxisId="sales"
                            tickFormatter={formatShortTHB}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="orders"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(v: number, name: string) =>
                              name === "ยอดขาย" ? [formatTHB(v), name] : [formatNumber(v), name]
                            }
                          />
                          <Legend />
                          <Bar
                            yAxisId="sales"
                            dataKey="sales"
                            name="ยอดขาย"
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                            opacity={0.85}
                          />
                          <Line
                            yAxisId="orders"
                            type="monotone"
                            dataKey="orders"
                            name="ออเดอร์"
                            stroke="#8b5cf6"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#8b5cf6" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Table */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      ตารางข้อมูลรายเดือน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">เดือน</TableHead>
                          <TableHead className="text-right text-xs">ยอดขาย</TableHead>
                          <TableHead className="text-right text-xs">ออเดอร์</TableHead>
                          <TableHead className="text-right text-xs">เฉลี่ย/ออเดอร์</TableHead>
                          <TableHead className="text-right text-xs">% ของรวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.monthlyData.map((m, i) => {
                          const pct = reportData.totalSales > 0
                            ? (m.sales / reportData.totalSales) * 100
                            : 0;
                          const avg = m.orders > 0 ? m.sales / m.orders : 0;
                          return (
                            <TableRow key={i} className="hover:bg-slate-50/70">
                              <TableCell className="text-slate-400 text-xs w-8">{i + 1}</TableCell>
                              <TableCell className="font-semibold text-sm">{m.month}</TableCell>
                              <TableCell className="text-right font-bold text-sm text-blue-700">
                                {formatTHB(m.sales)}
                              </TableCell>
                              <TableCell className="text-right text-sm">{formatNumber(m.orders)}</TableCell>
                              <TableCell className="text-right text-slate-600 text-sm">
                                {formatTHB(avg)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold bg-slate-50"
                                >
                                  {pct.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ TAB: SEASONALITY ════ */}
              <TabsContent value="seasonality" className="mt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportData.seasonalityData.map((q, i) => (
                    <Card
                      key={q.quarter}
                      className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-slate-800">{q.quarter}</span>
                          <Badge
                            className="text-[10px] font-bold"
                            style={{
                              backgroundColor: `${COLORS[i % COLORS.length]}20`,
                              color: COLORS[i % COLORS.length],
                              borderColor: `${COLORS[i % COLORS.length]}40`,
                            }}
                          >
                            {q.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <p
                          className="text-2xl font-bold tracking-tight"
                          style={{ color: COLORS[i % COLORS.length] }}
                        >
                          {formatTHB(q.sales)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{formatNumber(q.orders)} ออเดอร์</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          เฉลี่ย {q.orders > 0 ? formatTHB(q.sales / q.orders) : "–"}/ออเดอร์
                        </p>
                        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${q.percentage}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quarterly Bar Chart */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      เปรียบเทียบยอดขายรายไตรมาส
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.seasonalityData} barCategoryGap="40%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="quarter" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis
                            tickFormatter={formatShortTHB}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(v: number) => [formatTHB(v), "ยอดขาย"]}
                          />
                          <Bar dataKey="sales" name="ยอดขาย" radius={[8, 8, 0, 0]}>
                            {reportData.seasonalityData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ TAB: REGION ════ */}
              <TabsContent value="region" className="mt-5 space-y-5">

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reportData.salesByRegion.slice(0, 4).map((r, i) => (
                    <Card key={r.region} className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="text-xs font-semibold text-slate-600 truncate">{r.region}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{formatShortTHB(r.totalSales)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatNumber(r.orderCount)} ออเดอร์</p>
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: totalRegionSales > 0
                                ? `${(r.totalSales / totalRegionSales) * 100}%`
                                : "0%",
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Region Bar Chart */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      ยอดขายตามภูมิภาค
                    </CardTitle>
                    <CardDescription>เรียงตามยอดขายสูงสุด</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reportData.salesByRegion}
                          layout="vertical"
                          margin={{ left: 100 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={formatShortTHB}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="region"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={95}
                          />
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(v: number) => [formatTHB(v), "ยอดขาย"]}
                          />
                          <Bar dataKey="totalSales" name="ยอดขาย" radius={[0, 6, 6, 0]}>
                            {reportData.salesByRegion.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Region Table */}
                <Card className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      รายละเอียดตามภูมิภาค
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="text-xs">อันดับ</TableHead>
                          <TableHead className="text-xs">ภูมิภาค</TableHead>
                          <TableHead className="text-right text-xs">ยอดขาย</TableHead>
                          <TableHead className="text-right text-xs">ออเดอร์</TableHead>
                          <TableHead className="text-right text-xs">เฉลี่ย/ออเดอร์</TableHead>
                          <TableHead className="text-right text-xs">% ของรวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.salesByRegion.map((r, i) => {
                          const pct = totalRegionSales > 0
                            ? (r.totalSales / totalRegionSales) * 100
                            : 0;
                          const avg = r.orderCount > 0 ? r.totalSales / r.orderCount : 0;
                          return (
                            <TableRow key={r.region} className="hover:bg-slate-50/70">
                              <TableCell>
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                >
                                  {i + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium text-slate-800 text-sm">{r.region}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-sm text-blue-700">
                                {formatTHB(r.totalSales)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatNumber(r.orderCount)}
                              </TableCell>
                              <TableCell className="text-right text-slate-600 text-sm">
                                {formatTHB(avg)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: COLORS[i % COLORS.length],
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-8 text-right">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isPending && !reportData && (
          <Card className="rounded-2xl border bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-5">
                <BarChart3 className="h-14 w-14 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">เลือกช่วงเวลาและกดดูรายงาน</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                เลือกช่วงวันที่ที่ต้องการ หรือกดปุ่มช่วงเวลาด่วน แล้วกด &quot;ดูรายงาน&quot; เพื่อวิเคราะห์ยอดขาย
              </p>
              <Button
                onClick={handleFetchReport}
                disabled={isPending}
                className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-500/20 px-8"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                ดูรายงานทันที
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
