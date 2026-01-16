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
  Package,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Archive,
  Clock,
  Loader2,
  Award,
  XCircle,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  getProductSalesReport,
  type ProductSalesReportData,
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
    label: "3 เดือนล่าสุด",
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

export default function ProductSalesReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<ProductSalesReportData | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("top-products");

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getProductSalesReport(filter);
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

  const topProductsChartData =
    reportData?.topProducts.slice(0, 10).map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
      sales: p.totalSales,
      quantity: p.totalQuantity,
    })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-green-500/5" />

        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                รายงานตามสินค้า
              </h1>
              <p className="text-muted-foreground text-sm">
                สินค้าขายดี / ขายช้า, ยอดขายต่อสินค้า, สินค้าใกล้หมดและค้างสต๊อก
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
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">
                        สินค้าขายดีที่สุด
                      </p>
                      <p className="text-lg font-bold mt-1 truncate max-w-[180px]">
                        {reportData.topProducts[0]?.name || "-"}
                      </p>
                    </div>
                    <Award className="h-10 w-10 text-emerald-200" />
                  </div>
                  <div className="mt-4 text-sm text-emerald-100">
                    {formatTHB(reportData.topProducts[0]?.totalSales || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">
                        สินค้าขายช้าที่สุด
                      </p>
                      <p className="text-lg font-bold mt-1 truncate max-w-[180px]">
                        {reportData.slowProducts[0]?.name || "-"}
                      </p>
                    </div>
                    <TrendingDown className="h-10 w-10 text-amber-200" />
                  </div>
                  <div className="mt-4 text-sm text-amber-100">
                    {formatTHB(reportData.slowProducts[0]?.totalSales || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">สินค้าใกล้หมด</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.lowStockProducts.length}
                      </p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-red-200" />
                  </div>
                  <div className="mt-4 text-sm text-red-100">
                    รายการ (คงเหลือ &lt; 50)
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                <CardContent className="p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">สินค้าค้างสต๊อก</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.stagnantProducts.length}
                      </p>
                    </div>
                    <Archive className="h-10 w-10 text-purple-200" />
                  </div>
                  <div className="mt-4 text-sm text-purple-100">
                    ไม่ขายใน 90 วัน
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl flex-wrap h-auto gap-1">
                <TabsTrigger value="top-products" className="rounded-lg">
                  สินค้าขายดี
                </TabsTrigger>
                <TabsTrigger value="slow-products" className="rounded-lg">
                  สินค้าขายช้า
                </TabsTrigger>
                <TabsTrigger value="peak-periods" className="rounded-lg">
                  ช่วงเวลาขายดี
                </TabsTrigger>
                <TabsTrigger value="low-stock" className="rounded-lg">
                  สินค้าใกล้หมด
                </TabsTrigger>
                <TabsTrigger value="stagnant" className="rounded-lg">
                  ค้างสต๊อก
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top-products" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Top 10 สินค้าขายดี
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProductsChartData}
                            layout="vertical"
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              type="number"
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={150}
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
                            <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                              {topProductsChartData.map((_, index) => (
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

                  {/* Table */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        รายละเอียดสินค้าขายดี
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-80 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
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
                            {reportData.topProducts
                              .slice(0, 20)
                              .map((product, idx) => (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        idx < 3
                                          ? "bg-amber-100 text-amber-800 border-amber-300"
                                          : ""
                                      }
                                    >
                                      {idx + 1}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {product.code}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatTHB(product.totalSales)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatNumber(product.totalQuantity)}
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

              <TabsContent value="slow-products" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-amber-500" />
                      สินค้าขายช้า (ยอดขายต่ำสุดในช่วงเวลา)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>รหัส</TableHead>
                          <TableHead>ชื่อสินค้า</TableHead>
                          <TableHead>กลุ่มสินค้า</TableHead>
                          <TableHead className="text-right">ยอดขาย</TableHead>
                          <TableHead className="text-right">
                            จำนวนที่ขาย
                          </TableHead>
                          <TableHead className="text-right">
                            จำนวนออเดอร์
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.slowProducts.map((product, idx) => (
                          <TableRow key={product.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {product.code}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.productGroup || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-amber-600 font-medium">
                              {formatTHB(product.totalSales)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(product.totalQuantity)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.orderCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="peak-periods" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      ช่วงเวลาขายดีที่สุดของสินค้า
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reportData.productPeakPeriods.map((item, idx) => (
                        <Card
                          key={item.productId}
                          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Badge
                                className={`mt-1 ${
                                  idx === 0
                                    ? "bg-amber-500"
                                    : idx === 1
                                    ? "bg-slate-400"
                                    : idx === 2
                                    ? "bg-amber-700"
                                    : "bg-slate-500"
                                }`}
                              >
                                {idx + 1}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.productName}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {item.peakMonth}
                                  </Badge>
                                  <span className="text-sm font-semibold text-emerald-600">
                                    {formatTHB(item.peakSales)}
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

              <TabsContent value="low-stock" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      สินค้าใกล้หมด (คงเหลือ &lt; 50)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.lowStockProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ไม่มีสินค้าใกล้หมด</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่อสินค้า</TableHead>
                            <TableHead className="text-right">
                              คงเหลือจริง
                            </TableHead>
                            <TableHead className="text-right">จอง</TableHead>
                            <TableHead className="text-right">
                              พร้อมขาย
                            </TableHead>
                            <TableHead>วันหมดอายุ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.lowStockProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono text-sm">
                                {product.code}
                              </TableCell>
                              <TableCell className="font-medium">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(product.physicalBalance)}
                              </TableCell>
                              <TableCell className="text-right text-amber-600">
                                {formatNumber(product.reservedQuantity)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    product.availableQuantity <= 10
                                      ? "bg-red-100 text-red-800 border-red-300"
                                      : product.availableQuantity <= 30
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : ""
                                  }
                                >
                                  {formatNumber(product.availableQuantity)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product.upcomingExpiry ? (
                                  <span className="text-sm text-muted-foreground">
                                    {product.upcomingExpiry}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stagnant" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Archive className="h-5 w-5 text-purple-500" />
                      สินค้าค้างสต๊อก (ไม่มียอดขายใน 90 วัน)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.stagnantProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ไม่มีสินค้าค้างสต๊อก</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่อสินค้า</TableHead>
                            <TableHead className="text-right">
                              สต๊อกคงเหลือ
                            </TableHead>
                            <TableHead className="text-right">
                              จำนวนวัน
                            </TableHead>
                            <TableHead>ขายล่าสุด</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.stagnantProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono text-sm">
                                {product.code}
                              </TableCell>
                              <TableCell className="font-medium">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  {formatNumber(product.stock)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-red-600 font-medium">
                                  {product.daysSinceLastSale === 999
                                    ? "ไม่เคยขาย"
                                    : `${product.daysSinceLastSale} วัน`}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {product.lastSoldDate || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
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
