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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative overflow-hidden border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
              <UserCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">รายงานตามพนักงานขาย</h1>
              <p className="text-muted-foreground text-sm">
                ยอดขาย, ออเดอร์, กลุ่มสินค้า, สินค้าที่ขายได้
              </p>
            </div>
          </div>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[280px]">
                  <label className="text-sm font-medium mb-2 block">
                    เลือกช่วงเวลา
                  </label>
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onSelect={(r) =>
                      r?.from &&
                      r?.to &&
                      setDateRange({ from: r.from, to: r.to })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(r.getValue())}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="bg-gradient-to-r from-rose-500 to-pink-500"
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {isPending ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-rose-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-rose-100 text-sm">
                        พนักงานขายดีที่สุด
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {reportData.topSalesperson.name}
                      </p>
                    </div>
                    <Award className="h-10 w-10 text-rose-200" />
                  </div>
                  <p className="mt-4 text-sm text-rose-100">
                    {formatTHB(reportData.topSalesperson.sales)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">ยอดขายรวม</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatTHB(totalSales)}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">ออเดอร์รวม</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(totalOrders)}
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">จำนวนพนักงาน</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.salespersonPerformance.length}
                      </p>
                    </div>
                    <UserCheck className="h-10 w-10 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl h-auto">
                <TabsTrigger
                  value="performance"
                  className="rounded-lg py-3 px-6 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ผลงาน
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="rounded-lg py-3 px-6 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  กลุ่มสินค้า
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="rounded-lg py-3 px-6 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  สินค้า
                </TabsTrigger>
                <TabsTrigger
                  value="trend"
                  className="rounded-lg py-3 px-6 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  แนวโน้ม
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
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
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>รายละเอียด</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[450px] overflow-auto">
                        <Table>
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
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="groups" className="mt-6">
                <Card className="border-0 shadow-lg">
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
                <Card className="border-0 shadow-lg">
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
                            <Table>
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
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                <Card className="border-0 shadow-lg">
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
          <Card className="border-0 shadow-lg">
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
