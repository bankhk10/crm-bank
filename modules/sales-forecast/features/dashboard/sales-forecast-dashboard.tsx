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
import { GroupForecastSection } from "./components/GroupForecastSection";
import { ProductForecastSection } from "./components/ProductForecastSection";

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
  const [personalMonth, setPersonalMonth] = useState<string>("all");
  const {
    data: forecastData,
    groupLabels,
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
      const backlog = target - totalForecast;
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

  const personalForecastRows = useMemo(() => {
    if (!forecastData?.personal) return [];
    const filtered =
      personalMonth === "all"
        ? forecastData.personal
        : forecastData.personal.filter(
          (entry) => entry.month === Number(personalMonth),
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
  }, [forecastData, personalMonth]);

  const groupForecastRows = useMemo(() => {
    if (!forecastData?.group) return [];

    // Use object for faster lookups
    const map: Record<
      string,
      {
        productGroup: string;
        label: string;
        totalAmount: number;
        totalQuantity: number;
      }
    > = {};

    forecastData.group.forEach((entry) => {
      const code = entry.productGroup;
      const label = groupLabels[code] || code || "ไม่ระบุ";
      if (!map[code]) {
        map[code] = {
          productGroup: code,
          label,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      map[code].totalAmount += entry.totalAmount;
      map[code].totalQuantity += entry.totalQuantity;
    });

    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [forecastData, groupLabels]);

  const productForecastRows = useMemo(() => {
    if (!forecastData?.product) return [];

    // Use object for faster lookups
    const map: Record<
      string,
      {
        productId: string;
        productCode: string;
        productName: string;
        productGroup: string | null;
        totalAmount: number;
        totalQuantity: number;
      }
    > = {};

    forecastData.product.forEach((entry) => {
      if (!map[entry.productId]) {
        map[entry.productId] = {
          productId: entry.productId,
          productCode: entry.productCode,
          productName: entry.productName,
          productGroup: entry.productGroup,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      map[entry.productId].totalAmount += entry.totalAmount;
      map[entry.productId].totalQuantity += entry.totalQuantity;
    });

    return Object.values(map).sort((a, b) =>
      a.productName.localeCompare(b.productName),
    );
  }, [forecastData]);

  // Calculate summary stats
  const totalActual = performanceData
    .filter((d) => d.monthNumber <= currentMonth)
    .reduce((sum, d) => sum + d.actual, 0);
  const totalTarget = performanceData.reduce((sum, d) => sum + d.target, 0);
  const actualVsTarget =
    totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : "0";

  const totals = useMemo(
    () =>
      performanceData.reduce(
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
    [performanceData],
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
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

        {/* Year Selector & Refresh */}
        <div className="flex items-center gap-3">
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
            className="rounded-xl"
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
            <TabsTrigger value="group" className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">กลุ่มสินค้า</TabsTrigger>
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
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-blue-100 to-indigo-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Sales Performance Dashboard</CardTitle>
                  <p className="text-sm text-slate-500">
                    สรุปเป้าหมาย ยอดขายจริง และคาดการณ์รายเดือน
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-slate-200 px-3 py-3 text-left font-semibold text-slate-700"
                      >
                        รายการ
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-200 px-3 py-3 text-right font-semibold text-slate-700"
                      >
                        เป้าหมายทั้งปี
                      </th>
                      <th
                        colSpan={3}
                        className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700"
                      >
                        Q1
                      </th>
                      <th
                        colSpan={3}
                        className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700"
                      >
                        Q2
                      </th>
                      <th
                        colSpan={3}
                        className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700"
                      >
                        Q3
                      </th>
                      <th
                        colSpan={3}
                        className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700"
                      >
                        Q4
                      </th>
                    </tr>
                    <tr>
                      {MONTHS_FULL.map((label, index) => {
                        const isQuarterStart = index % 3 === 0;
                        return (
                          <th
                            key={label}
                            className={`border border-slate-200 px-3 py-2 text-center font-medium text-slate-600 ${isQuarterStart ? "border-l-2 border-l-slate-300" : ""}`}
                          >
                            {label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "target",
                        label: "เป้าหมาย",
                        type: "currency",
                        total: totals.target,
                        accessor: (entry: PerformanceEntry) =>
                          entry.target,
                      },
                      {
                        id: "actual",
                        label: "ยอดขายจริง",
                        type: "currency",
                        total: totals.actual,
                        accessor: (entry: PerformanceEntry) =>
                          entry.actual,
                      },
                      {
                        id: "actualPercent",
                        label: "% เทียบเป้าหมาย",
                        type: "percent",
                        total:
                          totals.target > 0
                            ? (totals.actual / totals.target) * 100
                            : 0,
                        accessor: (entry: PerformanceEntry) =>
                          entry.percentActual,
                      },
                      {
                        id: "backlog",
                        label: "ยอดค้างจากคาดการณ์",
                        type: "currency",
                        total: totals.backlog,
                        accessor: (entry: PerformanceEntry) =>
                          entry.backlog,
                      },
                    ].map((row, rowIndex) => {
                      const rowBg =
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50";
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-slate-200"
                        >
                          <td
                            className={`sticky left-0 z-10 border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 ${rowBg}`}
                          >
                            {row.label}
                          </td>
                          <td
                            className={`border border-slate-200 px-3 py-2 text-right font-semibold ${row.type === "percent" ? getPercentClass(row.total) : "text-slate-700"}`}
                          >
                            {row.type === "percent"
                              ? formatPercent(row.total)
                              : formatFullCurrency(row.total)}
                          </td>
                          {performanceData.map((entry, index) => {
                            const value = row.accessor(entry);
                            const isQuarterStart = index % 3 === 0;
                            const isPercent = row.type === "percent";
                            return (
                              <td
                                key={`${row.id}-${entry.month}`}
                                className={`border border-slate-200 px-3 py-2 text-right ${isQuarterStart ? "border-l-2 border-l-slate-300" : ""} ${isPercent ? getPercentClass(value) : "text-slate-700"}`}
                              >
                                {isPercent
                                  ? formatPercent(value)
                                  : formatFullCurrency(value)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
            selectedMonth={personalMonth}
            onMonthChange={setPersonalMonth}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>

        <TabsContent value="group" className="focus-[&:not(:focus-visible)]:outline-none mt-0">
          <GroupForecastSection
            data={groupForecastRows}
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
