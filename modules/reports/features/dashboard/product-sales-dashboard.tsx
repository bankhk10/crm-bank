"use client";

import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";

import { useId, useState, useTransition } from "react";
import {
  format,
  startOfToday,
  endOfToday,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "../../ui/kpi-card";

import {
  getProductSalesReportAction,
  getProductGroupSalesReportAction,
  type ProductSalesReportData,
  type ProductGroupSalesReportData,
  type DateRangeFilter,
} from "@/modules/reports";

const quickDateRanges = [
  {
    label: "วันนี้",
    getValue: () => ({ from: startOfToday(), to: endOfToday() }),
  },
  {
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "ไตรมาสนี้",
    getValue: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
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
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
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
    <div className="min-h-screen pb-12 rounded-3xl">
      <DetailHero
        backUrl="/reports"
        backLabel="หน้ารายงาน"
        title="รายงานสินค้าและกลุ่มชื่อการค้า"
        icon={<Package className="h-8 w-8 text-white" />}
        badges={
          reportData && (
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
              <Package className="h-3.5 w-3.5 text-[#60A5FA]" />
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
                      setGroupReportData(null);
                    }}
                    className="h-10 px-4 min-h-[40px] mb-0"
                    containerClassName="w-auto mt-0"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Report Content ── */}
        {isPending ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 sm:h-96 rounded-xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards: mobile=2 col, lg=4 cols */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="สินค้าขายดีที่สุด"
                value={reportData.topProducts[0]?.name || "-"}
                sub={
                  <div className="mt-1 space-y-0.5">
                    <p className="text-base font-bold text-red-700">
                      {formatTHB(reportData.topProducts[0]?.totalSales || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium italic">
                      ขายได้ {formatPackSize(
                        reportData.topProducts[0]?.totalPackageSold || 0,
                        reportData.topProducts[0]?.packageUnit,
                      )} {reportData.topProducts[0]?.childCount ? "(รวมสินค้าลูก)" : ""}
                    </p>
                  </div>
                }
                icon={Award}
                gradient="bg-gradient-to-br from-red-600 to-red-700"
                ring="shadow-lg shadow-red-600/20"
                topColor="red"
              />

              <KpiCard
                label="สินค้าขายช้าที่สุด"
                value={reportData.slowProducts[0]?.name || "-"}
                sub={
                  <div className="mt-1 space-y-0.5">
                    <p className="text-base font-bold text-slate-900">
                      {formatTHB(reportData.slowProducts[0]?.totalSales || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium italic">
                      ขายได้ {formatPackSize(
                        reportData.slowProducts[0]?.totalPackageSold || 0,
                        reportData.slowProducts[0]?.packageUnit,
                      )}
                    </p>
                  </div>
                }
                icon={TrendingDown}
                gradient="bg-gradient-to-br from-slate-900 to-slate-800"
                ring="shadow-lg shadow-slate-900/20"
                topColor="black"
              />

              <KpiCard
                label="สินค้าใกล้หมด"
                value={`${reportData.lowStockProducts.length} รายการ`}
                sub={
                  <div className="mt-1">
                    <p className="text-xs font-semibold text-red-600">
                      รายการ (คงเหลือ &lt; 50)
                    </p>
                  </div>
                }
                icon={AlertTriangle}
                gradient="bg-gradient-to-br from-red-500 to-red-600"
                ring="shadow-lg shadow-red-500/20"
                topColor="red"
              />

              <KpiCard
                label="สินค้าค้างสต๊อก"
                value={`${reportData.stagnantProducts.length} รายการ`}
                sub={
                  <div className="mt-1 font-semibold text-slate-500 text-xs">
                    <p>ไม่ขายใน 90 วัน</p>
                  </div>
                }
                icon={Archive}
                gradient="bg-gradient-to-br from-slate-800 to-slate-900"
                ring="shadow-lg shadow-slate-800/20"
                topColor="black"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-1.5 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm flex flex-wrap gap-1">
                <TabsTrigger
                  value="top-products"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  รายการสินค้าทั้งหมด
                </TabsTrigger>
                <TabsTrigger
                  value="slow-products"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  สินค้าขายช้า
                </TabsTrigger>
                <TabsTrigger
                  value="peak-periods"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  ช่วงเวลาขายดี
                </TabsTrigger>
                <TabsTrigger
                  value="low-stock"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  สินค้าใกล้หมด
                </TabsTrigger>
                <TabsTrigger
                  value="stagnant"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  ค้างสต๊อก
                </TabsTrigger>
                <TabsTrigger
                  value="group-performance"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  ผลงานกลุ่มชื่อการค้า
                </TabsTrigger>
              </TabsList>
              <TabsContent value="top-products" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Table */}
                  <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        รายละเอียดสินค้าทั้งหมด
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
                                  จำนวนออเดอร์
                                </TableHead>
                                <TableHead className="text-right">
                                  บรรจุขายได้รวมลูก
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData.topProducts
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
                                    <TableCell className="text-right text-slate-700 font-medium">
                                      {formatNumber(product.orderCount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {product.childCount > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-red-700 border-red-200 bg-red-50"
                                          >
                                            รวมลูก {product.childCount}
                                          </Badge>
                                        )}
                                        <span className="font-semibold text-red-700">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                          className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
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
                                  <span className="text-sm font-semibold text-red-600">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                                <TableCell className="text-right font-semibold text-red-600">
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
          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
