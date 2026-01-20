"use client";

import { useState, useTransition } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { th } from "date-fns/locale";
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
  TrendingUp,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  getProductGroupSalesReport,
  type ProductGroupSalesReportData,
  type DateRangeFilter,
} from "@/app/actions/reports";

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

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getProductGroupSalesReport(filter);
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

  const radarData =
    reportData?.groupPerformance.map((g) => ({
      group: g.group,
      sales: g.totalSales / 10000, // Scale for radar
      orders: g.orderCount * 100,
      products: g.productCount * 1000,
    })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-violet-500/5" />

        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                รายงานตามกลุ่มสินค้า
              </h1>
              <p className="text-muted-foreground text-sm">
                กลุ่มสินค้าขายดี / ขายช้า, ยอดขายต่อกลุ่ม, ช่วงเวลาขายดี
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
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">
                        กลุ่มสินค้าขายดีที่สุด
                      </p>
                      <p className="text-xl font-bold mt-1">
                        {reportData.topGroup.group}
                      </p>
                    </div>
                    <Award className="h-10 w-10 text-emerald-200" />
                  </div>
                  <div className="mt-4 text-sm text-emerald-100">
                    {formatTHB(reportData.topGroup.sales)}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">
                        กลุ่มสินค้าขายช้าที่สุด
                      </p>
                      <p className="text-xl font-bold mt-1">
                        {reportData.worstGroup.group}
                      </p>
                    </div>
                    <TrendingDown className="h-10 w-10 text-amber-200" />
                  </div>
                  <div className="mt-4 text-sm text-amber-100">
                    {formatTHB(reportData.worstGroup.sales)}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">
                        จำนวนกลุ่มสินค้า
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.groupPerformance.length}
                      </p>
                    </div>
                    <Layers className="h-10 w-10 text-purple-200" />
                  </div>
                  <div className="mt-4 text-sm text-purple-100">
                    กลุ่มที่มียอดขาย
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ภาพรวม
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ผลงานกลุ่ม
                </TabsTrigger>
                <TabsTrigger
                  value="trend"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  แนวโน้มรายเดือน
                </TabsTrigger>
                <TabsTrigger
                  value="peak"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ช่วงเวลาขายดี
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        ยอดขายตามกลุ่มสินค้า
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sortedGroups} layout="vertical">
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
                            <YAxis type="category" dataKey="group" width={80} />
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
                            <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                              {sortedGroups.map((_, index) => (
                                <Bar
                                  key={`bar-${index}`}
                                  dataKey="totalSales"
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Radar Chart */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        เปรียบเทียบกลุ่มสินค้า
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis
                              dataKey="group"
                              tick={{ fontSize: 11 }}
                            />
                            <PolarRadiusAxis />
                            <Radar
                              name="ยอดขาย"
                              dataKey="sales"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.5}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ผลงานแต่ละกลุ่มสินค้า
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      แนวโน้มยอดขายรายเดือนแต่ละกลุ่ม
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
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
                <Card className="border-0 shadow-lg">
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
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Layers className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                กรุณาเลือกช่วงวันที่ที่ต้องการแล้วกดปุ่ม "ดูรายงาน"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
