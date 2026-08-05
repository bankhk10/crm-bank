"use client";

import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Users,
  UserRound,
  Eye,
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
  target: number;
};

export default function SalesForecastDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});

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
    if (!forecastData?.personal) return [];

    const targetMap: Record<number, number> = {};
    forecastData.personal.forEach((entry) => {
      targetMap[entry.month] =
        (targetMap[entry.month] || 0) + entry.totalAmount;
    });

    return MONTHS_FULL.map((monthLabel, index) => {
      const monthNumber = index + 1;
      const target = targetMap[monthNumber] || 0;
      return {
        month: monthLabel,
        monthNumber,
        target,
      };
    });
  }, [forecastData]);

  const monthlyEmployeesMap = useMemo(() => {
    if (!forecastData?.personal) return {};

    const map: Record<
      number,
      Record<
        string,
        {
          employeeId: string;
          employeeName: string;
          region: string | null;
          totalAmount: number;
          totalQuantity: number;
        }
      >
    > = {};

    forecastData.personal.forEach((entry) => {
      const m = entry.month;
      if (!map[m]) {
        map[m] = {};
      }
      const empId = entry.employeeId;
      if (!map[m][empId]) {
        map[m][empId] = {
          employeeId: entry.employeeId,
          employeeName: entry.employeeName,
          region: entry.region,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      map[m][empId].totalAmount += entry.totalAmount;
      map[m][empId].totalQuantity += entry.totalQuantity;
    });

    const result: Record<
      number,
      Array<{
        employeeId: string;
        employeeName: string;
        region: string | null;
        totalAmount: number;
        totalQuantity: number;
      }>
    > = {};

    Object.keys(map).forEach((mStr) => {
      const m = Number(mStr);
      result[m] = Object.values(map[m]).sort((a, b) =>
        a.employeeName.localeCompare(b.employeeName)
      );
    });

    return result;
  }, [forecastData]);

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
    return performanceData.filter(
      (d) => d.monthNumber === Number(selectedMonth),
    );
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
  const totalTarget = useMemo(
    () => filteredPerformanceData.reduce((sum, d) => sum + d.target, 0),
    [filteredPerformanceData],
  );

  const totalUniqueEmployees = useMemo(() => {
    const empSet = new Set<string>();
    filteredPerformanceData.forEach((entry) => {
      const list = monthlyEmployeesMap[entry.monthNumber] || [];
      list.forEach((emp) => empSet.add(emp.employeeId));
    });
    return empSet.size;
  }, [filteredPerformanceData, monthlyEmployeesMap]);

  const isAllExpanded = useMemo(() => {
    if (filteredPerformanceData.length === 0) return false;
    return filteredPerformanceData.every((d) => expandedMonths[d.monthNumber]);
  }, [filteredPerformanceData, expandedMonths]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedMonths({});
    } else {
      const nextState: Record<number, boolean> = {};
      filteredPerformanceData.forEach((d) => {
        nextState[d.monthNumber] = true;
      });
      setExpandedMonths(nextState);
    }
  };

  const toggleMonthExpand = (monthNumber: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthNumber]: !prev[monthNumber],
    }));
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
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-lg hover:bg-slate-50"
                >
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
            <TabsTrigger
              value="overview"
              className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
            >
              ภาพรวม
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
            >
              พนักงาน
            </TabsTrigger>
            <TabsTrigger
              value="abc"
              className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
            >
              ประเภท (ABC)
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
            >
              กลุ่มชื่อการค้า
            </TabsTrigger>
            <TabsTrigger
              value="product"
              className="rounded-lg px-4 py-2 font-medium text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
            >
              สินค้า
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6 focus-visible:outline-none mt-0"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">
                      {selectedMonth === "all"
                        ? "เป้าหมายรวมทั้งปี"
                        : "เป้าหมายประจำเดือน"}
                    </p>
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

            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">
                      พนักงานที่ตั้งเป้าหมาย
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {totalUniqueEmployees} คน
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <UserRound className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">
                      {selectedMonth === "all"
                        ? "เฉลี่ยเป้าหมายต่อเดือน"
                        : "จำนวนพนักงานในเดือนนี้"}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {selectedMonth === "all"
                        ? formatFullCurrency(totalTarget / 12)
                        : `${monthlyEmployeesMap[Number(selectedMonth)]?.length || 0} คน`}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Performance Dashboard Table */}
          <Card className="overflow-hidden rounded-2xl border-2 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100 mt-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-blue-100 to-indigo-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>ภาพรวมเป้าหมายรายเดือน</CardTitle>
                  <p className="text-sm text-slate-500">
                    สรุปเป้าหมายและรายชื่อพนักงานที่ตั้งเป้าหมายประจำเดือน
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpandAll}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5"
              >
                {isAllExpanded ? (
                  <>
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                    ย่อทั้งหมด
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                    ขยายทั้งหมด
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-3 text-left font-semibold text-slate-700 text-base min-w-[160px] sticky left-0 z-10 bg-slate-50">
                        เดือน
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-center font-semibold text-slate-700 text-base min-w-[150px]">
                        จำนวนพนักงานที่ตั้งเป้า
                      </th>
                      <th className="border border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 text-base min-w-[180px]">
                        เป้าหมาย
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerformanceData.map((entry) => {
                      const monthIdx = entry.monthNumber - 1;
                      const isCurrentMonth = entry.monthNumber === currentMonth;
                      const isQuarterStart = monthIdx % 3 === 0;
                      const rowBg = isCurrentMonth
                        ? "bg-blue-50/80"
                        : monthIdx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50";

                      const empList =
                        monthlyEmployeesMap[entry.monthNumber] || [];
                      const isExpanded = !!expandedMonths[entry.monthNumber];

                      return (
                        <Fragment key={entry.month}>
                          <tr
                            className={`border-b border-slate-200 hover:bg-slate-100/50 transition-colors ${isCurrentMonth ? "ring-1 ring-inset ring-blue-300" : ""} ${isQuarterStart ? "border-t-2 border-t-slate-300" : ""}`}
                          >
                            <td
                              className={`sticky left-0 z-10 border border-slate-200 px-3 py-2.5 text-left font-medium text-slate-700 ${rowBg} ${isCurrentMonth ? "text-blue-700 font-bold" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleMonthExpand(entry.monthNumber)
                                  }
                                  className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors"
                                  title={isExpanded ? "ย่อ" : "ขยาย"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                                <span>
                                  <span className="hidden lg:inline">
                                    {MONTHS_FULL[monthIdx]}
                                  </span>
                                  <span className="lg:hidden">
                                    {MONTHS[monthIdx]}
                                  </span>
                                </span>
                                {isCurrentMonth && (
                                  <span className="ml-1 text-[12px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
                                    ปัจจุบัน
                                  </span>
                                )}
                              </div>
                            </td>
                            <td
                              className={`border border-slate-200 px-3 py-2.5 text-center text-slate-700 ${rowBg}`}
                            >
                              {empList.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleMonthExpand(entry.monthNumber)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  {empList.length} คน
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  ยังไม่มีการตั้งเป้า
                                </span>
                              )}
                            </td>
                            <td
                              className={`border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-800 ${rowBg}`}
                            >
                              {formatFullCurrency(entry.target)}
                            </td>
                          </tr>

                          {/* Expandable Sub-table */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                              <td
                                colSpan={3}
                                className="p-3 sm:p-4 pl-4 sm:pl-10"
                              >
                                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                                  <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                      <UserRound className="w-4 h-4 text-blue-600" />
                                      <span>
                                        รายชื่อพนักงานที่ตั้งเป้าหมายประจำเดือน{" "}
                                        {MONTHS_FULL[monthIdx]}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">
                                      รวม {empList.length} คน
                                    </span>
                                  </div>
                                  {empList.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                          <tr>
                                            <th className="px-4 py-2.5 font-semibold">
                                              พนักงาน
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold text-right">
                                              จำนวนสินค้า
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold text-right">
                                              ยอดเป้าหมาย
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold text-center w-24">
                                              จัดการ
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {empList.map((emp) => (
                                            <tr
                                              key={emp.employeeId}
                                              className="hover:bg-blue-50/40 transition-colors"
                                            >
                                              <td className="px-4 py-2.5 font-medium text-slate-800">
                                                {emp.employeeName}
                                                {emp.region && (
                                                  <span className="ml-2 text-[11px] text-slate-400 font-normal">
                                                    ({emp.region})
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-4 py-2.5 text-right text-slate-600">
                                                {emp.totalQuantity.toLocaleString()}{" "}
                                                รายการ
                                              </td>
                                              <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                                                {formatFullCurrency(
                                                  emp.totalAmount,
                                                )}
                                              </td>
                                              <td className="px-4 py-2.5 text-center">
                                                <a
                                                  href={`/sales-forecast/${emp.employeeId}?year=${year}`}
                                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                                  title="ดูรายละเอียด"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                  ดูรายละเอียด
                                                </a>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center text-xs text-slate-400">
                                      ไม่มีพนักงานตั้งเป้าหมายในเดือนนี้
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {/* Summary row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="sticky left-0 z-10 border border-slate-200 pl-6 pr-3 py-2.5 text-left text-base text-slate-800 bg-slate-100">
                        {selectedMonth === "all"
                          ? "รวมทั้งปี"
                          : `รวมเดือน ${MONTHS_FULL[Number(selectedMonth) - 1]}`}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">
                        {totalUniqueEmployees} คน
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 text-right text-slate-800 text-base">
                        {formatFullCurrency(totalTarget)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="personal"
          className="focus-[&:not(:focus-visible)]:outline-none mt-0"
        >
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

        <TabsContent
          value="abc"
          className="focus-[&:not(:focus-visible)]:outline-none mt-0"
        >
          <ABCForecastSection
            data={abcForecastRows}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>

        <TabsContent
          value="group"
          className="focus-[&:not(:focus-visible)]:outline-none mt-0"
        >
          <TradeNameForecastSection
            data={tradeNameForecastRows}
            formatCurrency={formatFullCurrency}
            loading={forecastLoading}
            error={forecastError}
          />
        </TabsContent>

        <TabsContent
          value="product"
          className="focus-[&:not(:focus-visible)]:outline-none mt-0"
        >
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
