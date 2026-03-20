"use client";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailItem } from "@/components/custom/detail-item";


import { useId, useState, useTransition } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import Link from "next/link";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
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
  Area,
  ComposedChart,
  Line,
} from "recharts";
import {
  getTimeSalesReportAction,
  type TimeSalesReportData,
  type DateRangeFilter,
  quickDateRanges,
  formatTHB,
  formatNumber,
  formatShortTHB,
  chartTooltipStyle,
  COLORS as GLOBAL_COLORS,
} from "@/modules/reports";
import { GrowthBadge } from "@/modules/reports/ui/growth-badge";
import { KpiCard } from "@/modules/reports/ui/kpi-card";

// Vibrant color palette for charts
const COLORS = [
  "#dc2626", // Red-600 (Primary)
  "#18181b", // Zinc-950 (Secondary)
  "#3b82f6", // Blue-500
  "#10b981", // Emerald-500
  "#f59e0b", // Amber-500
  "#8b5cf6", // Indigo-500
  "#06b6d4", // Cyan-500
];

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export function TimeSalesDashboard() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [reportData, setReportData] = useState<TimeSalesReportData | null>(null);
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyPerPage, setDailyPerPage] = useState(10);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyPerPage, setMonthlyPerPage] = useState(10);
  const [regionPage, setRegionPage] = useState(1);
  const [regionPerPage, setRegionPerPage] = useState(10);

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
      setDailyPage(1);
      setMonthlyPage(1);
      setRegionPage(1);
    });
  };

  const totalRegionSales = reportData?.salesByRegion.reduce((s, r) => s + r.totalSales, 0) ?? 0;
  // Derived: best quarter
  const bestQuarter = reportData
    ? [...reportData.seasonalityData].sort((a, b) => b.sales - a.sales)[0]
    : null;

  return (
    <div className="min-h-screen pb-12 rounded-3xl">
      <DetailHero
        backUrl="/reports"
        backLabel="หน้ารายงาน"
        title="รายงานยอดขายตามช่วงเวลา"
        icon={<Calendar className="h-8 w-8 text-white" />}
        badges={
          reportData && (
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5 text-[#60A5FA]" />
              {format(dateRange.from, "dd/MM/yyyy")} – {format(dateRange.to, "dd/MM/yyyy")}
            </span>
          )
        }
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* ── Filter Card ── */}
        <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden -py-6">
          <SectionHeader
            title="ตัวกรองช่วงเวลา"
            icon={<Calendar className="h-6 w-6" />}
          />
          <CardContent>
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-2">
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
              className={`mb-4 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap lg:flex-nowrap sm:items-end gap-3 sm:gap-4 ${filtersOpen ? "block" : "hidden"
                } sm:flex`}
            >
              {/* Start Date */}
              <div className="space-y-1.5 w-full sm:w-44">
                <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                  วันที่เริ่ม
                </label>
                <div className="h-10">
                  <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-between text-left font-normal bg-white h-10 px-3 pr-10 relative",
                          !dateRange?.from && "text-muted-foreground"
                        )}
                      >
                        {dateRange?.from ? (
                          <span className="text-sm">
                            {format(dateRange.from, "dd/MM")}/
                            {dateRange.from.getFullYear() + 543}
                          </span>
                        ) : (
                          <span className="text-sm">วันที่เริ่ม</span>
                        )}
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        initialFocus
                        mode="single"
                        selected={dateRange?.from}
                        onSelect={(day) => {
                          if (day) {
                            const newRange = { from: day, to: dateRange.to };
                            if (day > dateRange.to) {
                              newRange.to = day;
                            }
                            setDateRange(newRange);
                          }
                        }}
                        numberOfMonths={1}
                      />
                      <div className="p-3 border-t flex items-center justify-center gap-2 bg-slate-50/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-20"
                          onClick={() => setIsStartOpen(false)}
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-20 bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setIsStartOpen(false)}
                        >
                          ตกลง
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1.5 w-full sm:w-44">
                <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                  วันที่สิ้นสุด
                </label>
                <div className="h-10">
                  <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-between text-left font-normal bg-white h-10 px-3 pr-10 relative",
                          !dateRange?.to && "text-muted-foreground"
                        )}
                      >
                        {dateRange?.to ? (
                          <span className="text-sm">
                            {format(dateRange.to, "dd/MM")}/
                            {dateRange.to.getFullYear() + 543}
                          </span>
                        ) : (
                          <span className="text-sm">วันที่สิ้นสุด</span>
                        )}
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        initialFocus
                        mode="single"
                        selected={dateRange?.to}
                        defaultMonth={dateRange?.to || dateRange?.from}
                        onSelect={(day) => {
                          if (day) {
                            const newRange = { from: dateRange.from, to: day };
                            if (day < dateRange.from) {
                              newRange.from = day;
                            }
                            setDateRange(newRange);
                          }
                        }}
                        numberOfMonths={1}
                      />
                      <div className="p-3 border-t flex items-center justify-center gap-2 bg-slate-50/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-20"
                          onClick={() => setIsEndOpen(false)}
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-20 bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setIsEndOpen(false)}
                        >
                          ตกลง
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Quick ranges */}
              <div className="grid gap-1.5">
                <label className="font-medium text-base text-gray-900 mx-1">
                  ช่วงเวลา
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs px-3 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
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
              <div className="flex items-end gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="flex-1 sm:w-auto h-10 px-6 bg-black hover:bg-gray-800 text-white shadow-md shadow-red-600/20 font-semibold text-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      ตกลง
                    </>
                  )}
                </Button>
                {reportData && (
                  <ClearSearchButton
                    label="ล้าง"
                    onClick={() => {
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      });
                      setReportData(null);
                    }}
                    className="h-10 px-4 min-h-[40px] mb-0"
                    containerClassName="w-auto mt-0"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Loading Skeleton ── */}
        {isPending && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
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
                gradient="bg-zinc-950"
                ring="shadow-lg shadow-zinc-950/20"
                barColor="bg-zinc-950"
                barWidth="70%"
              />
              <KpiCard
                label="จำนวนออเดอร์"
                sublabel="ทั้งหมดในช่วงเวลา"
                value={formatNumber(reportData.totalOrders)}
                sub={<span className="text-xs text-slate-500">รายการ</span>}
                icon={ShoppingCart}
                gradient="bg-red-600"
                ring="shadow-lg shadow-red-600/20"
                barColor="bg-red-600"
                barWidth="55%"
              />
              <KpiCard
                label="เฉลี่ยต่อออเดอร์"
                sublabel="มูลค่าเฉลี่ย"
                value={formatTHB(reportData.avgOrderValue)}
                icon={Target}
                gradient="bg-zinc-800"
                ring="shadow-lg shadow-zinc-800/20"
                barColor="bg-zinc-800"
                barWidth="60%"
              />
              <KpiCard
                label="การเติบโต"
                sublabel="เทียบช่วงก่อนหน้า"
                value={`${reportData.growthPercentage >= 0 ? "+" : ""}${reportData.growthPercentage.toFixed(1)}%`}
                sub={<GrowthBadge pct={reportData.growthPercentage} />}
                icon={reportData.growthPercentage >= 0 ? TrendingUp : TrendingDown}
                gradient="bg-gradient-to-br from-red-600 to-zinc-950"
                ring="shadow-lg shadow-red-600/20"
                barColor="bg-red-600"
                barWidth={`${Math.min(Math.abs(reportData.growthPercentage), 100)}%`}
              />
            </div>

            {/* ── Insights Bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Best Month */}
              <Card className="rounded-xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-red-500/15 ring-1 ring-red-500/20">
                    <Star className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">เดือนขายดีที่สุด</p>
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
              <Card className="rounded-xl border border-zinc-200/60 bg-gradient-to-br from-zinc-50 to-slate-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-zinc-500/15 ring-1 ring-zinc-500/20">
                    <Clock className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">วันขายดีที่สุด</p>
                    <p className="text-base font-bold text-slate-900 truncate">
                      วัน{reportData.bestSellingDay.dayOfWeek || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTHB(reportData.bestSellingDay.sales)} · {reportData.bestSellingDay.orders} ออเดอร์
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Best Quarter */}
              <Card className="rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-red-50/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="shrink-0 grid place-items-center size-10 rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20">
                    <Award className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">ไตรมาสขายดีที่สุด</p>
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
              <TabsList className="h-auto p-1.5 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm flex flex-wrap gap-1">
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
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900
                      data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
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
                              <stop offset="5%" stopColor="#24c143ff" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#24c143ff" stopOpacity={0.01} />
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
                            stroke="#24c143ff"
                            strokeWidth={2.5}
                            fill="url(#salesGrad)"
                          />
                          <Line
                            yAxisId="orders"
                            type="monotone"
                            dataKey="orders"
                            name="ออเดอร์"
                            stroke="#4f4fd0ff"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Seasonality detail list */}
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900">
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
              </TabsContent>

              {/* ════ TAB: DAILY ════ */}
              <TabsContent value="daily" className="mt-5 space-y-5">
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-600" />
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
                            cursor={{ fill: "#f1f5f9", radius: 4 }}
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
                            fill="#24c143ff"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Table */}
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      ตารางข้อมูลรายวัน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md border border-slate-200 shadow-sm bg-white overflow-hidden">
                      <div className="max-h-96 overflow-auto relative">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm transition-all duration-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                              <TableHead className="font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">วันที่</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ยอดขาย</TableHead>
                              <TableHead className="text-center font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">เฉลี่ย/ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap w-36">สัดส่วน</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.dailyData
                              .filter((d) => d.sales > 0)
                              .slice((dailyPage - 1) * dailyPerPage, dailyPage * dailyPerPage)
                              .map((day, idx) => {
                                const pct = reportData.totalSales > 0
                                  ? (day.sales / reportData.totalSales) * 100
                                  : 0;
                                return (
                                  <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                    <TableCell className="font-medium text-slate-600 text-sm py-4 px-4">
                                      {day.date} {day.isoDate ? parseInt(day.isoDate.split("-")[0]) + 543 : ""}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm text-[#24c143ff] py-4 px-4 tabular-nums">
                                      {formatTHB(day.sales)}
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-4">
                                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold min-w-10">
                                        {formatNumber(day.orders)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-500 text-sm py-4 px-4 tabular-nums">
                                      {day.orders > 0 ? formatTHB(day.sales / day.orders) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-4">
                                      <div className="flex items-center justify-end gap-3">
                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                          <div
                                            className="h-full bg-[#24c143ff] rounded-full transition-all duration-700 group-hover:saturate-150"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 w-10 text-right tabular-nums">
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

                      {/* Pagination Control */}
                      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="text-xs">แสดง</span>
                          <Select
                            value={String(dailyPerPage)}
                            onValueChange={(v) => {
                              setDailyPerPage(Number(v));
                              setDailyPage(1);
                            }}
                          >
                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[10, 20, 30, 50].map((size) => (
                                <SelectItem key={size} value={String(size)} className="text-xs">
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs">แถว</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                            disabled={dailyPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-xs font-medium px-2">
                            หน้า {dailyPage} / {Math.max(1, Math.ceil(reportData.dailyData.filter(d => d.sales > 0).length / dailyPerPage))}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setDailyPage((p) => Math.min(Math.ceil(reportData.dailyData.filter(d => d.sales > 0).length / dailyPerPage), p + 1))}
                            disabled={dailyPage >= Math.ceil(reportData.dailyData.filter(d => d.sales > 0).length / dailyPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ TAB: MONTHLY ════ */}
              <TabsContent value="monthly" className="mt-5 space-y-5">
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                              <stop offset="5%" stopColor="#24c143ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#24c143ff" stopOpacity={0} />
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
                            cursor={{ fill: "#f1f5f9", radius: 4 }}
                            formatter={(v: number, name: string) =>
                              name === "ยอดขาย" ? [formatTHB(v), name] : [formatNumber(v), name]
                            }
                          />
                          <Legend />
                          <Bar
                            yAxisId="sales"
                            dataKey="sales"
                            name="ยอดขาย"
                            fill="#24c143ff"
                            radius={[6, 6, 0, 0]}
                            opacity={0.85}
                            activeBar={{ fill: "#94a3b8", opacity: 0.8 }}
                          />
                          <Line
                            yAxisId="orders"
                            type="monotone"
                            dataKey="orders"
                            name="ออเดอร์"
                            stroke="#18181b"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#18181b" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Table */}
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      ตารางข้อมูลรายเดือน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md border border-slate-200 shadow-sm bg-white overflow-hidden">
                      <div className="max-h-96 overflow-auto relative">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm transition-all duration-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                              <TableHead className="font-semibold text-slate-700 h-14 px-4 whitespace-nowrap w-12 text-center">#</TableHead>
                              <TableHead className="font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">เดือน</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ยอดขาย</TableHead>
                              <TableHead className="text-center font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">เฉลี่ย/ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap w-32">% ของรวม</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.monthlyData
                              .slice((monthlyPage - 1) * monthlyPerPage, monthlyPage * monthlyPerPage)
                              .map((m, i) => {
                                const idx = (monthlyPage - 1) * monthlyPerPage + i;
                                const pct = reportData.totalSales > 0
                                  ? (m.sales / reportData.totalSales) * 100
                                  : 0;
                                const avg = m.orders > 0 ? m.sales / m.orders : 0;
                                return (
                                  <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                    <TableCell className="text-slate-400 text-xs font-medium text-center py-4 px-4 italic">{idx + 1}</TableCell>
                                    <TableCell className="font-semibold text-slate-700 text-sm py-4 px-4">{m.month}</TableCell>
                                    <TableCell className="text-right font-bold text-sm text-[#24c143ff] py-4 px-4 tabular-nums">
                                      {formatTHB(m.sales)}
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-4">
                                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold min-w-10">
                                        {formatNumber(m.orders)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-500 text-sm py-4 px-4 tabular-nums">
                                      {formatTHB(avg)}
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-4">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-500 px-2 py-0"
                                      >
                                        {pct.toFixed(1)}%
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination Control */}
                      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="text-xs">แสดง</span>
                          <Select
                            value={String(monthlyPerPage)}
                            onValueChange={(v) => {
                              setMonthlyPerPage(Number(v));
                              setMonthlyPage(1);
                            }}
                          >
                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[10, 20, 30, 50].map((size) => (
                                <SelectItem key={size} value={String(size)} className="text-xs">
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs">แถว</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setMonthlyPage((p) => Math.max(1, p - 1))}
                            disabled={monthlyPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-xs font-medium px-2">
                            หน้า {monthlyPage} / {Math.max(1, Math.ceil(reportData.monthlyData.length / monthlyPerPage))}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setMonthlyPage((p) => Math.min(Math.ceil(reportData.monthlyData.length / monthlyPerPage), p + 1))}
                            disabled={monthlyPage >= Math.ceil(reportData.monthlyData.length / monthlyPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ════ TAB: SEASONALITY ════ */}
              <TabsContent value="seasonality" className="mt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportData.seasonalityData.map((q, i) => (
                    <Card
                      key={q.quarter}
                      className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                    <Card key={r.region} className="rounded-xl border border-slate-200/70 bg-white/80 shadow-sm">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      รายละเอียดตามภูมิภาค
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md border border-slate-200 shadow-sm bg-white overflow-hidden">
                      <div className="max-h-96 overflow-auto relative">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm transition-all duration-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                              <TableHead className="font-semibold text-slate-700 h-14 px-4 whitespace-nowrap w-16 text-center">อันดับ</TableHead>
                              <TableHead className="font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ภูมิภาค</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ยอดขาย</TableHead>
                              <TableHead className="text-center font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap">เฉลี่ย/ออเดอร์</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700 h-14 px-4 whitespace-nowrap w-40">% ของรวม</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.salesByRegion
                              .slice((regionPage - 1) * regionPerPage, regionPage * regionPerPage)
                              .map((r, i) => {
                                const idx = (regionPage - 1) * regionPerPage + i;
                                const pct = totalRegionSales > 0
                                  ? (r.totalSales / totalRegionSales) * 100
                                  : 0;
                                const avg = r.orderCount > 0 ? r.totalSales / r.orderCount : 0;
                                return (
                                  <TableRow key={r.region} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                    <TableCell className="text-center py-4 px-4">
                                      <span
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                      >
                                        {idx + 1}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-4 px-4">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="font-semibold text-slate-700 text-sm">{r.region}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm text-[#24c143ff] py-4 px-4 tabular-nums">
                                      {formatTHB(r.totalSales)}
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-4">
                                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold min-w-10">
                                        {formatNumber(r.orderCount)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-500 text-sm py-4 px-4 tabular-nums">
                                      {formatTHB(avg)}
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-4">
                                      <div className="flex items-center justify-end gap-3 px-1">
                                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                          <div
                                            className="h-full rounded-full transition-all duration-700 group-hover:saturate-150"
                                            style={{
                                              width: `${pct}%`,
                                              backgroundColor: COLORS[idx % COLORS.length],
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 w-10 text-right tabular-nums">
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

                      {/* Pagination Control */}
                      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="text-xs">แสดง</span>
                          <Select
                            value={String(regionPerPage)}
                            onValueChange={(v) => {
                              setRegionPerPage(Number(v));
                              setRegionPage(1);
                            }}
                          >
                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[10, 20, 30, 50].map((size) => (
                                <SelectItem key={size} value={String(size)} className="text-xs">
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs">แถว</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setRegionPage((p) => Math.max(1, p - 1))}
                            disabled={regionPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-xs font-medium px-2">
                            หน้า {regionPage} / {Math.max(1, Math.ceil(reportData.salesByRegion.length / regionPerPage))}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                            onClick={() => setRegionPage((p) => Math.min(Math.ceil(reportData.salesByRegion.length / regionPerPage), p + 1))}
                            disabled={regionPage >= Math.ceil(reportData.salesByRegion.length / regionPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isPending && !reportData && (
          <Card className="rounded-xl border bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-red-500/10 to-zinc-500/10 mb-5">
                <BarChart3 className="h-14 w-14 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">เลือกช่วงเวลาและกดดูรายงาน</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                เลือกช่วงวันที่ที่ต้องการ หรือกดปุ่มช่วงเวลาด่วน แล้วกด &quot;ดูรายงาน&quot; เพื่อวิเคราะห์ยอดขาย
              </p>
              <Button
                onClick={handleFetchReport}
                disabled={isPending}
                className="mt-6 bg-gradient-to-r from-red-600 to-zinc-900 hover:from-red-700 hover:to-black shadow-md shadow-red-500/20 px-8"
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
