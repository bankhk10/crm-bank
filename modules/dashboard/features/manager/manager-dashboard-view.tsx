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
  Activity,
  CalendarDays,
  Tags,
} from "lucide-react";
import type { DashboardData, DashboardPeriod } from "../../types";

/* ================= Hook ================= */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
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

/* ================= Period Pill ================= */
interface PeriodSwitcherProps {
  value: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
  options: { value: DashboardPeriod; label: string }[];
  variant?: "light" | "dark";
}

function PeriodSwitcher({ value, onChange, options, variant = "light" }: PeriodSwitcherProps) {
  const base =
    variant === "dark"
      ? "bg-white/10 border border-white/20"
      : "bg-slate-100/80 border border-slate-200/60";
  const activeClass =
    variant === "dark"
      ? "bg-white text-slate-900 shadow-md"
      : "bg-white text-slate-900 shadow-md";
  const inactiveClass =
    variant === "dark"
      ? "text-white/70 hover:text-white hover:bg-white/10"
      : "text-slate-500 hover:text-slate-700 hover:bg-white/60";

  return (
    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${base}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 ${value === opt.value ? activeClass : inactiveClass
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ================= Chart Sub-Components ================= */
const CHART_BARS = [
  { dataKey: "lastYearInvoice", name: "ยอดขาย (ปีที่แล้ว)", fill: "#a855f7" },
  { dataKey: "target", name: "Target", fill: "#3b82f6" },
  { dataKey: "salesNote", name: "Sales Note", fill: "#f97316" },
  { dataKey: "invoice", name: "Invoice", fill: "#22c55e" },
] as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 20px 60px -10px rgba(0,0,0,0.25)",
  fontSize: 12,
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(12px)",
};

function RegionChart({ regionData }: { regionData: { region: string; lastYearInvoice: number; target: number; salesNote: number; invoice: number }[] }) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? Math.max(280, regionData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionData} layout="vertical" margin={{ left: 4, right: 16, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tickFormatter={(v) => formatCompact(v)} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="region"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={72}
              tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                const MAX_CHARS = 10;
                const raw: string = payload.value.replace(/^ภาค/, "");
                const label = raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) + "…" : raw;
                return (
                  <text x={68} y={y} dy="0.35em" textAnchor="end" fontSize={10} fill="#64748b">
                    {label}
                  </text>
                );
              }}
            />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
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
          <XAxis dataKey="region" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis tickFormatter={(v) => `${v / 1000}k`} fontSize={10} tickLine={false} axisLine={false} width={50} tick={{ fill: "#94a3b8" }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

function ProductGroupChart({ filteredProductGroupData }: { filteredProductGroupData: { group: string; lastYearInvoice: number; target: number; salesNote: number; invoice: number }[] }) {
  const isMobile = useIsMobile();

  if (filteredProductGroupData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">กรุณาเลือกประเภท (ABC Code) ที่ต้องการแสดง</p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile ? Math.max(280, filteredProductGroupData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredProductGroupData} layout="vertical" margin={{ left: 4, right: 16, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tickFormatter={(v) => formatCompact(v)} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="group" fontSize={10} tickLine={false} axisLine={false} width={80} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
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
          <XAxis dataKey="group" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis tickFormatter={(v) => `${v / 1000}k`} fontSize={10} tickLine={false} axisLine={false} width={50} tick={{ fill: "#94a3b8" }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

function TradeNameGroupChart({ filteredTradeNameGroupData }: { filteredTradeNameGroupData: { group: string; lastYearInvoice: number; target: number; salesNote: number; invoice: number }[] }) {
  const isMobile = useIsMobile();

  if (filteredTradeNameGroupData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <Tags className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">กรุณาเลือกกลุ่มชื่อการค้า ที่ต้องการแสดง</p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile ? Math.max(280, filteredTradeNameGroupData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredTradeNameGroupData} layout="vertical" margin={{ left: 4, right: 16, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tickFormatter={(v) => formatCompact(v)} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="group" fontSize={10} tickLine={false} axisLine={false} width={80} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
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
        <BarChart data={filteredTradeNameGroupData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="group" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis tickFormatter={(v) => `${v / 1000}k`} fontSize={10} tickLine={false} axisLine={false} width={50} tick={{ fill: "#94a3b8" }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

/* ================= Props ================= */
interface AdminDashboardViewProps {
  initialData: DashboardData;
}

/* ================= Component ================= */
export default function AdminDashboardView({ initialData }: AdminDashboardViewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  const { periodData, ytd } = dashboardData;
  const [overviewPeriod, setOverviewPeriod] = useState<DashboardPeriod>("month");
  const [regionPeriod, setRegionPeriod] = useState<DashboardPeriod>("month");
  const [productGroupPeriod, setProductGroupPeriod] = useState<DashboardPeriod>("month");
  const [tradeNameGroupPeriod, setTradeNameGroupPeriod] = useState<DashboardPeriod>("month");

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
  const productGroupData = periodData[productGroupPeriod].productGroupData || [];
  const tradeNameGroupData = periodData[tradeNameGroupPeriod].tradeNameGroupData || [];

  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    () => new Set(productGroupData.map((p) => p.group)),
  );

  useEffect(() => {
    setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
  }, [productGroupData]);

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

  const toggleAllGroups = () => {
    if (visibleGroups.size === productGroupData.length) {
      setVisibleGroups(new Set());
    } else {
      setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
    }
  };

  const filteredProductGroupData = useMemo(
    () => productGroupData.filter((p) => visibleGroups.has(p.group)),
    [productGroupData, visibleGroups],
  );

  const [visibleTradeNameGroups, setVisibleTradeNameGroups] = useState<Set<string>>(
    () => new Set(tradeNameGroupData.map((p) => p.group)),
  );

  useEffect(() => {
    setVisibleTradeNameGroups(new Set(tradeNameGroupData.map((p) => p.group)));
  }, [tradeNameGroupData]);

  const toggleTradeNameGroup = (group: string) => {
    setVisibleTradeNameGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const toggleAllTradeNameGroups = () => {
    if (visibleTradeNameGroups.size === tradeNameGroupData.length) {
      setVisibleTradeNameGroups(new Set());
    } else {
      setVisibleTradeNameGroups(new Set(tradeNameGroupData.map((p) => p.group)));
    }
  };

  const filteredTradeNameGroupData = useMemo(
    () => tradeNameGroupData.filter((p) => visibleTradeNameGroups.has(p.group)),
    [tradeNameGroupData, visibleTradeNameGroups],
  );

  const percent = target.target > 0 ? Math.round((target.current / target.target) * 100) : 0;
  const remaining = target.target - target.current;
  const ytdPercent = ytd.target > 0 ? Math.min(Math.round((ytd.total / ytd.target) * 100), 100) : 0;

  useEffect(() => {
    setLastUpdatedAt(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f8] px-3 py-4 sm:p-6 md:p-8 lg:p-10 space-y-5 sm:space-y-7 lg:space-y-8">

      {/* ================= Header - Mobile First ================= */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center w-full">
          {" "}
          <div className="flex items-center justify-center gap-3 mb-3">
            {" "}
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
          <div className="mt-4 flex items-center gap-3 justify-center w-full max-w-sm">
            <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-blue-300 to-blue-500 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
            <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-blue-300 to-blue-500 rounded-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-end px-4 sm:px-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-600 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-slate-200/60">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full" />
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

      {/* ================= KPI Cards ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">

        {/* Monthly Sales Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all duration-300 group sm:col-span-2 xl:col-span-1">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          {/* Background icon */}
          <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
            <DollarSign className="w-36 h-36 text-blue-600" />
          </div>

          <CardHeader className="pb-1 sm:pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold">
                  ยอดขาย {periodLabels[overviewPeriod]}
                </CardTitle>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${monthlySales.growthPercent >= 0
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                  : "text-rose-700 bg-rose-50 border border-rose-100"
                  }`}
              >
                {monthlySales.growthPercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {monthlySales.growthPercent >= 0 ? "+" : ""}{monthlySales.growthPercent}%
              </div>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 truncate">
              {formatCurrency(monthlySales.total)}
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                <p className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">
                  Sales Note
                </p>
                <p className="text-base sm:text-lg font-black text-slate-800">
                  {formatCurrency(monthlySales.salesNote)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
                  Invoice
                </p>
                <p className="text-base sm:text-lg font-black text-slate-800">
                  {formatCurrency(monthlySales.invoice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Card — dark */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
          {/* Decorative effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10" />
          <div className="absolute -right-6 -top-6 opacity-[0.06]">
            <Target className="w-36 h-36" />
          </div>

          <CardHeader className="pb-1 sm:pb-2 pt-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-300 font-bold">
                  เป้ายอดขาย {periodLabels[overviewPeriod]}
                </CardTitle>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2 truncate">
              {formatCurrency(target.target)}
            </div>
          </CardHeader>

          <CardContent className="pb-5 relative">
            {/* Progress ring replaced by horizontal bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mb-1.5">
                <span>ความคืบหน้า</span>
                <span className="font-bold text-white">{percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${remaining <= 0
                    ? "bg-gradient-to-r from-emerald-400 to-green-500"
                    : "bg-gradient-to-r from-blue-400 to-indigo-500"
                    }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <p className="text-[10px] sm:text-xs text-slate-400 mb-1">ส่วนต่าง</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${remaining <= 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                >
                  {remaining <= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {remaining <= 0 ? "+" : "-"}{formatTHBWithCompact(Math.abs(remaining))}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <p className="text-[10px] sm:text-xs text-slate-400 mb-1">เปอร์เซ็นต์</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${remaining <= 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                >
                  {remaining <= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {remaining <= 0 ? "+" : "-"}{Math.abs(percent - 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YTD Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-amber-200/50 hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
          <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
            <Sparkles className="w-36 h-36 text-amber-500" />
          </div>

          <CardHeader className="pb-1 sm:pb-2 pt-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-100">
                <CalendarDays className="w-4 h-4 text-amber-600" />
              </div>
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold">
                ยอดขายสะสมทั้งปี (YTD)
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pb-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 truncate">
                {formatCurrency(ytd.total)}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium">
                <span className="font-bold text-amber-600">{ytdPercent}%</span>
                <span>เป้า: {formatCurrency(ytd.target)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                  style={{ width: `${ytdPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div
                className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full border ${ytd.growthPercent >= 0
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : "text-rose-700 bg-rose-50 border-rose-100"
                  }`}
              >
                {ytd.growthPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {ytd.growthPercent >= 0 ? "+" : ""}{ytd.growthPercent}%
                <span className="text-slate-400 font-normal ml-0.5">จากปีที่แล้ว</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-400">คงเหลือ</p>
                <p className={`text-xs sm:text-sm font-black ${ytd.total >= ytd.target ? "text-emerald-600" : "text-red-500"}`}>
                  {ytd.total >= ytd.target ? "+" : "-"}{formatCurrency(Math.abs(ytd.target - ytd.total))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Charts ================= */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">

        {/* Region Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-100 shadow-sm">
                  <Map className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                    ยอดขายรายภาค
                  </CardTitle>
                </div>
              </div>
              <PeriodSwitcher
                value={regionPeriod}
                onChange={setRegionPeriod}
                options={periodOptions}
                variant="light"
              />
            </div>
          </CardHeader>
          <RegionChart regionData={regionData} />
        </Card>

        {/* Product Group Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-100 shadow-sm">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                    ยอดขายตามประเภท (ABC Code)
                  </CardTitle>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                    แสดง {visibleGroups.size}/{productGroupData.length} ประเภท
                  </p>
                </div>
              </div>
              <PeriodSwitcher
                value={productGroupPeriod}
                onChange={setProductGroupPeriod}
                options={periodOptions}
                variant="light"
              />
            </div>

            {/* Group filter */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                  เลือกประเภทที่ต้องการแสดง:
                </span>
                <button
                  onClick={toggleAllGroups}
                  className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 font-bold transition-colors hover:underline"
                >
                  {visibleGroups.size === productGroupData.length ? "ซ่อนทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {productGroupData.map((group) => {
                  const isVisible = visibleGroups.has(group.group);
                  return (
                    <button
                      key={group.code}
                      onClick={() => toggleGroup(group.group)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold
                        transition-all duration-200 border
                        ${isVisible
                          ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white border-transparent shadow-md shadow-purple-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                        }
                      `}
                    >
                      <span
                        className={`w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 transition-colors ${isVisible ? "bg-white border-white" : "border-slate-300"
                          }`}
                      >
                        {isVisible && <CheckCircle2 className="w-2.5 h-2.5 text-purple-600" />}
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

        {/* Trade Name Group Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-100 shadow-sm">
                  <Tags className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                    ยอดขายรวมของกลุ่มชื่อการค้า
                  </CardTitle>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                    แสดง {visibleTradeNameGroups.size}/{tradeNameGroupData.length} กลุ่ม
                  </p>
                </div>
              </div>
              <PeriodSwitcher
                value={tradeNameGroupPeriod}
                onChange={setTradeNameGroupPeriod}
                options={periodOptions}
                variant="light"
              />
            </div>

            {/* Filter */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                  เลือกกลุ่มที่ต้องการแสดง:
                </span>
                <button
                  onClick={toggleAllTradeNameGroups}
                  className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-colors hover:underline"
                >
                  {visibleTradeNameGroups.size === tradeNameGroupData.length ? "ซ่อนทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {tradeNameGroupData.map((group) => {
                  const isVisible = visibleTradeNameGroups.has(group.group);
                  return (
                    <button
                      key={group.code}
                      onClick={() => toggleTradeNameGroup(group.group)}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold
                        transition-all duration-200 border
                        ${isVisible
                          ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-transparent shadow-md shadow-indigo-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        }
                      `}
                    >
                      <span
                        className={`w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 transition-colors ${isVisible ? "bg-white border-white" : "border-slate-300"
                          }`}
                      >
                        {isVisible && <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />}
                      </span>
                      {group.group}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <TradeNameGroupChart filteredTradeNameGroupData={filteredTradeNameGroupData} />
        </Card>
      </div>
    </div>
  );
}
