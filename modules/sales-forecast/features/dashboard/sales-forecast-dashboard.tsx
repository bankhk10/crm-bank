"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useSalesForecast } from "@/hooks/use-sales-forecast";
import { PersonalForecastSection } from "./components/PersonalForecastSection";
import { TradeNameForecastSection } from "./components/TradeNameForecastSection";
import { ProductForecastSection } from "./components/ProductForecastSection";
import { ABCForecastSection } from "./components/ABCForecastSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

type PerformanceEntry = {
  month: string;
  monthNumber: number;
  actual: number;
  target: number;
  newForecast: number;
  totalForecast: number;
  percentActual: number;
  percentTotal: number;
  backlog: number;
};

export default function SalesForecastDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const {
    data: forecastData,
    tradeNameGroupLabels,
    abcLabels,
    loading: forecastLoading,
    error: forecastError,
    refresh: refreshForecast,
  } = useSalesForecast(year);

  const currentMonth = new Date().getMonth() + 1;

  const performanceData = useMemo<PerformanceEntry[]>(() => {
    if (!forecastData?.actualSales) return [];

    const targetMap: Record<number, number> = {};
    forecastData.personal.forEach((entry) => {
      targetMap[entry.month] =
        (targetMap[entry.month] || 0) + entry.totalAmount;
    });

    const actualMap: Record<number, number> = {};
    forecastData.actualSales.forEach((item) => {
      actualMap[item.month] = item.totalAmount || 0;
    });

    return MONTHS_FULL.map((monthLabel, index) => {
      const monthNumber = index + 1;
      const actual = actualMap[monthNumber] || 0;
      const target = targetMap[monthNumber] || 0;
      const newForecast = monthNumber > currentMonth ? target : 0;
      const totalForecast = actual + newForecast;
      const percentActual = target > 0 ? (actual / target) * 100 : 0;
      const percentTotal =
        target > 0 ? (totalForecast / target) * 100 : 0;
      const backlog = actual - target;
      return {
        month: monthLabel,
        monthNumber,
        actual,
        target,
        newForecast,
        totalForecast,
        percentActual,
        percentTotal,
        backlog,
      };
    });
  }, [forecastData, currentMonth]);

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const loadingState = forecastLoading;
  const forecastSectionError = forecastError;

  const monthOptions = useMemo(
    () => [
      { value: "all", label: "ทุกเดือน" },
      ...MONTHS.map((label, index) => ({
        value: String(index + 1),
        label,
      })),
    ],
    [],
  );

  const filteredPerformanceData = useMemo(() => {
    if (selectedMonth === "all") return performanceData;
    return performanceData.filter((d) => d.monthNumber === Number(selectedMonth));
  }, [performanceData, selectedMonth]);

  const personalForecastRows = useMemo(() => {
    if (!forecastData?.personal) return [];
    const filtered =
      selectedMonth === "all"
        ? forecastData.personal
        : forecastData.personal.filter(
          (entry) => entry.month === Number(selectedMonth),
        );

    const map: Record<
      string,
      {
        employeeId: string;
        employeeName: string;
        totalAmount: number;
        totalQuantity: number;
        details: any[];
      }
    > = {};

    filtered.forEach((entry) => {
      const key = entry.employeeId;
      if (!map[key]) {
        map[key] = {
          employeeId: entry.employeeId,
          employeeName: entry.employeeName,
          totalAmount: 0,
          totalQuantity: 0,
          details: [],
        };
      }
      map[key].totalAmount += entry.totalAmount;
      map[key].totalQuantity += entry.totalQuantity;
      if (entry.details) {
        map[key].details.push(...entry.details);
      }
    });

    return Object.values(map).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }, [forecastData, selectedMonth]);

  const tradeNameForecastRows = useMemo(() => {
    if (!forecastData?.tradeNameGroup) return [];

    const filtered =
      selectedMonth === "all"
        ? forecastData.tradeNameGroup
        : forecastData.tradeNameGroup.filter(
          (entry) => entry.month === Number(selectedMonth),
        );

    // Use object for faster lookups
    const map: Record<
      string,
      {
        tradeNameGroup: string;
        label: string;
        totalAmount: number;
        totalQuantity: number;
      }
    > = {};

    filtered.forEach((entry) => {
      const code = entry.tradeNameGroup;
      const label = tradeNameGroupLabels[code] || code || "ไม่ระบุ";
      if (!map[code]) {
        map[code] = {
          tradeNameGroup: code,
          label,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      map[code].totalAmount += entry.totalAmount;
      map[code].totalQuantity += entry.totalQuantity;
    });

    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [forecastData, tradeNameGroupLabels, selectedMonth]);

  const productForecastRows = useMemo(() => {
    if (!forecastData?.product) return [];

    const filtered =
      selectedMonth === "all"
        ? forecastData.product
        : forecastData.product.filter(
          (entry) => entry.month === Number(selectedMonth),
        );

    // Use object for faster lookups
    const map: Record<
      string,
      {
        productId: string;
        productCode: string;
        productName: string;
        tradeNameGroup: string | null;
        totalAmount: number;
        totalQuantity: number;
        totalVolume: number;
      }
    > = {};

    filtered.forEach((entry) => {
      if (!map[entry.productId]) {
        map[entry.productId] = {
          productId: entry.productId,
          productCode: entry.productCode,
          productName: entry.productName,
          tradeNameGroup: entry.tradeNameGroup,
          totalAmount: 0,
          totalQuantity: 0,
          totalVolume: 0,
        };
      }
      map[entry.productId].totalAmount += entry.totalAmount;
      map[entry.productId].totalQuantity += entry.totalQuantity;
      map[entry.productId].totalVolume += entry.totalVolume || 0;
    });

    return Object.values(map).sort((a, b) =>
      a.productName.localeCompare(b.productName),
    );
  }, [forecastData, selectedMonth]);

  const abcForecastRows = useMemo(() => {
    if (!forecastData?.abc) return [];

    const filtered =
      selectedMonth === "all"
        ? forecastData.abc
        : forecastData.abc.filter(
          (entry) => entry.month === Number(selectedMonth),
        );

    const map: Record<
      string,
      {
        abcCode: string;
        abcName: string;
        totalAmount: number;
        totalQuantity: number;
      }
    > = {};

    filtered.forEach((entry) => {
      const code = entry.abcCode;
      const name = abcLabels[code] || entry.abcName || code || "ไม่ระบุประเภท";
      if (!map[code]) {
        map[code] = {
          abcCode: code,
          abcName: name,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      map[code].totalAmount += entry.totalAmount;
      map[code].totalQuantity += entry.totalQuantity;
    });

    return Object.values(map).sort((a, b) =>
      a.abcCode.localeCompare(b.abcCode),
    );
  }, [forecastData, abcLabels, selectedMonth]);

  // Calculate summary stats
  const totalActual = filteredPerformanceData.reduce((sum, d) => sum + d.actual, 0);
  const totalTarget = filteredPerformanceData.reduce((sum, d) => sum + d.target, 0);
  const actualVsTarget =
    totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : "0";

  const totals = useMemo(
    () =>
      filteredPerformanceData.reduce(
        (acc, entry) => ({
          target: acc.target + entry.target,
          actual: acc.actual + entry.actual,
          newForecast: acc.newForecast + entry.newForecast,
          totalForecast: acc.totalForecast + entry.totalForecast,
          backlog: acc.backlog + entry.backlog,
        }),
        {
          target: 0,
          actual: 0,
          newForecast: 0,
          totalForecast: 0,
          backlog: 0,
        },
      ),
    [filteredPerformanceData],
  );

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getPercentClass = (value: number) => {
    if (value > 100) return "text-emerald-600";
    if (value >= 80) return "text-amber-600";
    return "text-orange-600";
  };

  if (loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 space-y-6 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                คาดการณ์ยอดขาย
              </h1>
              <p className="text-slate-500 text-sm">
                วิเคราะห์และคาดการณ์ยอดขายตามข้อมูลย้อนหลัง
              </p>
            </div>
          </div>
        </div>

        {/* Month & Year Selectors & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm font-medium focus:ring-0 focus-visible:ring-0 focus-visible:outline-none">
              <SelectValue placeholder="เลือกเดือน" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white/95 backdrop-blur-md border-slate-200/60">
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg hover:bg-slate-50">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-800 text-lg">{year}</span>
            </div>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Button
            onClick={() => {
              refreshForecast();
            }}
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {forecastSectionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {forecastSectionError}
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6 w-full">
        <div className="flex w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/60 p-1.5 rounded-xl h-auto">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">ภาพรวม</TabsTrigger>
            <TabsTrigger value="personal" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">พนักงาน</TabsTrigger>
            <TabsTrigger value="abc" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">ประเภท (ABC)</TabsTrigger>
            <TabsTrigger value="group" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">กลุ่มชื่อการค้า</TabsTrigger>
            <TabsTrigger value="product" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">สินค้า</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none mt-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">ยอดขายจริง (YTD)</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatFullCurrency(totalActual)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">เป้าหมายทั้งปี</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatFullCurrency(totalTarget)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">ยอดขาย vs เป้าหมาย</p>
                    <p className="text-2xl font-bold mt-1">{actualVsTarget}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    {Number(actualVsTarget) >= 100 ? (
                      <ArrowUp className="w-6 h-6" />
                    ) : (
                      <ArrowDown className="w-6 h-6" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Performance Dashboard Table */}
          <Card className="overflow-hidden rounded-2xl border-2 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-blue-100 to-indigo-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>ภาพรวมยอดขายและเป้าหมาย</CardTitle>
                  <p className="text-sm text-slate-500">
                    สรุปเป้าหมาย ยอดขายจริง และคาดการณ์รายเดือน
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-3 text-left font-semibold text-slate-700 text-base min-w-[90px] sticky left-0 z-10 bg-slate-50">
                        เดือน
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700 text-base min-w-[130px]">
                        เป้าหมาย
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700 text-base min-w-[130px]">
                        ยอดขายจริง
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700 text-base min-w-[110px]">
                        % เทียบเป้า
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700 text-base min-w-[150px]">
                        ส่วนต่างจากเป้าหมาย
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerformanceData.map((entry) => {
                      const monthIdx = entry.monthNumber - 1;
                      const isCurrentMonth = entry.monthNumber === currentMonth;
                      const isQuarterStart = monthIdx % 3 === 0;
                      const rowBg = isCurrentMonth
                        ? "bg-blue-50"
                        : monthIdx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50";
                      const backlogColor =
                        entry.backlog > 0
                          ? "text-emerald-600"
                          : entry.backlog < 0
                            ? "text-rose-600"
                            : "text-slate-700";
                      return (
                        <tr
                          key={entry.month}
                          className={`border-b border-slate-200 ${isCurrentMonth ? "ring-1 ring-inset ring-blue-300" : ""} ${isQuarterStart ? "border-t-2 border-t-slate-300" : ""}`}
                        >
                          <td
                            className={`sticky left-0 z-10 border border-slate-200 px-3 py-2 text-left font-medium text-slate-700 ${rowBg} ${isCurrentMonth ? "text-blue-700" : ""}`}
                          >
                            <span className="hidden lg:inline">{MONTHS_FULL[monthIdx]}</span>
                            <span className="lg:hidden">{MONTHS[monthIdx]}</span>
                            {isCurrentMonth && (
                              <span className="ml-1 text-[12px] text-blue-500 bg-blue-100 px-1 rounded">
                                ปัจจุบัน
                              </span>
                            )}
                          </td>
                          <td className={`border border-slate-200 px-3 py-2 text-center text-slate-700 ${rowBg}`}>
                            {formatFullCurrency(entry.target)}
                          </td>
                          <td className={`border border-slate-200 px-3 py-2 text-center text-slate-700 ${rowBg}`}>
                            {formatFullCurrency(entry.actual)}
                          </td>
                          <td className={`border border-slate-200 px-3 py-2 text-center ${getPercentClass(entry.percentActual)} ${rowBg}`}>
                            {formatPercent(entry.percentActual)}
                          </td>
                          <td className={`border border-slate-200 px-3 py-2 text-center font-medium ${backlogColor} ${rowBg}`}>
                            {entry.backlog > 0 ? `+${formatFullCurrency(entry.backlog)}` : formatFullCurrency(entry.backlog)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Summary row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="sticky left-0 z-10 border border-slate-200 pl-6 pr-3 py-2.5 text-left text-base text-slate-800 bg-slate-100">
                        {selectedMonth === "all" ? "รวมทั้งปี" : `รวมเดือน ${MONTHS_FULL[Number(selectedMonth) - 1]}`}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">
                        {formatFullCurrency(totals.target)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">
                        {formatFullCurrency(totals.actual)}
                      </td>
                      <td className={`border border-slate-200 px-3 py-2.5 text-center ${getPercentClass(totals.target > 0 ? (totals.actual / totals.target) * 100 : 0)}`}>
                        {formatPercent(totals.target > 0 ? (totals.actual / totals.target) * 100 : 0)}
                      </td>
                      <td className={`border border-slate-200 px-3 py-2.5 text-center ${totals.backlog > 0 ? "text-emerald-600" : totals.backlog < 0 ? "text-rose-600" : "text-slate-800"}`}>
                        {totals.backlog > 0 ? `+${formatFullCurrency(totals.backlog)}` : formatFullCurrency(totals.backlog)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      <TabsContent value="personal" className="focus-[&:not(:focus-visible)]:outline-none mt-0">
        <PersonalForecastSection
          data={personalForecastRows}
          year={year}
          monthOptions={monthOptions}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          formatCurrency={formatFullCurrency}
          loading={forecastLoading}
          error={forecastError}
        />
      </TabsContent>

        <TabsContent value="abc" className="focus-[&:not(:focus-visible)]:outline-none mt-0">
          <ABCForecastSection
            data={abcForecastRows}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>

        <TabsContent value="group" className="focus-[&:not(:focus-visible)]:outline-none mt-0">
          <TradeNameForecastSection
            data={tradeNameForecastRows}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>

        <TabsContent value="product" className="focus-[&:not(:focus-visible)]:outline-none mt-0">
          <ProductForecastSection
            data={productForecastRows}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
