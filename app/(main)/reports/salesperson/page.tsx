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
  UserCheck,
  ArrowLeft,
  BarChart3,
  Loader2,
  Award,
  Package,
  Layers,
  TrendingUp,
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
  getSalespersonSalesReport,
  type SalespersonReportData,
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
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "3 เดือน",
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export default function SalespersonReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<SalespersonReportData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("performance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getSalespersonSalesReport(filter);
      setReportData(data);
    });
  };

  const formatTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(n);
  const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);
  const totalSales =
    reportData?.salespersonPerformance.reduce((s, p) => s + p.totalSales, 0) ||
    0;
  const totalOrders =
    reportData?.salespersonPerformance.reduce((s, p) => s + p.orderCount, 0) ||
    0;

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
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
              <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานตามพนักงานขาย
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              ยอดขาย, ออเดอร์, กลุ่มสินค้า, สินค้าที่ขายได้
            </p>
          </div>
        </div>

        {/* Filters: mobile collapsible, sm=2 cols, lg=3 cols */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ตัวกรองช่วงเวลา
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
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
                    onSelect={(r) =>
                      r?.from && r?.to && setDateRange({ from: r.from, to: r.to })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  ช่วงเวลาแนะนำ
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                      onClick={() => setDateRange(r.getValue())}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-500 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      โหลด...
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

        <div>
          {isPending ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-80 sm:h-96 rounded-2xl" />
            </div>
          ) : reportData ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          พนักงานขายดีที่สุด
                        </p>
                        <p className="text-base sm:text-lg font-bold mt-1 text-slate-900">
                          {reportData.topSalesperson.name}
                        </p>
                        <p className="text-xs sm:text-sm text-rose-600 mt-1">
                          {formatTHB(reportData.topSalesperson.sales)}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-rose-50">
                        <Award className="h-6 w-6 text-rose-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          ยอดขายรวม
                        </p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                          {formatTHB(totalSales)}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          ออเดอร์รวม
                        </p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                          {formatNumber(totalOrders)}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-emerald-50">
                        <Package className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          จำนวนพนักงาน
                        </p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                          {reportData.salespersonPerformance.length}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-xl bg-purple-50">
                        <UserCheck className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl h-auto grid grid-cols-2 sm:flex gap-2 sm:gap-0">
                <TabsTrigger
                  value="performance"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ผลงาน
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  กลุ่มสินค้า
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  สินค้า
                </TabsTrigger>
                <TabsTrigger
                  value="trend"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  แนวโน้ม
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>ยอดขายต่อพนักงาน</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={reportData.salespersonPerformance
                              .slice(0, 10)
                              .map((p) => ({
                                name: p.name.slice(0, 12),
                                sales: p.totalSales,
                              }))}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={100}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(v: number) => [
                                formatTHB(v),
                                "ยอดขาย",
                              ]}
                            />
                            <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                              {reportData.salespersonPerformance
                                .slice(0, 10)
                                .map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={COLORS[i % COLORS.length]}
                                  />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>รายละเอียด</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[450px] overflow-auto">
                        <div className="overflow-x-auto">
                          <Table className="min-w-[640px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>พนักงาน</TableHead>
                              <TableHead className="text-right">
                                ยอดขาย
                              </TableHead>
                              <TableHead className="text-right">
                                ออเดอร์
                              </TableHead>
                              <TableHead className="text-right">
                                ลูกค้า
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.salespersonPerformance.map((p, i) => (
                              <TableRow key={p.id}>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      i < 3 ? "bg-rose-100 text-rose-800" : ""
                                    }
                                  >
                                    {i + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {p.employeeCode}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                  {formatTHB(p.totalSales)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {p.orderCount}
                                </TableCell>
                                <TableCell className="text-right">
                                  {p.customerCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="groups" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-500" />
                      กลุ่มสินค้าที่ขายได้ต่อพนักงาน
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reportData.salespersonProductGroups
                        .slice(0, 5)
                        .map((sp, idx) => (
                          <div
                            key={sp.salespersonId}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Badge
                                style={{
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                                className="text-white"
                              >
                                {idx + 1}
                              </Badge>
                              <span className="font-semibold">
                                {sp.salespersonName}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sp.groups.slice(0, 6).map((g, gi) => (
                                <Badge
                                  key={g.group}
                                  variant="outline"
                                  className="py-1.5 px-3"
                                >
                                  <span className="mr-2">{g.group}</span>
                                  <span className="font-semibold text-emerald-600">
                                    {formatTHB(g.sales)}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      สินค้าที่ขายได้ต่อพนักงาน (Top 5)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reportData.salespersonProducts
                        .slice(0, 5)
                        .map((sp, idx) => (
                          <div
                            key={sp.salespersonId}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Badge
                                style={{
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                                className="text-white"
                              >
                                {idx + 1}
                              </Badge>
                              <span className="font-semibold">
                                {sp.salespersonName}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <Table className="min-w-[420px]">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>สินค้า</TableHead>
                                    <TableHead className="text-right">
                                      ยอดขาย
                                    </TableHead>
                                    <TableHead className="text-right">
                                      จำนวน
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sp.products.map((p) => (
                                    <TableRow key={p.productId}>
                                      <TableCell className="font-medium">
                                        {p.productName}
                                      </TableCell>
                                      <TableCell className="text-right text-emerald-600">
                                        {formatTHB(p.sales)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatNumber(p.quantity)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>แนวโน้มยอดขายรายเดือน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[550px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.salespersonMonthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis
                            tickFormatter={(v) =>
                              `${(v / 1000000).toFixed(1)}M`
                            }
                          />
                          <Tooltip
                            formatter={(v: number) => [formatTHB(v), ""]}
                          />
                          <Legend />
                          {reportData.salespersonPerformance
                            .slice(0, 5)
                            .map((sp, i) => (
                              <Line
                                key={sp.id}
                                type="monotone"
                                dataKey={(d: {
                                  salespeople: { id: string; sales: number }[];
                                }) =>
                                  d.salespeople.find((s) => s.id === sp.id)
                                    ?.sales || 0
                                }
                                name={sp.name}
                                stroke={COLORS[i % COLORS.length]}
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
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
