"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
} from "recharts";
import { mockTripPlans, TripPlanMock } from "../infrastructure/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Target as TargetIcon,
  Eye,
  ClipboardList,
  LayoutDashboard,
  SlidersHorizontal,
  RotateCcw,
  Banknote,
  Clock,
  CheckCheck,
  Ban,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Palette ─────────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#3b82f6",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(n);

const STATUS_CONFIG: Record<
  TripPlanMock["status"],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    label: "รออนุมัติ",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  FINISHED: {
    label: "เสร็จสิ้น",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
};

function StatusBadge({ status }: { status: TripPlanMock["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-1 text-white/70">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#a5b4fc" }}>
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold">{p.name}</p>
      <p className="text-indigo-300 font-bold">{fmt(p.value)} บาท</p>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
}
function KpiCard({ label, value, sub, icon, gradient }: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ${gradient} shadow-sm border border-white/50`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 truncate">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-white mt-1 leading-tight truncate">
            {value}
          </p>
          <p className="text-[10px] text-white/55 mt-1">{sub}</p>
        </div>
        <div className="shrink-0 h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </div>
      {/* decorative circle */}
      <div className="absolute -bottom-5 -right-5 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {description && (
          <p className="text-xs text-slate-400 leading-tight">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────
function FilterSelect({
  label,
  value,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400">
          <SelectValue placeholder="ทั้งหมด" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Detail Field ─────────────────────────────────────────────────────────────
function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TripPlanReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobType, setJobType] = useState("all");
  const [status, setStatus] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [approver, setApprover] = useState("all");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [budgetType, setBudgetType] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<TripPlanMock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const uniqueOptions = useMemo(
    () => ({
      jobTypes: Array.from(new Set(mockTripPlans.map((d) => d.jobType))),
      employees: Array.from(new Set(mockTripPlans.map((d) => d.responsible))),
      targetTypes: Array.from(new Set(mockTripPlans.map((d) => d.targetType))),
      budgetTypes: Array.from(new Set(mockTripPlans.map((d) => d.budgetType))),
    }),
    [],
  );

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setJobType("all");
    setStatus("all");
    setResponsible("all");
    setApprover("all");
    setProvince("all");
    setDistrict("all");
    setTargetType("all");
    setBudgetType("all");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (status !== "all" && item.status !== status) return false;
      if (responsible !== "all" && item.responsible !== responsible)
        return false;
      if (approver !== "all" && item.approver !== approver) return false;
      if (province !== "all" && item.province !== province) return false;
      if (district !== "all" && item.district !== district) return false;
      if (targetType !== "all" && item.targetType !== targetType) return false;
      if (budgetType !== "all" && item.budgetType !== budgetType) return false;
      return true;
    });
  }, [
    startDate,
    endDate,
    jobType,
    status,
    responsible,
    approver,
    province,
    district,
    targetType,
    budgetType,
  ]);

  const kpi = useMemo(
    () => ({
      total: filteredData.length,
      pending: filteredData.filter((i) => i.status === "PENDING").length,
      approved: filteredData.filter((i) => i.status === "APPROVED").length,
      rejected: filteredData.filter((i) => i.status === "REJECTED").length,
      cancelled: filteredData.filter((i) => i.status === "CANCELLED").length,
      finished: filteredData.filter((i) => i.status === "FINISHED").length,
      totalBudget: filteredData.reduce((acc, cur) => acc + cur.budget, 0),
    }),
    [filteredData],
  );

  const jobTypeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; count: number }> = {};
    filteredData.forEach((item) => {
      if (!g[item.jobType]) g[item.jobType] = { name: item.jobType, count: 0 };
      g[item.jobType].count += 1;
    });
    return Object.values(g);
  }, [filteredData]);

  const budgetTypeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; value: number }> = {};
    filteredData.forEach((item) => {
      if (!g[item.budgetType])
        g[item.budgetType] = { name: item.budgetType, value: 0 };
      g[item.budgetType].value += item.budget;
    });
    return Object.values(g);
  }, [filteredData]);

  const targetTypeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; count: number }> = {};
    filteredData.forEach((item) => {
      if (!g[item.targetType])
        g[item.targetType] = { name: item.targetType, count: 0 };
      g[item.targetType].count += 1;
    });
    return Object.values(g);
  }, [filteredData]);

  const employeeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; count: number; budget: number }> =
      {};
    filteredData.forEach((item) => {
      if (!g[item.responsible])
        g[item.responsible] = { name: item.responsible, count: 0, budget: 0 };
      g[item.responsible].count += 1;
      g[item.responsible].budget += item.budget;
    });
    return Object.values(g).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  const areaAnalytics = useMemo(() => {
    const g: Record<string, { name: string; count: number; budget: number }> =
      {};
    filteredData.forEach((item) => {
      if (!g[item.province])
        g[item.province] = { name: item.province, count: 0, budget: 0 };
      g[item.province].count += 1;
      g[item.province].budget += item.budget;
    });
    return Object.values(g).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md text-white">
              <LayoutDashboard className="h-4.5 w-4.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              รายงานแผนการออกปฏิบัติงาน
            </h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            วิเคราะห์และสรุปผลแผนงาน Trip Plan
          </p>
        </div>
      </div>

      {/* 1. Filter Card */}
      <Card className="rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-bold text-slate-700">ตัวกรองข้อมูล</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto h-8 px-3 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            ล้างตัวกรอง
          </Button>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <div className="grid gap-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition"
              />
            </div>
            <FilterSelect
              label="ประเภทงาน"
              value={jobType}
              onValueChange={(v) => {
                setJobType(v);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions.jobTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect
              label="สถานะ"
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setCurrentPage(1);
              }}
            >
              <SelectItem value="PENDING">รออนุมัติ</SelectItem>
              <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
              <SelectItem value="REJECTED">ไม่อนุมัติ</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              <SelectItem value="FINISHED">เสร็จสิ้น</SelectItem>
            </FilterSelect>
            <FilterSelect
              label="ผู้รับผิดชอบ"
              value={responsible}
              onValueChange={(v) => {
                setResponsible(v);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions.employees.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect
              label="ประเภทเป้าหมาย"
              value={targetType}
              onValueChange={(v) => {
                setTargetType(v);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions.targetTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect
              label="ประเภทงบประมาณ"
              value={budgetType}
              onValueChange={(v) => {
                setBudgetType(v);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions.budgetTypes.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </FilterSelect>
          </div>
        </CardContent>
      </Card>

      {/* 2. KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard
          label="แผนทั้งหมด"
          value={kpi.total}
          sub="แผนปฏิบัติงาน"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          icon={<ClipboardList className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="รออนุมัติ"
          value={kpi.pending}
          sub="รอการยืนยัน"
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          icon={<Clock className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="อนุมัติแล้ว"
          value={kpi.approved}
          sub="พร้อมดำเนินงาน"
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          icon={<CheckCircle2 className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="ไม่อนุมัติ"
          value={kpi.rejected}
          sub="ไม่ผ่านเงื่อนไข"
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          icon={<XCircle className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="ยกเลิก"
          value={kpi.cancelled}
          sub="ยกเลิกรายการ"
          gradient="bg-gradient-to-br from-slate-400 to-slate-600"
          icon={<Ban className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="เสร็จสิ้น"
          value={kpi.finished}
          sub="งานสำเร็จ"
          gradient="bg-gradient-to-br from-sky-400 to-blue-600"
          icon={<CheckCheck className="h-4 w-4 text-white" />}
        />
        <KpiCard
          label="งบประมาณรวม"
          value={fmt(kpi.totalBudget)}
          sub="บาท"
          gradient="bg-gradient-to-br from-fuchsia-500 to-purple-700"
          icon={<Banknote className="h-4 w-4 text-white" />}
        />
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar - ประเภทงาน */}
        <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
          <SectionHeader
            icon={<ClipboardList className="h-4 w-4" />}
            title="วิเคราะห์ตามประเภทงาน"
            description="จำนวนแผนจำแนกตามลักษณะงาน"
          />
          <CardContent className="px-2 pb-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobTypeAnalytics}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="count"
                  name="จำนวนแผน"
                  fill="url(#barGrad1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar - ประเภทเป้าหมาย */}
        <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
          <SectionHeader
            icon={<TargetIcon className="h-4 w-4" />}
            title="วิเคราะห์ตามประเภทเป้าหมาย"
            description="จำนวนแผนจำแนกตามประเภทเป้าหมาย"
          />
          <CardContent className="px-2 pb-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetTypeAnalytics}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="count"
                  name="จำนวนแผน"
                  fill="url(#barGrad2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut - งบประมาณ */}
        <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
          <SectionHeader
            icon={<DollarSign className="h-4 w-4" />}
            title="สัดส่วนประเภทงบประมาณ"
            description="งบประมาณสะสมตามประเภทงบ"
          />
          <CardContent className="px-2 pb-4 h-56 flex items-center justify-center">
            {budgetTypeAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetTypeAnalytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={75}
                    innerRadius={38}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {budgetTypeAnalytics.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">
                ไม่มีข้อมูลการใช้งบประมาณ
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* พนักงาน */}
        <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
          <SectionHeader
            icon={<TargetIcon className="h-4 w-4" />}
            title="ประสิทธิภาพพนักงาน"
            description="แผนงานและงบประมาณสะสมรายบุคคล"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-[11px] font-bold text-slate-400 px-5 py-3 uppercase tracking-wide">
                      ชื่อพนักงาน
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-400 text-center px-4 py-3 uppercase tracking-wide w-20">
                      แผน
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-400 text-right px-5 py-3 uppercase tracking-wide">
                      งบรวม (บาท)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeAnalytics.length > 0 ? (
                    employeeAnalytics.map((emp, idx) => (
                      <TableRow
                        key={emp.name}
                        className="hover:bg-indigo-50/40 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <TableCell className="text-xs font-semibold text-slate-700 px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            {emp.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3">
                          <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                            {emp.count}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right px-5 py-3 font-bold text-slate-900">
                          {fmt(emp.budget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-xs text-center py-8 text-slate-400"
                      >
                        ไม่มีข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* พื้นที่ */}
        <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
          <SectionHeader
            icon={<MapPin className="h-4 w-4" />}
            title="ความหนาแน่นตามพื้นที่"
            description="สรุปข้อมูลรายจังหวัด"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-[11px] font-bold text-slate-400 px-5 py-3 uppercase tracking-wide">
                      จังหวัด
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-400 text-center px-4 py-3 uppercase tracking-wide w-20">
                      แผน
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-400 text-right px-5 py-3 uppercase tracking-wide">
                      งบรวม (บาท)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaAnalytics.length > 0 ? (
                    areaAnalytics.map((area, idx) => (
                      <TableRow
                        key={area.name}
                        className="hover:bg-indigo-50/40 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <TableCell className="text-xs font-semibold text-slate-700 px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            {area.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center px-4 py-3">
                          <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                            {area.count}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right px-5 py-3 font-bold text-slate-900">
                          {fmt(area.budget)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-xs text-center py-8 text-slate-400"
                      >
                        ไม่มีข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Report Table */}
      <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
        <SectionHeader
          icon={<ClipboardList className="h-4 w-4" />}
          title="ตารางรายงานแผนงานทั้งหมด"
          description="แสดงข้อมูลดิบของแผนกิจกรรมตามตัวกรองที่กำหนด"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    เลขที่แผน
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    วันที่จัดกิจกรรม
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    ผู้รับผิดชอบ
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    ประเภทงาน
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    ชื่อกิจกรรม
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    สถานที่
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap text-right">
                    งบประมาณ
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap text-center">
                    สถานะ
                  </TableHead>
                  <TableHead className="px-4 py-3 w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlans.length > 0 ? (
                  paginatedPlans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 group last:border-0"
                    >
                      <TableCell className="text-xs font-bold text-indigo-600 px-4 py-3 whitespace-nowrap">
                        {plan.id}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 px-4 py-3 whitespace-nowrap">
                        {plan.activityDate}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 px-4 py-3 whitespace-nowrap">
                        {plan.responsible}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 whitespace-nowrap">
                        <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {plan.jobType}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-xs px-4 py-3 max-w-[140px] truncate text-slate-600"
                        title={plan.activityName}
                      >
                        {plan.activityName}
                      </TableCell>
                      <TableCell
                        className="text-xs px-4 py-3 max-w-[140px] truncate text-slate-400"
                        title={`${plan.locationName} ต.${plan.subdistrict} อ.${plan.district} จ.${plan.province}`}
                      >
                        {plan.locationName} ต.{plan.subdistrict} อ.
                        {plan.district} จ.{plan.province}
                      </TableCell>
                      <TableCell className="text-xs text-right px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                        {fmt(plan.budget)}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        <StatusBadge status={plan.status} />
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all mx-auto"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-xs text-center py-14 text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-200" />
                        <p>ไม่พบรายการข้อมูลตามตัวกรองที่เลือก</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-400">
                หน้า{" "}
                <span className="font-bold text-slate-600">{currentPage}</span>{" "}
                / <span className="font-bold text-slate-600">{totalPages}</span>
                {" · "}
                {filteredData.length} รายการ
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-0 shadow-2xl bg-white">
          {selectedPlan && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 pt-6 pb-5">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">
                        รายละเอียดแผนปฏิบัติงาน
                      </p>
                      <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-indigo-300 shrink-0" />
                        {selectedPlan.id}
                      </DialogTitle>
                    </div>
                    <div className="mt-1 shrink-0">
                      <StatusBadge status={selectedPlan.status} />
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* Activity Name */}
                <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                    ชื่อกิจกรรม / โครงการ
                  </p>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                    {selectedPlan.activityName}
                  </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailField label="ประเภทงาน">
                    <span className="inline-block text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                      {selectedPlan.jobType}
                    </span>
                  </DetailField>
                  <DetailField label="วันที่จัดกิจกรรม">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      {selectedPlan.activityDate}
                    </span>
                  </DetailField>
                  <DetailField label="ผู้รับผิดชอบ">
                    <span className="text-sm font-bold text-slate-800">
                      {selectedPlan.responsible}
                    </span>
                  </DetailField>
                  <DetailField label="ผู้อนุมัติ">
                    <span className="text-sm font-bold text-slate-800">
                      {selectedPlan.approver || "—"}
                    </span>
                  </DetailField>
                  <DetailField label="สถานที่ปฏิบัติงาน">
                    <span className="flex items-start gap-1.5 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                      {selectedPlan.locationName}
                    </span>
                  </DetailField>
                  <DetailField label="พื้นที่">
                    <span className="text-sm font-semibold text-slate-600">
                      ต.{selectedPlan.subdistrict} อ.{selectedPlan.district} จ.
                      {selectedPlan.province}
                    </span>
                  </DetailField>
                  <DetailField label="กลุ่มเป้าหมาย">
                    <span className="text-sm font-bold text-slate-800">
                      {selectedPlan.targetType}
                    </span>
                  </DetailField>
                  <DetailField label="ประเภทงบประมาณ">
                    <span className="text-sm font-bold text-slate-800">
                      {selectedPlan.budgetType}
                    </span>
                  </DetailField>
                </div>

                {/* Budget */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500 shadow text-white shrink-0">
                    <Banknote className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      งบประมาณที่ใช้
                    </p>
                    <p className="text-xl font-extrabold text-emerald-800">
                      {fmt(selectedPlan.budget)}{" "}
                      <span className="text-sm font-semibold text-emerald-500">
                        บาท
                      </span>
                    </p>
                  </div>
                </div>

                {/* Target & Records */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      เป้าหมาย
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 min-h-[72px]">
                      <p className="text-sm font-semibold text-amber-900 whitespace-pre-line leading-relaxed">
                        {selectedPlan.targetGoal || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      สิ่งที่พนักงานต้องบันทึก
                    </p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[72px]">
                      {selectedPlan.recordFields &&
                      selectedPlan.recordFields.length > 0 ? (
                        <ul className="space-y-1.5">
                          {selectedPlan.recordFields.map((field, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs font-semibold text-slate-700"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              {field}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  className="h-9 px-5 text-xs font-bold border-slate-200 hover:bg-slate-100"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
