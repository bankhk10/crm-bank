"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { mockTripPlans, TripPlanMock } from "../infrastructure/mock-data";
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Leaf,
  Target,
  ClipboardList,
  Eye,
  LayoutDashboard,
  SlidersHorizontal,
  RotateCcw,
  Banknote,
  Clock,
  CheckCheck,
  Ban,
  Activity,
} from "lucide-react";

// ─── Palette & Helpers ────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
];

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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-1 text-white/70">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#a5b4fc" }}>
          {p.name}: <span className="font-bold text-white">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Filter Select Component ──────────────────────────────────────────────────
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
    <div className="space-y-1.5 flex-1">
      <label className="text-xs font-semibold text-muted-foreground mx-1">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 text-sm bg-white border-slate-200 focus:ring-indigo-500">
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

// ─── Main Unified Report Component ────────────────────────────────────────────
export function ActivityReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobType, setJobType] = useState("all");
  const [status, setStatus] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [province, setProvince] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedPlan, setSelectedPlan] = useState<TripPlanMock | null>(null);

  const uniqueOptions = useMemo(() => {
    return {
      jobTypes: Array.from(new Set(mockTripPlans.map((d) => d.jobType))),
      employees: Array.from(new Set(mockTripPlans.map((d) => d.responsible))),
      provinces: Array.from(new Set(mockTripPlans.map((d) => d.province))),
    };
  }, []);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setJobType("all");
    setStatus("all");
    setResponsible("all");
    setProvince("all");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (status !== "all" && item.status !== status) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      if (province !== "all" && item.province !== province) return false;
      return true;
    });
  }, [startDate, endDate, jobType, status, responsible, province]);

  const finishedActivities = useMemo(() => {
    return filteredData.filter((item) => item.status === "FINISHED");
  }, [filteredData]);

  // ─── KPI Calculations ───────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalPlans = filteredData.length;
    const totalFinished = finishedActivities.length;
    const totalPending = filteredData.filter((i) => i.status === "PENDING").length;
    const totalBudget = filteredData.reduce((acc, cur) => acc + cur.budget, 0);
    const totalSales = finishedActivities.reduce((acc, cur) => acc + cur.actualSales, 0);
    const totalTargetSales = finishedActivities.reduce((acc, cur) => acc + cur.targetSales, 0);
    const totalNewCustomers = finishedActivities.reduce((acc, cur) => acc + cur.actualNewCustomers, 0);
    const achievementRate = totalTargetSales > 0 ? (totalSales / totalTargetSales) * 100 : 0;

    return {
      totalPlans,
      totalFinished,
      totalPending,
      totalBudget,
      totalSales,
      totalNewCustomers,
      achievementRate,
    };
  }, [filteredData, finishedActivities]);

  // ─── Analytics ──────────────────────────────────────────────────────────────
  const statusAnalytics = useMemo(() => {
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, FINISHED: 0 };
    filteredData.forEach((item) => {
      counts[item.status]++;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        name: STATUS_CONFIG[key as TripPlanMock["status"]].label,
        value: count,
      }));
  }, [filteredData]);

  const jobTypeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; budget: number; sales: number }> = {};
    filteredData.forEach((item) => {
      const name = item.jobType.replace(/^\d+\.\s*/, "");
      if (!g[name]) g[name] = { name, budget: 0, sales: 0 };
      g[name].budget += item.budget;
      if (item.status === "FINISHED") g[name].sales += item.actualSales;
    });
    return Object.values(g).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  const employeeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; sales: number; count: number }> = {};
    finishedActivities.forEach((item) => {
      if (!g[item.responsible]) g[item.responsible] = { name: item.responsible, sales: 0, count: 0 };
      g[item.responsible].sales += item.actualSales;
      g[item.responsible].count += 1;
    });
    return Object.values(g).sort((a, b) => b.sales - a.sales).slice(0, 5); // Top 5
  }, [finishedActivities]);

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-sm px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-lg ring-4 ring-indigo-100">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              รายงานสรุปแผนงานและผลการดำเนินกิจกรรม
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              ภาพรวมสรุปข้อมูลตั้งแต่การวางแผนงบประมาณ จนถึงผลสำเร็จยอดขายและลูกค้าใหม่ที่ได้จากกิจกรรมจริง
            </p>
          </div>
        </div>
      </div>

      {/* 1. Filters */}
      <Card className="rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-bold text-slate-700">ตัวกรองข้อมูลสรุป</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground mx-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground mx-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <FilterSelect label="ประเภทงาน" value={jobType} onValueChange={(v) => { setJobType(v); setCurrentPage(1); }}>
              {uniqueOptions.jobTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="สถานะ" value={status} onValueChange={(v) => { setStatus(v); setCurrentPage(1); }}>
              <SelectItem value="PENDING">รออนุมัติ</SelectItem>
              <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
              <SelectItem value="REJECTED">ไม่อนุมัติ</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              <SelectItem value="FINISHED">เสร็จสิ้น</SelectItem>
            </FilterSelect>
            <FilterSelect label="ผู้รับผิดชอบ" value={responsible} onValueChange={(v) => { setResponsible(v); setCurrentPage(1); }}>
              {uniqueOptions.employees.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="จังหวัด" value={province} onValueChange={(v) => { setProvince(v); setCurrentPage(1); }}>
              {uniqueOptions.provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </FilterSelect>
          </div>
        </CardContent>
      </Card>

      {/* 2. Unified KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-indigo-500 to-indigo-700 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-indigo-100 uppercase">แผนงานทั้งหมด</p>
            <h3 className="text-3xl font-extrabold mt-1">{kpi.totalPlans}</h3>
          </div>
          <div className="text-[10px] text-indigo-200 mt-2 flex items-center gap-1 relative z-10">
            <ClipboardList className="h-3.5 w-3.5" /> รายการ
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
        </Card>

        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-emerald-500 to-emerald-700 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-emerald-100 uppercase">ดำเนินงานสำเร็จ</p>
            <h3 className="text-3xl font-extrabold mt-1">{kpi.totalFinished}</h3>
          </div>
          <div className="text-[10px] text-emerald-200 mt-2 flex items-center gap-1 relative z-10">
            <CheckCheck className="h-3.5 w-3.5" /> งานที่เสร็จสิ้นจริง
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
        </Card>

        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-amber-500 to-amber-600 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-amber-100 uppercase">รอดำเนินการ</p>
            <h3 className="text-3xl font-extrabold mt-1">{kpi.totalPending}</h3>
          </div>
          <div className="text-[10px] text-amber-100 mt-2 flex items-center gap-1 relative z-10">
            <Clock className="h-3.5 w-3.5" /> รออนุมัติ
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
        </Card>

        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-white text-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">งบประมาณที่ใช้</p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-800">{fmt(kpi.totalBudget)}</h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5 text-indigo-500" /> บาท (รวมทุกสถานะ)
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-white text-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">ยอดขายจริงสุทธิ</p>
            <h3 className="text-2xl font-extrabold mt-1 text-emerald-600">{fmt(kpi.totalSales)}</h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> บาท (เฉพาะงานสำเร็จ)
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-white text-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">ลูกค้าใหม่ / อัตราความสำเร็จ</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-blue-600">{kpi.totalNewCustomers}</h3>
              <span className="text-sm font-bold text-rose-500">({kpi.achievementRate.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <UserPlus className="h-3.5 w-3.5 text-blue-500" /> รายการขึ้นทะเบียนใหม่
          </div>
        </Card>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* งบประมาณ vs ยอดขาย ตามประเภทงาน */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-md overflow-hidden bg-white">
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">เปรียบเทียบงบประมาณ และ ยอดขาย ตามประเภทงาน</h3>
          </div>
          <CardContent className="px-2 pb-4 pt-4 h-72">
            {jobTypeAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobTypeAnalytics} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="budget" name="งบประมาณ (บาท)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="sales" name="ยอดขายจริง (บาท)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">ไม่มีข้อมูล</div>
            )}
          </CardContent>
        </Card>

        {/* สัดส่วนสถานะงาน */}
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-white flex flex-col">
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">สัดส่วนสถานะการดำเนินงาน</h3>
          </div>
          <CardContent className="px-2 pb-4 pt-4 flex-1 flex flex-col justify-center">
            {statusAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusAnalytics} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {statusAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">ไม่มีข้อมูล</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Unified Data Table */}
      <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">ตารางข้อมูลสรุปแผนและผลการปฏิบัติงาน</h3>
              <p className="text-xs text-slate-500">ข้อมูลรายละเอียดแผนงาน และผลลัพธ์ที่ได้</p>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">เลขที่แผน</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">วันที่ / จังหวัด</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">ชื่อกิจกรรม</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-right">งบประมาณ</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-right">ยอดขายจริง</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-center">สถานะ</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-center">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlans.length > 0 ? (
                  paginatedPlans.map((item) => (
                    <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 last:border-0">
                      <TableCell className="text-xs font-bold text-indigo-600 px-4 py-3 whitespace-nowrap">{item.id}</TableCell>
                      <TableCell className="text-xs px-4 py-3 whitespace-nowrap">
                        <span className="block text-slate-700 font-semibold">{item.activityDate}</span>
                        <span className="block text-[10px] text-slate-400">{item.province}</span>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 max-w-[180px] truncate" title={item.activityName}>
                        <span className="block font-semibold text-slate-800 truncate">{item.activityName}</span>
                        <span className="block text-[10px] text-indigo-500 font-medium truncate mt-0.5">{item.jobType}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700 px-4 py-3 whitespace-nowrap">{item.responsible}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-slate-600 px-4 py-3 whitespace-nowrap">{fmt(item.budget)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-emerald-600 px-4 py-3 whitespace-nowrap">
                        {item.status === "FINISHED" ? fmt(item.actualSales) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3 whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={() => setSelectedPlan(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-xs text-center py-12 text-slate-400">
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
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500">
                หน้า <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages} (รวม {filteredData.length} รายการ)
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg border-slate-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-lg border-slate-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-0 shadow-2xl bg-white">
          {selectedPlan && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 pt-6 pb-5">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">รายละเอียดแผนงาน / ผลการทำงาน</p>
                      <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                        {selectedPlan.id}
                      </DialogTitle>
                    </div>
                    <div className="mt-1 shrink-0"><StatusBadge status={selectedPlan.status} /></div>
                  </div>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">ชื่อกิจกรรม</p>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed">{selectedPlan.activityName}</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">วันที่</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPlan.activityDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ผู้รับผิดชอบ</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPlan.responsible}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ประเภทงาน</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPlan.jobType}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">สถานที่</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedPlan.locationName} ต.{selectedPlan.subdistrict} อ.{selectedPlan.district} จ.{selectedPlan.province}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5"/> แผน (Plan)</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-500">งบประมาณ</span><span className="text-sm font-bold text-slate-800">{fmt(selectedPlan.budget)} บาท</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-500">เป้าหมายยอดขาย</span><span className="text-sm font-bold text-slate-800">{fmt(selectedPlan.targetSales)} บาท</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-500">เป้าหมายคนเข้าร่วม</span><span className="text-sm font-bold text-slate-800">{selectedPlan.targetParticipants} คน</span></div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${selectedPlan.status === "FINISHED" ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCheck className="h-3.5 w-3.5"/> ผลลัพธ์ (Actual)</p>
                    {selectedPlan.status === "FINISHED" ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">ยอดขายจริง</span><span className="text-sm font-bold text-emerald-700">{fmt(selectedPlan.actualSales)} บาท</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">ลูกค้าใหม่</span><span className="text-sm font-bold text-emerald-700">{selectedPlan.actualNewCustomers} ราย</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">คนเข้าร่วมจริง</span><span className="text-sm font-bold text-emerald-700">{selectedPlan.actualParticipants} คน</span></div>
                      </div>
                    ) : (
                      <div className="mt-6 text-center text-xs text-slate-400 font-medium">ยังไม่เสร็จสิ้นกิจกรรม</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPlan(null)} className="h-9 px-5 text-xs font-bold border-slate-200">ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ActivityReport as TripPlanReport };
