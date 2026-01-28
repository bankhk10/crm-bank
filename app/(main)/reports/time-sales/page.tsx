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
import { th } from "date-fns/locale";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  BarChart3,
  Sun,
  Loader2,
  MapPin,
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
} from "recharts";
import {
  getTimeSalesReport,
  type TimeSalesReportData,
  type DateRangeFilter,
} from "@/app/actions/reports";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
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

export default function TimeSalesReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<TimeSalesReportData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getTimeSalesReport(filter);
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

  const formatPercent = (num: number) => {
    return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`;
  };

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
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              รายงานยอดขาย
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              วิเคราะห์ยอดขายรายวัน รายเดือน รายปี
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
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                {filtersOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 ${
                filtersOpen ? "block" : "hidden"
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
                      className="h-9 text-xs w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                        ยอดขายรวม
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        {formatTHB(reportData.totalSales)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        จำนวนออเดอร์
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        {formatNumber(reportData.totalOrders)}
                      </p>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        รายการ
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-50">
                      <ShoppingCart className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        เฉลี่ยต่อออเดอร์
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                        {formatTHB(reportData.avgOrderValue)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-amber-50">
                      <BarChart3 className="h-6 w-6 text-amber-600" />
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
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ภาพรวม
                </TabsTrigger>
                <TabsTrigger
                  value="daily"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  รายวัน
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  รายเดือน
                </TabsTrigger>
                <TabsTrigger
                  value="seasonality"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ฤดูกาล
                </TabsTrigger>
                <TabsTrigger
                  value="by-region"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ตามภูมิภาค
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Daily Trend */}
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        แนวโน้มยอดขายรายวัน
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportData.dailyData}>
                            <defs>
                              <linearGradient
                                id="salesGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatTHB(value),
                                "ยอดขาย",
                              ]}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="sales"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#salesGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Container หลักที่แบ่งเป็น 2 คอลัมน์เมื่อจอใหญ่ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
                  {/* ฝั่งซ้าย: Seasonality Pie */}
                  <Card className="rounded-2xl border bg-white/70 shadow-sm lg:col-span-2 h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        สัดส่วนยอดขายตามไตรมาส
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.seasonalityData.filter(
                                (d) => d.percentage > 0,
                              )}
                              dataKey="sales"
                              nameKey="quarter"
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              innerRadius={80}
                              label={({ quarter, percentage }) =>
                                `${quarter}: ${percentage.toFixed(1)}%`
                              }
                            >
                              {reportData.seasonalityData
                                .filter((d) => d.percentage > 0)
                                .map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                formatTHB(value),
                                "ยอดขาย",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ฝั่งขวา: Best Selling Info (วางซ้อนกันแนวตั้งในคอลัมน์ขวา) */}
                  <div className="flex flex-col gap-4">
                    <Card className="rounded-2xl border bg-white/70 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                            <Sun className="h-5 w-5 text-emerald-600" />
                          </div>
                          <h3 className="font-semibold">เดือนขายดีที่สุด</h3>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">
                          {reportData.bestSellingMonth.month}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTHB(reportData.bestSellingMonth.sales)} (
                          {reportData.bestSellingMonth.orders} ออเดอร์)
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border bg-white/70 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                          </div>
                          <h3 className="font-semibold">การเติบโต</h3>
                        </div>
                        <p
                          className={`text-2xl font-bold ${reportData.growthPercentage >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {formatPercent(reportData.growthPercentage)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          เทียบกับช่วงก่อนหน้า
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="daily" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>ยอดขายรายวัน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[550px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.dailyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(
                              value: number,
                              name: string,
                              props: any,
                            ) => {
                              const key = props?.dataKey;

                              return [
                                key === "sales"
                                  ? formatTHB(value)
                                  : formatNumber(value),
                                key === "sales" ? "ยอดขาย" : "ออเดอร์",
                              ];
                            }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="sales"
                            fill="#3b82f6"
                            name="ยอดขาย"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Daily Table: mobile cards, sm+ table */}
                    <div className="mt-6">
                      <div className="space-y-3 sm:hidden">
                        {reportData.dailyData
                          .filter((d) => d.sales > 0)
                          .map((day, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border bg-white/80 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">
                                  {day.date}
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                  {formatTHB(day.sales)}
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                                <div>ออเดอร์: {formatNumber(day.orders)}</div>
                                <div>
                                  เฉลี่ย:{" "}
                                  {day.orders > 0
                                    ? formatTHB(day.sales / day.orders)
                                    : "-"}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="hidden sm:block max-h-96 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>วันที่</TableHead>
                              <TableHead className="text-right">
                                ยอดขาย
                              </TableHead>
                              <TableHead className="text-right">
                                จำนวนออเดอร์
                              </TableHead>
                              <TableHead className="text-right">
                                เฉลี่ย/ออเดอร์
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.dailyData
                              .filter((d) => d.sales > 0)
                              .map((day, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">
                                    {day.date}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatTHB(day.sales)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatNumber(day.orders)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {day.orders > 0
                                      ? formatTHB(day.sales / day.orders)
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>ยอดขายรายเดือน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[550px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.monthlyData}>
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
                            formatter={(
                              value: number,
                              name: string,
                              props: any,
                            ) => {
                              const key = props?.dataKey;

                              return [
                                key === "sales"
                                  ? formatTHB(value)
                                  : formatNumber(value),
                                key === "sales" ? "ยอดขาย" : "ออเดอร์",
                              ];
                            }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="sales"
                            fill="#10b981"
                            name="ยอดขาย"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="orders"
                            fill="#8b5cf6"
                            name="ออเดอร์"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seasonality" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>สัดส่วนยอดขาย</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.seasonalityData.map((quarter, idx) => (
                          <div key={quarter.quarter} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {quarter.quarter}
                              </span>
                              <span className="text-muted-foreground">
                                {formatTHB(quarter.sales)} (
                                {quarter.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${quarter.percentage}%`,
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="by-region" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      ตามภูมิภาค
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.salesByRegion}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                          <YAxis
                            tickFormatter={(v) =>
                              `${(v / 1000000).toFixed(1)}M`
                            }
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              formatTHB(value),
                              "ยอดขาย",
                            ]}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Bar
                            dataKey="totalSales"
                            name="ยอดขาย"
                            radius={[4, 4, 0, 0]}
                          >
                            {reportData.salesByRegion.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6">
                      <div className="space-y-3 sm:hidden">
                        {reportData.salesByRegion.map((region, i) => (
                          <div
                            key={region.region}
                            className="rounded-xl border bg-white/80 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: COLORS[i % COLORS.length],
                                  }}
                                />
                                {region.region}
                              </div>
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatTHB(region.totalSales)}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              ออเดอร์: {formatNumber(region.orderCount)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ภูมิภาค</TableHead>
                              <TableHead className="text-right">
                                ออเดอร์
                              </TableHead>
                              <TableHead className="text-right">
                                ยอดขาย
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.salesByRegion.map((r, i) => (
                              <TableRow key={r.region}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          COLORS[i % COLORS.length],
                                      }}
                                    />
                                    {r.region}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(r.orderCount)}
                                </TableCell>
                                <TableCell className="text-right text-emerald-600 font-semibold">
                                  {formatTHB(r.totalSales)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
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
