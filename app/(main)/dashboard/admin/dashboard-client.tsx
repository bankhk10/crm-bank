"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Map,
  Package,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import type { DashboardData, DashboardPeriod } from "@/modules/dashboard";

/* ================= Hook ================= */
function useWindowWidth() {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

/* ================= Utils ================= */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("th-TH").format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);

const formatTHBWithCompact = (value: number) => {
  if (value >= 10_000_000) {
    return new Intl.NumberFormat("th-TH", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 1,
  }).format(value);
};

/* ================= Chart Sub-Components ================= */

const CHART_BARS = [
  {
    dataKey: "lastYearInvoice",
    name: "ยอดขาย (ปีที่แล้ว)",
    fill: "#ad31e2ff",
  },
  { dataKey: "target", name: "Target", fill: "#3b82f6" },
  { dataKey: "salesNote", name: "Sales Note", fill: "#f97316" },
  { dataKey: "invoice", name: "Invoice", fill: "#22c55e" },
] as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
  fontSize: 12,
};

function RegionChart({ regionData }: { regionData: { region: string; lastYearInvoice: number; target: number; salesNote: number; invoice: number }[] }) {
  const width = useWindowWidth();
  const isMobile = width < 640;

  // Dynamic height: taller on mobile because vertical layout needs more vertical space per region
  const chartHeight = isMobile
    ? Math.max(280, regionData.length * 80)
    : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={regionData}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="region"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              cursor={{ fill: "#F5F5F5" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
            {CHART_BARS.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    );
  }

  return (
    <CardContent className="h-[280px] md:h-[320px] lg:h-[350px] pt-4 px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={regionData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="region" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            cursor={{ fill: "#F5F5F5" }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

function ProductGroupChart({
  filteredProductGroupData,
}: {
  filteredProductGroupData: { group: string; lastYearInvoice: number; target: number; salesNote: number; invoice: number }[];
}) {
  const width = useWindowWidth();
  const isMobile = width < 640;

  if (filteredProductGroupData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full text-slate-400">
          <div className="text-center">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">กรุณาเลือกกรุ๊ปสินค้าที่ต้องการแสดง</p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile
    ? Math.max(280, filteredProductGroupData.length * 80)
    : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredProductGroupData}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="group"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "#F5F5F5" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
            {CHART_BARS.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    );
  }

  return (
    <CardContent className="h-[280px] md:h-[320px] lg:h-[350px] pt-4 px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filteredProductGroupData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="group" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            cursor={{ fill: "#F5F5F5" }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

/* ================= Props ================= */
interface DashboardClientProps {
  data: DashboardData;
}

/* ================= Component ================= */
export default function DashboardClient({ data }: DashboardClientProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(data);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  const { periodData, ytd } = dashboardData;
  const [overviewPeriod, setOverviewPeriod] =
    useState<DashboardPeriod>("month");
  const [regionPeriod, setRegionPeriod] = useState<DashboardPeriod>("month");
  const [productGroupPeriod, setProductGroupPeriod] =
    useState<DashboardPeriod>("month");

  const periodOptions: { value: DashboardPeriod; label: string }[] = [
    { value: "day", label: "วัน" },
    { value: "month", label: "เดือน" },
    { value: "year", label: "ปี" },
  ];

  const periodLabels: Record<DashboardPeriod, string> = {
    day: "วันนี้",
    month: "เดือนนี้",
    year: "ปีนี้",
  };

  const monthlySales = periodData[overviewPeriod].monthlySales;
  const target = periodData[overviewPeriod].target;
  const regionData = periodData[regionPeriod].regionData;
  const productGroupData = periodData[productGroupPeriod].productGroupData;

  // State for managing visible product groups
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    () => new Set(productGroupData.map((p) => p.group)),
  );

  useEffect(() => {
    setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
  }, [productGroupData]);

  // Toggle group visibility
  const toggleGroup = (group: string) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Toggle all groups
  const toggleAllGroups = () => {
    if (visibleGroups.size === productGroupData.length) {
      setVisibleGroups(new Set());
    } else {
      setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
    }
  };

  // Filter product group data based on visible groups
  const filteredProductGroupData = useMemo(
    () => productGroupData.filter((p) => visibleGroups.has(p.group)),
    [productGroupData, visibleGroups],
  );

  const percent =
    target.target > 0 ? Math.round((target.current / target.target) * 100) : 0;
  const remaining = target.target - target.current;

  useEffect(() => {
    let isActive = true;
    const refreshDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard/admin", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const nextData: DashboardData = await response.json();
        if (!isActive) {
          return;
        }
        setDashboardData(nextData);
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.error("Failed to refresh dashboard data", error);
      }
    };

    setLastUpdatedAt(new Date());
    const intervalId = window.setInterval(refreshDashboard, 30000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-3 py-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* ================= Header - Mobile First ================= */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center w-full">
          {" "}
          {/* เพิ่ม items-center และ text-center */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {" "}
            {/* แก้เป็น justify-center */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent leading-tight">
                ภาพรวมแดชบอร์ด
              </h1>
            </div>
          </div>
          {/* เส้นประดับด้านล่าง ปรับให้กว้างขึ้นและอยู่กลาง */}
          <div className="mt-4 flex items-center gap-3 justify-center w-full max-w-sm">
            <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-blue-300 to-blue-500 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
            <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-blue-300 to-blue-500 rounded-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-end px-4 sm:px-4">
          {/* Last Updated Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-600 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-slate-200/60">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">อัปเดตล่าสุด </span>
            <span className="font-medium">
              {lastUpdatedAt.toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ================= Top KPI Cards - Responsive Grid ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Monthly Sales Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 group sm:col-span-2 xl:col-span-1">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 sm:w-40 sm:h-40 text-blue-600" />
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold">
                ยอดขาย{periodLabels[overviewPeriod]}
              </CardTitle>
              <div
                className={`flex items-center gap-1 ${monthlySales.growthPercent >= 0
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-rose-600 bg-rose-50"
                  } px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full`}
              >
                {monthlySales.growthPercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span className="text-[10px] sm:text-xs font-bold">
                  {monthlySales.growthPercent >= 0 ? "+" : ""}
                  {monthlySales.growthPercent}%
                </span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1 sm:mt-2 truncate">
              {formatCurrency(monthlySales.total)}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100">
                <p className="text-[10px] sm:text-xs font-semibold text-orange-600 uppercase tracking-wide">
                  Sales Note
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  {formatCurrency(monthlySales.salesNote)}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100">
                <p className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase tracking-wide">
                  Invoice
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  {formatCurrency(monthlySales.invoice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/25 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Target className="w-28 h-28 sm:w-36 sm:h-36" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-200 font-semibold">
                เป้ายอดขาย{periodLabels[overviewPeriod]}
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            {/* Main Amount Display */}
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                {formatCurrency(target.target)}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm text-center">
                <p className="text-[10px] sm:text-xs text-slate-200 mb-0.5">
                  ส่วนต่าง
                </p>
                <div className="text-sm sm:text-base font-bold text-white">
                  <span
                    className={`inline-flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold ${remaining <= 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                      }`}
                  >
                    {remaining <= 0 ? (
                      <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                    <span>
                      {remaining <= 0 ? "+" : "-"}
                      {formatTHBWithCompact(Math.abs(remaining))}
                    </span>
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm text-center">
                <p className="text-[10px] sm:text-xs text-slate-200 mb-0.5">
                  เปอร์เซ็นต์
                </p>
                <div
                  className={`inline-flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold ${remaining <= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                    }`}
                >
                  {remaining <= 0 ? (
                    <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                  <span>
                    {remaining <= 0 ? "+" : "-"}
                    {Math.abs(percent - 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YTD Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-28 h-28 sm:w-36 sm:h-36 text-amber-500" />
          </div>

          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold">
              ยอดขายสะสมทั้งปี (YTD)
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Main Amount */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                  {formatCurrency(ytd.total)}
                </div>
              </div>
            </div>

            {/* Progress to Target */}
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-1.5">
                <span>
                  {ytd.target > 0
                    ? Math.round((ytd.total / ytd.target) * 100)
                    : 0}
                  %
                </span>
                <span>เป้าหมาย: {formatCurrency(ytd.target)}</span>
              </div>
              <Progress
                value={
                  ytd.target > 0
                    ? Math.min((ytd.total / ytd.target) * 100, 100)
                    : 0
                }
                className="h-2 sm:h-2.5 rounded-full bg-amber-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 [&>div]:rounded-full"
              />
            </div>

            {/* Growth & Remaining Info */}
            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              <div
                className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold ${ytd.growthPercent >= 0
                  ? "text-emerald-700 bg-emerald-100/80"
                  : "text-rose-700 bg-rose-100/80"
                  } px-2 sm:px-3 py-1 sm:py-1.5 rounded-full`}
              >
                {ytd.growthPercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {ytd.growthPercent >= 0 ? "+" : ""}
                {ytd.growthPercent}%
                <span className="text-slate-400 font-normal ml-1">
                  จากปีที่แล้ว
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-500">คงเหลือ</p>
                <p
                  className={`text-xs sm:text-sm font-bold ${ytd.total >= ytd.target
                    ? "text-emerald-600"
                    : "text-red-600"
                    }`}
                >
                  {ytd.total >= ytd.target ? "+" : "-"}
                  {formatCurrency(Math.abs(ytd.target - ytd.total))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Charts - Responsive ================= */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
        {/* Region Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="pb-2 sm:pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                  <Map className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                    ยอดขายรายภาคเดือนนี้
                  </CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>
          <RegionChart regionData={regionData} />
        </Card>

        {/* Product Group Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="pb-2 sm:pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                    ยอดขายตามกรุ๊ปสินค้าเดือนนี้
                  </CardTitle>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Group Filter Toggle Info */}
                <div className="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {visibleGroups.size}/{productGroupData.length} กรุ๊ป
                </div>
              </div>
            </div>

            {/* Group Selection UI */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                  เลือกกรุ๊ปที่ต้องการแสดง:
                </span>
                <button
                  onClick={toggleAllGroups}
                  className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  {visibleGroups.size === productGroupData.length
                    ? "ซ่อนทั้งหมด"
                    : "เลือกทั้งหมด"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {productGroupData.map((group) => {
                  const isVisible = visibleGroups.has(group.group);
                  return (
                    <button
                      key={group.group}
                      onClick={() => toggleGroup(group.group)}
                      className={`
                        inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium
                        transition-all duration-200 border
                        ${isVisible
                          ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-transparent shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                        }
                      `}
                    >
                      <span
                        className={`w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded border-2 transition-colors ${isVisible
                          ? "bg-white border-white"
                          : "border-slate-300"
                          }`}
                      >
                        {isVisible && (
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                        )}
                      </span>
                      {group.group}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <ProductGroupChart filteredProductGroupData={filteredProductGroupData} />
        </Card>
      </div>
    </div>
  );
}
