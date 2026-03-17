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
  Package,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Archive,
  Clock,
  Loader2,
  Award,
} from "lucide-react";
import Link from "next/link";

import {
  getProductSalesReportAction,
  getProductGroupSalesReportAction,
  type ProductSalesReportData,
  type ProductGroupSalesReportData,
  type DateRangeFilter,
} from "@/modules/reports";



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

export function ProductSalesDashboard() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<ProductSalesReportData | null>(
    null,
  );
  const [groupReportData, setGroupReportData] = useState<ProductGroupSalesReportData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("top-products");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [volumeUnit, setVolumeUnit] = useState<"L" | "ML" | "KG" | "G">("L");
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const [prodData, groupData] = await Promise.all([
        getProductSalesReportAction(filter),
        getProductGroupSalesReportAction(filter)
      ]);
      setReportData(prodData);
      setGroupReportData(groupData);
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
    groupReportData?.groupPerformance.sort((a, b) => b.totalSales - a.totalSales) ||
    [];

  const formatPackSize = (value: number, unit?: string) => {
    if (!value) return "-";
    const unitLabel = unit?.trim();
    return `${formatNumber(value)}${unitLabel ? ` ${unitLabel}` : " หน่วย"}`;
  };

  const volumeUnitOptions = [
    { value: "L" as const, label: "L (ลิตร)" },
    { value: "ML" as const, label: "ML (มิลลิลิตร)" },
    { value: "KG" as const, label: "KG (กิโลกรัม)" },
    { value: "G" as const, label: "G (กรัม)" },
  ];

  const convertVolume = (liters: number, targetUnit: string): number => {
    const u = targetUnit.toUpperCase();
    if (u === "L") return liters;
    if (u === "ML") return liters * 1000;
    if (u === "KG") return liters; // 1:1 mapping for weight (kept same)
    if (u === "G") return liters * 1000; // KG→G equivalent
    return liters;
  };

  const formatVolume = (liters: number) => {
    const converted = convertVolume(liters, volumeUnit);
    if (!converted) return "0";
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
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
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              รายงานสินค้าและกลุ่มชื่อการค้า
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              สินค้าขายดี / ขายช้า, ยอดขายต่อสินค้า, สินค้าใกล้หมดและค้างสต๊อก
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
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                      className="h-9 text-xs w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 sm:h-96 rounded-2xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards: mobile=1 col, sm=2 cols, lg=4 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        สินค้าขายดีที่สุด
                      </p>
                      <p className="text-sm sm:text-base font-bold mt-1 truncate max-w-[180px]">
                        {reportData.topProducts[0]?.name || "-"}
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-600 mt-1">
                        {formatTHB(reportData.topProducts[0]?.totalSales || 0)}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                        บรรจุขายได้ {formatPackSize(
                          reportData.topProducts[0]?.totalPackageSold || 0,
                          reportData.topProducts[0]?.packageUnit,
                        )}
                        {reportData.topProducts[0]?.childCount
                          ? " (รวมสินค้าลูก)"
                          : ""}
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
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        สินค้าขายช้าที่สุด
                      </p>
                      <p className="text-sm sm:text-base font-bold mt-1 truncate max-w-[180px]">
                        {reportData.slowProducts[0]?.name || "-"}
                      </p>
                      <p className="text-xs sm:text-sm text-amber-600 mt-1">
                        {formatTHB(reportData.slowProducts[0]?.totalSales || 0)}
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
                        สินค้าใกล้หมด
                      </p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                        {reportData.lowStockProducts.length}
                      </p>
                      <p className="text-xs sm:text-sm text-red-600 mt-1">
                        รายการ (คงเหลือ &lt; 50)
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-red-50">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        สินค้าค้างสต๊อก
                      </p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                        {reportData.stagnantProducts.length}
                      </p>
                      <p className="text-xs sm:text-sm text-purple-600 mt-1">
                        ไม่ขายใน 90 วัน
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-purple-50">
                      <Archive className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl h-auto grid grid-cols-2 sm:flex gap-2 sm:gap-0">
                <TabsTrigger
                  value="top-products"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  สินค้าขายดี
                </TabsTrigger>
                <TabsTrigger
                  value="slow-products"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  สินค้าขายช้า
                </TabsTrigger>
                <TabsTrigger
                  value="peak-periods"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ช่วงเวลาขายดี
                </TabsTrigger>
                <TabsTrigger
                  value="low-stock"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  สินค้าใกล้หมด
                </TabsTrigger>
                <TabsTrigger
                  value="stagnant"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ค้างสต๊อก
                </TabsTrigger>
                <TabsTrigger
                  value="group-performance"
                  className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  ผลงานกลุ่มชื่อการค้า
                </TabsTrigger>
              </TabsList>

              {/* Volume Unit Switcher */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">หน่วยปริมาณ:</span>
                <div className="flex rounded-lg border overflow-hidden">
                  {volumeUnitOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setVolumeUnit(opt.value)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${volumeUnit === opt.value
                        ? "bg-emerald-500 text-white"
                        : "bg-white hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <TabsContent value="top-products" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Table */}
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        รายละเอียดสินค้าขายดี
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[450px] overflow-auto">
                        <div className="overflow-x-auto">
                          <Table className="min-w-[720px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>ลำดับ</TableHead>
                                <TableHead>สินค้า</TableHead>
                                <TableHead className="text-right">
                                  ยอดขาย
                                </TableHead>
                                <TableHead className="text-right">
                                  จำนวน
                                </TableHead>
                                <TableHead className="text-right">
                                  ปริมาณ ({volumeUnit})
                                </TableHead>
                                <TableHead className="text-right">
                                  บรรจุขายได้รวมลูก
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
                                    <TableCell className="text-right">
                                      <span className="font-semibold text-blue-600">
                                        {formatVolume(product.totalVolumeLiters)} {volumeUnit}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {product.childCount > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-emerald-700 border-emerald-200 bg-emerald-50"
                                          >
                                            รวมลูก {product.childCount}
                                          </Badge>
                                        )}
                                        <span className="font-semibold text-emerald-700">
                                          {formatPackSize(
                                            product.totalPackageSold,
                                            product.packageUnit,
                                          )}
                                        </span>
                                      </div>
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

              <TabsContent value="slow-products" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-amber-500" />
                      สินค้าขายช้า (ยอดขายต่ำสุดในช่วงเวลา)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px]">
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
                              ปริมาณ ({volumeUnit})
                            </TableHead>
                            <TableHead className="text-right">
                              บรรจุขายได้รวมลูก
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
                                <span className="font-medium text-blue-600">
                                  {formatVolume(product.totalVolumeLiters)} {volumeUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {product.childCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-200 bg-amber-50 text-amber-700"
                                    >
                                      รวมลูก {product.childCount}
                                    </Badge>
                                  )}
                                  <span className="font-medium text-amber-700">
                                    {formatPackSize(
                                      product.totalPackageSold,
                                      product.packageUnit,
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {product.orderCount}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="peak-periods" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      ช่วงเวลาขายดีที่สุดของสินค้า
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {reportData.productPeakPeriods.map((item, idx) => (
                        <Card
                          key={item.productId}
                          className="rounded-2xl border bg-white/70 shadow-sm"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Badge
                                className={`mt-1 ${idx === 0
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
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
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
                      <div className="overflow-x-auto">
                        <Table className="min-w-[780px]">
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stagnant" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
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
                      <div className="overflow-x-auto">
                        <Table className="min-w-[720px]">
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="group-performance" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ผลงานแต่ละกลุ่มสินค้า
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!groupReportData ? (
                      <div className="py-10 text-center text-muted-foreground">
                        ไม่พบข้อมูลผลงานแต่ละกลุ่มสินค้า
                      </div>
                    ) : (
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
                                ปริมาณ ({volumeUnit})
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
                                  <span className="font-medium text-blue-600">
                                    {formatVolume(group.totalVolumeLiters)} {volumeUnit}
                                  </span>
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
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
