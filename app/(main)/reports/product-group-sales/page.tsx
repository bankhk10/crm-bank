"use client";

import { useId, useState, useTransition } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Layers,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  Loader2,
  Award,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import {
  getProductGroupSalesReportAction,
  type ProductGroupSalesReportData,
  type DateRangeFilter,
} from "@/modules/reports";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const quickDateRanges = [
  {
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "3 เดือนล่าสุด",
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "6 เดือนล่าสุด",
    getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export default function ProductGroupSalesReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] =
    useState<ProductGroupSalesReportData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getProductGroupSalesReportAction(filter);
      setReportData(data);
    });
  };

  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("th-TH").format(num);
  };

  const sortedGroups =
    reportData?.groupPerformance.sort((a, b) => b.totalSales - a.totalSales) ||
    [];



  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header: mobile stack, sm row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              รายงานตามกลุ่มสินค้า
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              กลุ่มสินค้าขายดี / ขายช้า, ยอดขายต่อกลุ่ม, ช่วงเวลาขายดี
            </p>
          </div>
        </div>

        {/* Filters: mobile collapsible, sm=2 cols, lg=3 cols */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ตัวกรองช่วงเวลา
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                {filtersOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 ${filtersOpen ? "block" : "hidden"
                } sm:block`}
            >
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  เลือกช่วงเวลา
                </label>
                <div className="h-11">
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  ช่วงเวลาแนะนำ
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {quickDateRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        const { from, to } = range.getValue();
                        setDateRange({ from, to });
                      }}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="w-full h-11 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
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

        {/* Report Content */}
        {isPending ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 sm:h-96 rounded-2xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards: mobile=1 col, sm=2 cols, lg=3 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        กลุ่มสินค้าขายดีที่สุด
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {reportData.topGroup.group}
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-600 mt-1">
                        {formatTHB(reportData.topGroup.sales)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-50">
                      <Award className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        กลุ่มสินค้าขายช้าที่สุด
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {reportData.worstGroup.group}
                      </p>
                      <p className="text-xs sm:text-sm text-amber-600 mt-1">
                        {formatTHB(reportData.worstGroup.sales)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-amber-50">
                      <TrendingDown className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        จำนวนกลุ่มสินค้า
                      </p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                        {reportData.groupPerformance.length}
                      </p>
                      <p className="text-xs sm:text-sm text-purple-600 mt-1">
                        กลุ่มที่มียอดขาย
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-purple-50">
                      <Layers className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl h-auto grid grid-cols-2 sm:flex gap-2 sm:gap-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ภาพรวม
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ผลงานกลุ่ม
                </TabsTrigger>
                <TabsTrigger
                  value="trend"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  แนวโน้มรายเดือน
                </TabsTrigger>
                <TabsTrigger
                  value="peak"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ช่วงเวลาขายดี
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Bar Chart */}
                  {/* Bar Chart (Modern) */}
                  <Card className="rounded-2xl border border-slate-200/70 bg-white/70 shadow-[0_10px_30px_-12px_rgba(2,6,23,0.18)] backdrop-blur-md overflow-hidden">
                    {/* Header */}
                    <CardHeader className="relative border-b border-slate-200/60 bg-gradient-to-r from-white/70 via-white/40 to-purple-50/60">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
                        <div className="absolute -bottom-16 -left-14 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
                      </div>

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/20">
                              <BarChart3 className="h-4.5 w-4.5 text-white" />
                            </div>
                            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                              ยอดขายตามกลุ่มสินค้า
                            </CardTitle>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500">
                            เปรียบเทียบยอดขายรวมแต่ละกลุ่ม (เรียงจากมากไปน้อย)
                          </p>
                        </div>

                        {/* Quick Top chips */}
                        {sortedGroups.length > 0 && (
                          <div className="hidden md:flex items-center gap-2">
                            {sortedGroups.slice(0, 4).map((g, i) => (
                              <div
                                key={g.group}
                                className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        COLORS[i % COLORS.length],
                                    }}
                                  />
                                  <span className="text-xs font-semibold text-slate-700">
                                    {g.group}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs font-semibold text-emerald-700">
                                  {formatTHB(g.totalSales)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6">
                      {/* Mobile top list */}
                      {sortedGroups.length > 0 && (
                        <div className="md:hidden mb-4 grid grid-cols-1 gap-2">
                          {sortedGroups.slice(0, 3).map((g, i) => (
                            <div
                              key={g.group}
                              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: COLORS[i % COLORS.length],
                                  }}
                                />
                                <span className="text-xs font-semibold text-slate-700 truncate">
                                  #{i + 1} {g.group}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-700">
                                {formatTHB(g.totalSales)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="h-[420px] sm:h-[460px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={sortedGroups}
                            layout="vertical"
                            margin={{ top: 8, right: 18, bottom: 8, left: 10 }}
                            barCategoryGap={10}
                          >
                            <CartesianGrid
                              strokeDasharray="6 6"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(v) =>
                                `${(v / 1_000_000).toFixed(1)}M`
                              }
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="group"
                              width={110}
                              tick={{ fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip
                              cursor={{ fill: "rgba(2,6,23,0.04)" }}
                              formatter={(value: number) => [
                                formatTHB(value),
                                "ยอดขาย",
                              ]}
                              contentStyle={{
                                borderRadius: "16px",
                                border: "1px solid rgba(226,232,240,0.9)",
                                boxShadow: "0 18px 55px rgba(2,6,23,0.14)",
                                background: "rgba(255,255,255,0.92)",
                                backdropFilter: "blur(8px)",
                                padding: "10px 12px",
                              }}
                              labelStyle={{ color: "#334155", fontWeight: 700 }}
                              itemStyle={{ color: "#0f172a" }}
                            />

                            {/* ✅ ใช้ Cell เพื่อไล่สีทีละแท่ง (แทนการซ้อน Bar) */}
                            <Bar
                              dataKey="totalSales"
                              radius={[10, 10, 10, 10]}
                              maxBarSize={38}
                            >
                              {sortedGroups.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Footer hint */}
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 items-center rounded-full border border-slate-200/70 bg-white/70 px-2">
                            Tip
                          </span>
                          <span>
                            ชี้เมาส์ที่แท่งกราฟเพื่อดูยอดขายแบบละเอียด
                          </span>
                        </div>
                        <div className="text-slate-400">
                          แสดงผลตามช่วงวันที่ที่เลือก
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ผลงานแต่ละกลุ่มสินค้า
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[760px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>ลำดับ</TableHead>
                            <TableHead>กลุ่มสินค้า</TableHead>
                            <TableHead className="text-right">ยอดขาย</TableHead>
                            <TableHead className="text-right">
                              จำนวนที่ขาย
                            </TableHead>
                            <TableHead className="text-right">
                              จำนวนออเดอร์
                            </TableHead>
                            <TableHead className="text-right">
                              จำนวนสินค้า
                            </TableHead>
                            <TableHead className="text-right">
                              เฉลี่ย/สินค้า
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedGroups.map((group, idx) => (
                            <TableRow key={group.group}>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    idx < 3
                                      ? "bg-purple-100 text-purple-800 border-purple-300"
                                      : ""
                                  }
                                >
                                  {idx + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {group.group}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-emerald-600">
                                {formatTHB(group.totalSales)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(group.totalQuantity)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(group.orderCount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {group.productCount}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatTHB(group.avgSalesPerProduct)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      แนวโน้มยอดขายรายเดือนแต่ละกลุ่ม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[550px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.groupMonthlyTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis
                            tickFormatter={(v) =>
                              `${(v / 1000000).toFixed(1)}M`
                            }
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              formatTHB(value),
                              "",
                            ]}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          {reportData.groupPerformance
                            .slice(0, 6)
                            .map((group, idx) => (
                              <Line
                                key={group.group}
                                type="monotone"
                                dataKey={(data) =>
                                  data.groups.find(
                                    (g: { group: string }) =>
                                      g.group === group.group,
                                  )?.sales || 0
                                }
                                name={group.group}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="peak" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      ช่วงเวลาขายดีที่สุดของแต่ละกลุ่ม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reportData.groupPeakPeriods.map((item, idx) => (
                        <Card
                          key={item.group}
                          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-3 h-3 rounded-full mt-1.5"
                                style={{
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-semibold">{item.group}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {item.peakMonth}
                                  </Badge>
                                  <span className="text-sm font-semibold text-emerald-600">
                                    {formatTHB(item.sales)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Layers className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                กรุณาเลือกช่วงวันที่ที่ต้องการแล้วกดปุ่ม &quot;ดูรายงาน&quot;
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
