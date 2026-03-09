"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useSalesForecast } from "@/hooks/use-sales-forecast";
import { PersonalForecastSection } from "./components/PersonalForecastSection";
import { GroupForecastSection } from "./components/GroupForecastSection";
import { ProductForecastSection } from "./components/ProductForecastSection";

interface SalesData {
  month: string;
  monthNumber: number;
  actual: number;
  target: number;
}

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

  const salesData = useMemo(() => {
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

    return MONTHS.map((monthLabel, index) => {
      const monthNumber = index + 1;
      const actual = actualMap[monthNumber] || 0;
      const target = targetMap[monthNumber] || 0;
      return { month: monthLabel, monthNumber, actual, target };
    });
  }, [forecastData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `฿${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `฿${(value / 1000).toFixed(0)}K`;
    }
    return `฿${value.toFixed(0)}`;
  };

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

    // Use object for faster lookups instead of Map
    const map: Record<
      string,
      {
        employeeId: string;
        employeeName: string;
        totalAmount: number;
        totalQuantity: number;
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
        };
      }
      map[key].totalAmount += entry.totalAmount;
      map[key].totalQuantity += entry.totalQuantity;
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
  const currentMonth = new Date().getMonth() + 1;
  const totalActual = salesData
    .filter((d) => d.monthNumber <= currentMonth)
    .reduce((sum, d) => sum + d.actual, 0);
  const totalTarget = salesData.reduce((sum, d) => sum + d.target, 0);
  const actualVsTarget =
    totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : "0";

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

      {/* Overview Charts */}
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-linear-to-br from-blue-100 to-indigo-100">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>แนวโน้มยอดขายและคาดการณ์</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    cursor={{ fill: "#F5F5F5" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatFullCurrency(value)]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="ยอดขายจริง"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: "#22c55e", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="เป้าหมาย"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-linear-to-br from-emerald-100 to-teal-100">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <CardTitle>เปรียบเทียบรายเดือน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    cursor={{ fill: "#F5F5F5" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <Bar
                    dataKey="actual"
                    name="ยอดขายจริง"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="เป้าหมาย"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {forecastSectionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {forecastSectionError}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <PersonalForecastSection
          data={personalForecastRows}
          monthOptions={monthOptions}
          selectedMonth={personalMonth}
          onMonthChange={setPersonalMonth}
          formatCurrency={formatFullCurrency}
          loading={forecastLoading}
          error={forecastError}
        />
        <GroupForecastSection
          data={groupForecastRows}
          formatCurrency={formatFullCurrency}
          loading={forecastLoading}
          error={forecastError}
        />
        <ProductForecastSection
          data={productForecastRows}
          formatCurrency={formatFullCurrency}
          loading={forecastLoading}
          error={forecastError}
        />
      </div>
    </div>
  );
}
