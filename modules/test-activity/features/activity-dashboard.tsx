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
// Donut segment component for KPI 1
// ─────────────────────────────────────
function ActivityDonut({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = Math.round((completed / total) * 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
      />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text
        x="44"
        y="48"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#1e293b"
      >
        {pct}%
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
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-1 text-white/70">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-white">{fmt(p.value)}</span>
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
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold">{d.name}</p>
      <p>
        {d.payload.percent}% —{" "}
        <span className="font-bold">{fmt(d.value)} ทริป</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────
// Custom Pie Label (center text)
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
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#64748b">
        รวมทั้งหมด
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#1e293b"
      >
        {total}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="#64748b">
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
      <SelectTrigger className="h-9 text-sm bg-white border-slate-200 min-w-[130px] gap-1">
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

  return (
    <div className="space-y-5">
      {/* ═══ Header ═══ */}
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-50/30 via-indigo-50/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Activity
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              ภาพรวมกิจกรรมและผลการดำเนินงาน
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Filter Bar / Time Selector ═══ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col lg:flex-row gap-5 lg:items-center">
        {/* Year Selector */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            ปีการดำเนินงาน
          </span>
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50 gap-1 self-start">
            {YEAR_OPTIONS.map((y) => {
              const active = year === y;
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider (visible on desktop) */}
        <div className="hidden lg:block w-px h-10 bg-slate-200/60" />

        {/* Month Selector */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            ช่วงเดือน
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mb-2 scrollbar-none">
            {MONTH_OPTIONS.map((m) => {
              const active = month === m;
              return (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap duration-200 border ${
                    active
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15"
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              กิจกรรมทั้งหมด
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="text-4xl font-bold text-blue-600 leading-none">
                {fmt(actSummary.total)}
              </div>
            </div>
            <ActivityDonut
              completed={actSummary.completed}
              total={actSummary.total}
            />
          </div>

          <div className="flex gap-4 text-xs text-slate-500">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
              อนุมัติ{" "}
              <span className="font-semibold text-slate-700">
                {actSummary.completed}
              </span>
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />
              รออนุมัติ{" "}
              <span className="font-semibold text-slate-700">
                {actSummary.inProgress}
              </span>
            </span>
          </div>

          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-auto">
            ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* KPI 2: งบประมาณรวมที่อนุมัติ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              งบประมาณรวมที่อนุมัติ
            </span>
          </div>

          <div className="text-3xl font-bold text-emerald-600 leading-none">
            {fmt(budgetSummary.totalApproved)}{" "}
            <span className="text-lg font-semibold text-slate-500">บาท</span>
          </div>

          <div className="space-y-1.5">
            {budgetSummary.breakdown.map((b) => (
              <div
                key={b.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  {b.label}
                  <span className="font-semibold text-slate-800">
                    {b.percent}%
                  </span>
                </span>
                <span className="font-semibold text-slate-700">
                  {fmt(b.amount)} บาท
                </span>
              </div>
            ))}
          </div>

          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-auto">
            ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* KPI 3: ยอดขายจากกิจกรรม */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              ยอดขายจากกิจกรรม
            </span>
          </div>

          <div className="text-3xl font-bold text-orange-500 leading-none mt-8 mx-4">
            {fmt(salesSummary.totalSales)}{" "}
            <span className="text-lg font-semibold text-slate-500">บาท</span>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-auto">
            ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* KPI 4: สุขภาพแปลงสาธิต */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">
                สุขภาพแปลงสาธิต
              </div>
            </div>
          </div>

          <div className="text-3xl font-bold text-emerald-600 leading-none">
            {fmt(plotHealth.totalPlots)}{" "}
            <span className="text-lg font-semibold text-slate-500">แปลง</span>
          </div>

          {/* Health bar */}
          <div className="space-y-1">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <div
                className="bg-emerald-500 rounded-l-full"
                style={{ width: `${plotHealth.good}%` }}
              />
              <div
                className="bg-amber-400"
                style={{ width: `${plotHealth.fair}%` }}
              />
              <div
                className="bg-rose-500 rounded-r-full"
                style={{ width: `${plotHealth.poor}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                สมบูรณ์{" "}
                <span className="font-bold text-emerald-700">
                  {plotHealth.good}%
                </span>
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />
                ปานกลาง{" "}
                <span className="font-bold text-amber-600">
                  {plotHealth.fair}%
                </span>
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1" />
                <span className="text-rose-600 font-semibold">ทรุดโทรม</span>{" "}
                <span className="font-bold text-rose-600">
                  {plotHealth.poor}%
                </span>
              </span>
            </div>
          </div>

          <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-auto">
            ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart: Plan vs Actual */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">
              เปรียบเทียบแผนงาน (Plan) กับ สิ่งที่ทำจริง (Actual) ตลอดเดือน
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">จำนวนทริป (ครั้ง)</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-slate-300" />
              แผนงาน (Plan)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-blue-500" />
              ทำจริง (Actual)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-amber-500" />
              กำลังทำ (In Progress)
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
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
                tick={{ fontSize: 12, fill: "#94a3b8" }}
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
              <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar
                dataKey="plan"
                name="แผนงาน (Plan)"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 12,
                  fontWeight: 600,
                  fill: "#64748b",
                }}
              />
              <Bar
                dataKey="actual"
                name="ทำจริง (Actual)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 12,
                  fontWeight: 600,
                  fill: "#3b82f6",
                }}
              />
              <Bar
                dataKey="inProgress"
                name="กำลังทำ (In Progress)"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                label={{
                  position: "top",
                  fontSize: 12,
                  fontWeight: 600,
                  fill: "#d97706",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Activity Type Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-800">
              สัดส่วนกิจกรรม {actSummary.total} ทริป
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                {/* Center Label rendered as custom label */}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label overlay */}
          <div className="relative -mt-[220px] flex items-center justify-center h-[220px] pointer-events-none">
            <div className="text-center">
              <div className="text-xs text-slate-400">รวมทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-900 leading-tight">
                {actSummary.total}
              </div>
              <div className="text-xs text-slate-400">ทริป</div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-1">
            {pieData.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-slate-700">{d.name}</span>
                </div>
                <div className="text-slate-500 text-xs">
                  <span className="font-bold text-slate-800">{d.percent}%</span>{" "}
                  ({d.value} ทริป)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
