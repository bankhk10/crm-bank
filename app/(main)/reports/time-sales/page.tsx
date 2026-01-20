"use client";

import { useState, useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  TrendingDown,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  BarChart3,
  Clock,
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
  LineChart,
  Line,
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
    label: "7 วันล่าสุด",
    getValue: () => ({ from: subMonths(new Date(), 0.25), to: new Date() }),
  },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />

        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                รายงานยอดขาย
              </h1>
              <p className="text-muted-foreground text-sm">
                วิเคราะห์ยอดขายรายวัน รายเดือน รายปี และช่วงเวลาขายดี
              </p>
            </div>
          </div>

          {/* Date Range Filter */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[280px]">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    เลือกช่วงเวลา
                  </label>
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

                <div className="flex flex-wrap gap-2">
                  {quickDateRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const { from, to } = range.getValue();
                        setDateRange({ from, to });
                      }}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {isPending ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">ยอดขายรวม</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatTHB(reportData.totalSales)}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-blue-200" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {reportData.growthPercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {formatPercent(reportData.growthPercentage)} vs ก่อนหน้า
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">จำนวนออเดอร์</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(reportData.totalOrders)}
                      </p>
                    </div>
                    <ShoppingCart className="h-10 w-10 text-emerald-200" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
                    <span>รายการ</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">เฉลี่ยต่อออเดอร์</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatTHB(reportData.avgOrderValue)}
                      </p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">
                  ภาพรวม
                </TabsTrigger>
                <TabsTrigger value="daily" className="rounded-lg">
                  รายวัน
                </TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-lg">
                  รายเดือน
                </TabsTrigger>
                <TabsTrigger value="seasonality" className="rounded-lg">
                  ฤดูกาล
                </TabsTrigger>
                <TabsTrigger value="by-region" className="rounded-lg">
                  ตามภูมิภาค
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Trend */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        แนวโน้มยอดขายรายวัน
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
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

                  {/* Seasonality Pie */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        สัดส่วนยอดขายตามไตรมาส
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
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
                              outerRadius={100}
                              innerRadius={60}
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
                </div>

                {/* Best Selling Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
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

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold">การเติบโต</h3>
                      </div>
                      <p
                        className={`text-2xl font-bold ${
                          reportData.growthPercentage >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercent(reportData.growthPercentage)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        เทียบกับช่วงก่อนหน้า
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="daily" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>ยอดขายรายวัน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
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

                    {/* Daily Table */}
                    <div className="mt-6 max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>วันที่</TableHead>
                            <TableHead className="text-right">ยอดขาย</TableHead>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>ยอดขายรายเดือน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>ยอดขายตามไตรมาส</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={reportData.seasonalityData}
                            layout="vertical"
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              type="number"
                              tickFormatter={(v) =>
                                `${(v / 1000000).toFixed(1)}M`
                              }
                            />
                            <YAxis
                              type="category"
                              dataKey="quarter"
                              width={80}
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
                            <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                              {reportData.seasonalityData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
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
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      ตามภูมิภาค
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
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
                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ภูมิภาค</TableHead>
                          <TableHead className="text-right">ออเดอร์</TableHead>
                          <TableHead className="text-right">ยอดขาย</TableHead>
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
                                    backgroundColor: COLORS[i % COLORS.length],
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
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
