"use client";

import React from "react";
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
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  MapPin,
  Leaf,
  Target,
  ClipboardList,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Banknote,
  Clock,
  CheckCheck,
  Activity,
  Download,
  Award,
  Briefcase,
  Layers,
  FileText,
  BadgeAlert,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import { DetailItem } from "@/components/custom/detail-item";

import { CHART_COLORS } from "../../constants";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import { useActivityReport } from "./use-activity-report";

const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(n);

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
      <label className="text-xs font-semibold text-slate-500 mx-1">
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

export function ActivityReport() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    jobType,
    setJobType,
    status,
    setStatus,
    responsible,
    setResponsible,
    province,
    setProvince,
    currentPage,
    setCurrentPage,
    selectedPlan,
    setSelectedPlan,
    uniqueOptions,
    resetFilters,
    filteredData,
    activeFiltersCount,
    kpi,
    statusAnalytics,
    jobTypeAnalytics,
    employeeAnalytics,
    paginatedPlans,
    totalPages,
  } = useActivityReport();

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-lg ring-4 ring-indigo-100">
            <Activity className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              รายงานสรุปแผนงานและผลการดำเนินกิจกรรม
            </h1>
            <p className="text-xs md:text-sm leading-relaxed text-slate-500">
              ภาพรวมสรุปข้อมูลตั้งแต่การวางแผนงบประมาณ
              จนถึงผลสำเร็จยอดขายและลูกค้าใหม่ที่ได้จากกิจกรรมจริง
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("กำลังส่งออกข้อมูลรายงานสรุป...")}
          className="self-start sm:self-center h-9 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 gap-2 shadow-sm shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          ส่งออกรายงาน
        </Button>
      </div>

      {/* 1. Filters */}
      <Card className="rounded-2xl border-0 shadow-md bg-white/90 backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-700">
              ตัวกรองข้อมูลสรุป
            </p>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                เปิดใช้งาน {activeFiltersCount}
              </span>
            )}
          </div>
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
              <label className="text-xs font-semibold text-slate-500 mx-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 mx-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
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
              label="จังหวัด"
              value={province}
              onValueChange={(v) => {
                setProvince(v);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions.provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </FilterSelect>
          </div>
        </CardContent>
      </Card>

      {/* 2. Unified KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* KPI: แผนงานทั้งหมด */}
        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider">
              แผนงานทั้งหมด
            </p>
            <h3 className="text-3xl font-extrabold mt-1 tracking-tight">
              {kpi.totalPlans}
            </h3>
          </div>
          <div className="text-[10px] text-indigo-100 mt-3 flex items-center justify-between relative z-10 border-t border-white/10 pt-2">
            <span className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> รายการ
            </span>
            <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded">
              เสร็จสิ้น{" "}
              {kpi.totalPlans
                ? ((kpi.totalFinished / kpi.totalPlans) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        </Card>

        {/* KPI: ดำเนินงานสำเร็จ */}
        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
              ดำเนินงานสำเร็จ
            </p>
            <h3 className="text-3xl font-extrabold mt-1 tracking-tight">
              {kpi.totalFinished}
            </h3>
          </div>
          <div className="text-[10px] text-emerald-100 mt-3 flex items-center gap-1 relative z-10 border-t border-white/10 pt-2">
            <CheckCheck className="h-3 w-3" /> งานที่เสร็จสิ้นจริง
          </div>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        </Card>

        {/* KPI: รอดำเนินการ */}
        <Card className="p-4 border-0 shadow-md rounded-2xl flex flex-col justify-between bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 text-white relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">
              รอดำเนินการ
            </p>
            <h3 className="text-3xl font-extrabold mt-1 tracking-tight">
              {kpi.totalPending}
            </h3>
          </div>
          <div className="text-[10px] text-amber-100 mt-3 flex items-center gap-1 relative z-10 border-t border-white/10 pt-2">
            <Clock className="h-3 w-3" /> รออนุมัติ / วางแผนงาน
          </div>
          <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        </Card>

        {/* KPI: งบประมาณตามแผน */}
        <Card className="p-4 border border-slate-100 shadow-md rounded-2xl flex flex-col justify-between bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              งบประมาณตามแผน
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-800 tracking-tight">
              {fmt(kpi.totalBudget)}
            </h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 flex items-center gap-1 border-t border-slate-50 pt-2">
            <Banknote className="h-3 w-3 text-indigo-500" /> บาท (รวมทุกแผนงาน)
          </div>
        </Card>

        {/* KPI: งบประมาณใช้จริง */}
        <Card className="p-4 border border-slate-100 shadow-md rounded-2xl flex flex-col justify-between bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                งบประมาณใช้จริง
              </p>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {kpi.budgetUtilizationRate.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-800 tracking-tight">
              {fmt(kpi.totalActualBudget)}
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
              <div
                className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, kpi.budgetUtilizationRate)}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-50 pt-2">
            <TrendingUp className="h-3 w-3 text-indigo-500" />{" "}
            เทียบเฉพาะงานสำเร็จ
          </div>
        </Card>

        {/* KPI: ยอดขายสุทธิ */}
        <Card className="p-4 border border-slate-100 shadow-md rounded-2xl flex flex-col justify-between bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ยอดขายจริงสุทธิ
              </p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {kpi.achievementRate.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-2xl font-extrabold mt-1 text-emerald-600 tracking-tight">
              {fmt(kpi.totalSales)}
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
              <div
                className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpi.achievementRate)}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-50 pt-2">
            <DollarSign className="h-3 w-3 text-emerald-500" /> บาท
            (เฉพาะงานสำเร็จ)
          </div>
        </Card>

        {/* KPI: ลูกค้าใหม่ & Orders */}
        <Card className="p-4 border border-slate-100 shadow-md rounded-2xl flex flex-col justify-between bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ลูกค้าใหม่ & ออเดอร์
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-blue-600 tracking-tight">
                {kpi.totalNewCustomers}
              </h3>
              <span className="text-xs text-slate-400">ราย</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 mt-1">
              ออเดอร์สะสม:{" "}
              <span className="font-bold text-slate-700">
                {kpi.totalOrders}
              </span>{" "}
              รายการ
            </p>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 border-t border-slate-50 pt-2">
            <UserPlus className="h-3 w-3 text-blue-500" /> ทะเบียนขึ้นใหม่จริง
          </div>
        </Card>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* งบประมาณ vs ยอดขาย ตามประเภทงาน */}
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-white">
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">
              งบประมาณ และยอดขาย ตามประเภทงาน
            </h3>
          </div>
          <CardContent className="px-2 pb-4 pt-4 h-72">
            {jobTypeAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={jobTypeAnalytics}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="colorBudget"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0.15}
                      />
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.15}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                  />
                  <Bar
                    dataKey="budget"
                    name="งบประมาณ (บาท)"
                    fill="url(#colorBudget)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="sales"
                    name="ยอดขายจริง (บาท)"
                    fill="url(#colorSales)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูล
              </div>
            )}
          </CardContent>
        </Card>

        {/* ยอดขายพนักงาน Top 5 */}
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-white">
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">
              5 อันดับพนักงานสร้างยอดขายสูงสุด
            </h3>
          </div>
          <CardContent className="px-2 pb-4 pt-4 h-72">
            {employeeAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={employeeAnalytics}
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="colorEmployeeSales"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#0891b2"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar
                    dataKey="sales"
                    name="ยอดขายสะสม (บาท)"
                    fill="url(#colorEmployeeSales)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={15}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลงานเสร็จสิ้น
              </div>
            )}
          </CardContent>
        </Card>

        {/* สัดส่วนสถานะงาน */}
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-white flex flex-col">
          <div className="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">
              สัดส่วนสถานะการดำเนินงาน
            </h3>
          </div>
          <CardContent className="px-2 pb-4 pt-4 flex-1 flex flex-col justify-center">
            {statusAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusAnalytics.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูล
              </div>
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
              <h3 className="text-sm font-bold text-slate-800">
                ตารางข้อมูลสรุปแผนและผลการปฏิบัติงาน
              </h3>
              <p className="text-xs text-slate-500">
                ข้อมูลรายละเอียดแผนงาน และผลลัพธ์ที่ได้
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">
                    เลขที่แผน
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">
                    วันที่ / จังหวัด
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">
                    ชื่อกิจกรรม / เป้าหมาย
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap">
                    ผู้รับผิดชอบ
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-right">
                    งบแผนงาน
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-right">
                    ยอดขายจริง
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-center">
                    ออเดอร์
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-center">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-700 uppercase px-4 py-3 whitespace-nowrap text-center">
                    รายละเอียด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlans.length > 0 ? (
                  paginatedPlans.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="text-xs font-bold text-indigo-600 px-4 py-3 whitespace-nowrap">
                        {item.id}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 whitespace-nowrap">
                        <span className="block text-slate-700 font-semibold">
                          {item.activityDate}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {item.province}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs px-4 py-3 max-w-[200px]">
                        <TruncatedCell
                          value={item.activityName}
                          className="font-semibold text-slate-800"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="inline-flex items-center text-[9px] text-indigo-600 bg-indigo-50 font-medium px-1.5 py-0.5 rounded">
                            {item.jobType}
                          </span>
                          <span className="inline-flex items-center text-[9px] text-slate-500 bg-slate-100 font-medium px-1.5 py-0.5 rounded">
                            {item.targetType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700 px-4 py-3 whitespace-nowrap">
                        {item.responsible}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-slate-600 px-4 py-3 whitespace-nowrap">
                        {fmt(item.budget)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-emerald-600 px-4 py-3 whitespace-nowrap font-mono">
                        {item.status === "FINISHED"
                          ? fmt(item.actualSales)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-blue-600 px-4 py-3 whitespace-nowrap">
                        {item.status === "FINISHED" ? item.actualOrders : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3 whitespace-nowrap">
                        <ActivityStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-xs text-center px-4 py-3 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          onClick={() => setSelectedPlan(item)}
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
                      className="text-xs text-center py-12 text-slate-400"
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
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-500">
                หน้า{" "}
                <span className="font-bold text-slate-700">{currentPage}</span>{" "}
                / {totalPages} (รวม {filteredData.length} รายการ)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Details Dialog */}
      <Dialog
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-0 shadow-2xl bg-white">
          {selectedPlan && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 pt-6 pb-5">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">
                        รายละเอียดแผนงาน / ผลการทำงาน
                      </p>
                      <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                        {selectedPlan.id}
                      </DialogTitle>
                    </div>
                    <div className="mt-1 shrink-0">
                      <ActivityStatusBadge status={selectedPlan.status} />
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* 1. Header block */}
                <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                    ชื่อกิจกรรม
                  </p>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                    {selectedPlan.activityName}
                  </p>
                </div>

                {/* 2. Metadata Information */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 border-b border-slate-100 pb-3">
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="วันที่เริ่มงาน"
                    value={selectedPlan.activityDate}
                  />
                  <DetailItem
                    icon={<Users className="h-4 w-4" />}
                    label="ผู้รับผิดชอบ"
                    value={selectedPlan.responsible}
                  />
                  <DetailItem
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="ผู้อนุมัติ"
                    value={selectedPlan.approver || "-"}
                  />
                  <DetailItem
                    icon={<Layers className="h-4 w-4" />}
                    label="ประเภทเป้าหมาย"
                    value={selectedPlan.targetType}
                  />
                  <DetailItem
                    icon={<Briefcase className="h-4 w-4" />}
                    label="ประเภทงาน"
                    value={selectedPlan.jobType}
                  />
                  <DetailItem
                    icon={<Leaf className="h-4 w-4" />}
                    label="ชนิดพืชเป้าหมาย"
                    value={`${selectedPlan.plantType || "-"} (แปลง: ${selectedPlan.plotsCount || 0} แปลง)`}
                  />
                  <DetailItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="สถานที่ปฏิบัติงาน"
                    value={`${selectedPlan.locationName} ต.${selectedPlan.subdistrict} อ.${selectedPlan.district} จ.${selectedPlan.province}`}
                    fullWidth
                  />
                </div>

                {/* 3. Budget & Outcome Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* แผนและเป้าหมาย */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5 text-slate-400" />{" "}
                      แผนและเป้าหมาย (Plan)
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">งบประมาณอนุมัติ</span>
                        <span className="font-bold text-slate-800">
                          {fmt(selectedPlan.budget)} บาท
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">เป้าหมายยอดขาย</span>
                        <span className="font-bold text-slate-800">
                          {fmt(selectedPlan.targetSales)} บาท
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">
                          เป้าหมายผู้ร่วมกิจกรรม
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedPlan.targetParticipants} คน
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">
                          ประเภทงบประมาณ
                        </span>
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                          {selectedPlan.budgetType || "งบการตลาด"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ผลลัพธ์จากการดำเนินงาน */}
                  <div
                    className={`p-4 rounded-xl border ${selectedPlan.status === "FINISHED" ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"}`}
                  >
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />{" "}
                      ผลการดำเนินงานจริง (Actual)
                    </p>
                    {selectedPlan.status === "FINISHED" ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/35">
                          <span className="text-slate-500">ยอดขายจริง</span>
                          <span className="font-extrabold text-emerald-700">
                            {fmt(selectedPlan.actualSales)} บาท
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/35">
                          <span className="text-slate-500">
                            งบประมาณที่ใช้จริง
                          </span>
                          <span className="font-bold text-slate-800">
                            {fmt(selectedPlan.actualBudget || 0)} บาท
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/35">
                          <span className="text-slate-500">
                            ค่าใช้จ่ายอื่นๆ
                          </span>
                          <span className="font-bold text-slate-700">
                            {fmt(selectedPlan.otherExpenses || 0)} บาท
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/35">
                          <span className="text-slate-500">
                            ลูกค้าใหม่ที่ลงทะเบียน
                          </span>
                          <span className="font-bold text-blue-600">
                            {selectedPlan.actualNewCustomers} ราย
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/35">
                          <span className="text-slate-500">
                            จำนวนออเดอร์สำเร็จ
                          </span>
                          <span className="font-bold text-blue-600">
                            {selectedPlan.actualOrders || 0} รายการ
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">ผู้ร่วมงานจริง</span>
                          <span className="font-bold text-slate-800">
                            {selectedPlan.actualParticipants} คน
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 text-center text-xs text-slate-400 font-medium py-4">
                        ยังไม่มีข้อมูลการดำเนินงานจริง
                        <span className="block text-[10px] text-slate-300 mt-1">
                          จะอัปเดตเมื่อแผนงานเปลี่ยนเป็นสถานะเสร็จสิ้น
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Text reports */}
                {selectedPlan.status === "FINISHED" && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />{" "}
                        สรุปผลความสำเร็จ
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {selectedPlan.performanceResult || "ไม่มีข้อมูลสรุปผล"}
                      </p>
                    </div>

                    {selectedPlan.problemsFound && (
                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <BadgeAlert className="h-3.5 w-3.5 text-rose-400" />{" "}
                          ปัญหาและอุปสรรคที่พบ
                        </p>
                        <p className="text-xs text-rose-700 leading-relaxed font-medium">
                          {selectedPlan.problemsFound}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  className="h-9 px-5 text-xs font-bold border-slate-200"
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
