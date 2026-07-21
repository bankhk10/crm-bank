"use client";

import React, { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  Activity,
  Leaf,
  TrendingUp,
  ChevronRight,
  Download,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Wallet,
  Target,
  ArrowUpRight,
} from "lucide-react";
import {
  MOCK_ACTIVITY_SUMMARY,
  MOCK_BUDGET_SUMMARY,
  MOCK_SALES_SUMMARY,
  MOCK_PLOT_HEALTH_SUMMARY,
  MOCK_WEEKLY_COMPARISON,
  MOCK_ACTIVITY_TYPE_BREAKDOWN,
  YEAR_OPTIONS,
  MONTH_OPTIONS,
  ZONE_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  RESPONSIBLE_OPTIONS,
} from "../infrastructure/mock-data-dashboard";

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(n);

// ─────────────────────────────────────
// Animated Donut – used inside KPI 1
// ─────────────────────────────────────
function ActivityDonut({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = Math.round((completed / total) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="donutGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="8"
        opacity="0.5"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#donutGrad)"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        filter="url(#donutGlow)"
        className="transition-all duration-1000 ease-out"
      />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="#1e293b"
      >
        {pct}%
      </text>
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontSize="9"
        fontWeight="500"
        fill="#94a3b8"
      >
        สำเร็จ
      </text>
    </svg>
  );
}

// ─────────────────────────────────────
// Custom Bar Tooltip
// ─────────────────────────────────────
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl px-4 py-3 shadow-2xl border border-white/10">
      <p className="font-bold mb-1.5 text-white/60 uppercase tracking-wider text-[10px]">
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-bold text-white ml-auto">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────
// Custom Pie Tooltip
// ─────────────────────────────────────
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { percent: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl px-4 py-3 shadow-2xl border border-white/10">
      <p className="font-bold text-white/90">{d.name}</p>
      <p className="mt-1 text-white/60">
        {d.payload.percent}% —{" "}
        <span className="font-bold text-white">{fmt(d.value)} ทริป</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────
// Custom Pie Center Label
// ─────────────────────────────────────
function PieCenterLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="10"
        fill="#94a3b8"
        fontWeight="500"
      >
        รวมทั้งหมด
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#1e293b"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        fontSize="10"
        fill="#94a3b8"
        fontWeight="500"
      >
        ทริป
      </text>
    </>
  );
}

// ─────────────────────────────────────
// FilterSelect helper
// ─────────────────────────────────────
function FilterSelect({
  icon,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  icon?: React.ReactNode;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 text-sm bg-white/80 backdrop-blur-sm border-slate-200/60 min-w-[130px] gap-1 rounded-xl hover:border-indigo-300 transition-colors">
        {icon && <span className="text-slate-400">{icon}</span>}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────
// Section Header component
// ─────────────────────────────────────
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-100">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Main Component
// ─────────────────────────────────────
export function ActivityDashboard() {
  const [year, setYear] = useState("ปี 2568");
  const [month, setMonth] = useState("พฤษภาคม");
  const [zone, setZone] = useState("ทั้งหมด");
  const [activityType, setActivityType] = useState("ทั้งหมด");
  const [responsible, setResponsible] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  const actSummary = MOCK_ACTIVITY_SUMMARY;
  const budgetSummary = MOCK_BUDGET_SUMMARY;
  const salesSummary = MOCK_SALES_SUMMARY;
  const plotHealth = MOCK_PLOT_HEALTH_SUMMARY;
  const weeklyData = MOCK_WEEKLY_COMPARISON;
  const pieData = MOCK_ACTIVITY_TYPE_BREAKDOWN;
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const approvalTotal = actSummary.approved + actSummary.pending;
  const approvalData = [
    {
      name: "อนุมัติแล้ว",
      value: actSummary.approved,
      color: "#10b981",
      percent: Math.round((actSummary.approved / approvalTotal) * 100),
    },
    {
      name: "รออนุมัติ",
      value: actSummary.pending,
      color: "#f59e0b",
      percent: Math.round((actSummary.pending / approvalTotal) * 100),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ═══ Header ═══ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/60 shadow-lg shadow-indigo-500/5">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 p-5 md:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg">
              <Sparkles className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Dashboard Activity
              </h1>
              <p className="text-xs md:text-sm text-white/70 mt-0.5 font-medium">
                ภาพรวมกิจกรรมและผลการดำเนินงาน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl text-xs font-semibold gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl text-xs font-semibold gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              รีเฟรช
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Filter Bar / Time Selector ═══ */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col lg:flex-row gap-5 lg:items-center">
        {/* Year Selector */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
            <Calendar className="w-3 h-3 text-indigo-400" />
            ปีการดำเนินงาน
          </span>
          <div className="flex bg-slate-50/80 p-1 rounded-xl border border-slate-200/50 gap-1 self-start">
            {YEAR_OPTIONS.map((y) => {
              const active = year === y;
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/80"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider (visible on desktop) */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

        {/* Month Selector */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
            <Calendar className="w-3 h-3 text-blue-400" />
            ช่วงเดือน
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mb-2 scrollbar-none">
            {MONTH_OPTIONS.map((m) => {
              const active = month === m;
              return (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap duration-300 border ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 border-transparent text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                      : "bg-white/80 border-slate-200/60 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: กิจกรรมทั้งหมด */}
        <div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden">
          {/* Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              กิจกรรมทั้งหมด
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="pt-4 mx-8">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none">
                {fmt(actSummary.total)}
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                กิจกรรม
              </span>
            </div>
            <ActivityDonut
              completed={actSummary.completed}
              total={actSummary.total}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>
                สำเร็จ:{" "}
                <span className="font-bold text-slate-700">
                  {actSummary.completed}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>
                กำลังทำ:{" "}
                <span className="font-bold text-slate-700">
                  {actSummary.inProgress}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>
                รออนุมัติ:{" "}
                <span className="font-bold text-slate-700">
                  {actSummary.pending}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>
                ยกเลิก:{" "}
                <span className="font-bold text-slate-700">
                  {actSummary.cancelled}
                </span>
              </span>
            </span>
          </div>

          <button className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-700 mt-auto group/btn transition-colors">
            ดูรายละเอียด{" "}
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* KPI 2: งบประมาณรวมที่อนุมัติ */}
        <div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              งบประมาณรวมที่อนุมัติ
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-none">
              {fmt(budgetSummary.totalApproved)}
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              บาท
            </span>
          </div>

          <div className="space-y-2">
            {budgetSummary.breakdown.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.label}
                  </span>
                  <span className="font-bold text-slate-700">
                    {fmt(b.amount)} ฿
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${b.percent}%`,
                      backgroundColor: b.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-700 mt-auto group/btn transition-colors">
            ดูรายละเอียด{" "}
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* KPI 3: ยอดขายจากกิจกรรม */}
        <div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              ยอดขายจากกิจกรรม
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-none">
              {fmt(salesSummary.totalSales)}
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              บาท
            </span>
          </div>

          {/* ROI badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-lg text-xs font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              ROI {salesSummary.roi}%
            </div>
          </div>

          <button className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-700 mt-auto group/btn transition-colors">
            ดูรายละเอียด{" "}
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* KPI 4: สุขภาพแปลงสาธิต */}
        <div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-400" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/20">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              สุขภาพแปลงสาธิต
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent leading-none">
              {fmt(plotHealth.totalPlots)}
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              แปลง
            </span>
          </div>

          {/* Health bar – stacked with gap */}
          <div className="space-y-2">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full transition-all duration-700"
                style={{ width: `${plotHealth.good}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700"
                style={{ width: `${plotHealth.fair}%` }}
              />
              <div
                className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full transition-all duration-700"
                style={{ width: `${plotHealth.poor}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                สมบูรณ์{" "}
                <span className="font-bold text-emerald-600">
                  {plotHealth.good}%
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                ปานกลาง{" "}
                <span className="font-bold text-amber-600">
                  {plotHealth.fair}%
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                ทรุดโทรม{" "}
                <span className="font-bold text-rose-600">
                  {plotHealth.poor}%
                </span>
              </span>
            </div>
          </div>

          <button className="flex items-center gap-1 text-xs font-bold text-teal-500 hover:text-teal-700 mt-auto group/btn transition-colors">
            ดูรายละเอียด{" "}
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart: Plan vs Actual – 3/5 width */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-lg transition-shadow duration-300">
          <SectionHeader
            icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
            title="เปรียบเทียบแผนงาน (Plan) กับ สิ่งที่ทำจริง (Actual)"
            subtitle="จำนวนทริป (ครั้ง) ตลอดเดือน"
          />

          {/* Legend */}
          <div className="flex items-center gap-4 mb-5">
            {[
              { color: "#cbd5e1", label: "แผนงาน (Plan)" },
              { color: "#6366f1", label: "ทำจริง (Actual)" },
              { color: "#f59e0b", label: "กำลังทำ (In Progress)" },
            ].map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"
              >
                <span
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={weeklyData}
              margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              barGap={4}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "rgba(99,102,241,0.04)" }}
              />
              <Bar
                dataKey="plan"
                name="แผนงาน (Plan)"
                fill="#cbd5e1"
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#94a3b8",
                }}
              />
              <Bar
                dataKey="actual"
                name="ทำจริง (Actual)"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#6366f1",
                }}
              />
              <Bar
                dataKey="inProgress"
                name="กำลังทำ (In Progress)"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#d97706",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Approval Status Breakdown – 2/5 width */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-lg transition-shadow duration-300">
          <SectionHeader
            icon={<PieIcon className="w-4 h-4 text-emerald-500" />}
            title="สถานะการอนุมัติกิจกรรม"
            subtitle="สัดส่วนการอนุมัติทริปกิจกรรมทั้งหมด"
          />

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={approvalData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {approvalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              {/* Center label */}
              <text
                x="50%"
                y="44%"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                ยื่นขออนุมัติ
              </text>
              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill="#1e293b"
              >
                {approvalTotal}
              </text>
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                ทริป
              </text>
            </PieChart>
          </ResponsiveContainer>

          {/* Legend cards */}
          <div className="space-y-2 mt-3">
            {approvalData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span
                    className="w-3 h-3 rounded-md flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {item.value} ทริป
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
