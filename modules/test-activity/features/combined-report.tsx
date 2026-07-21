"use client";

import React, { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  TrendingUp,
  ShoppingCart,
  Megaphone,
  Activity,
  CalendarCheck,
} from "lucide-react";
import {
  mockActivityLogs,
  mockStockChecks,
  mockPlotHealths,
  mockEventROIs,
} from "../infrastructure/mock-data-combined-report";
import type {
  ActivityLogMock,
  StockCheckMock,
  PlotHealthMock,
} from "../infrastructure/mock-data-combined-report";

// ---- Helpers ----
const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(n);
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);

function SalesOpportunityBadge({
  value,
}: {
  value: ActivityLogMock["salesOpportunity"];
}) {
  if (value === "-") return <span className="text-slate-400 text-xs">-</span>;
  const styleMap: Record<string, string> = {
    สูง: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    กลาง: "bg-amber-100 text-amber-700 border border-amber-200",
    ต่ำ: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styleMap[value] ?? ""}`}
    >
      {value}
    </span>
  );
}

function StockStatusBadge({
  status,
}: {
  status: StockCheckMock["stockStatus"];
}) {
  const styleMap: Record<string, string> = {
    ปกติ: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    ขาดสต็อก: "bg-rose-100 text-rose-700 border border-rose-200",
    ใกล้หมด: "bg-amber-100 text-amber-700 border border-amber-200",
    สต็อกเกิน: "bg-blue-100 text-blue-700 border border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styleMap[status] ?? ""}`}
    >
      {status === "ขาดสต็อก" && <AlertTriangle className="w-3 h-3" />}
      {status === "ปกติ" && <CheckCircle2 className="w-3 h-3" />}
      {status}
    </span>
  );
}

function HealthStatusBadge({
  status,
}: {
  status: PlotHealthMock["healthStatus"];
}) {
  const styleMap: Record<string, string> = {
    สมบูรณ์: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    ไม่เปลี่ยน: "bg-amber-100 text-amber-700 border border-amber-200",
    ทรุดโทรม: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styleMap[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function GrowthResultBadge({
  result,
}: {
  result: PlotHealthMock["growthResult"];
}) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
      {result}
    </span>
  );
}

function PhotoIcon({ available }: { available: boolean }) {
  return (
    <Eye
      className={`w-4 h-4 mx-auto ${
        available
          ? "text-slate-500 cursor-pointer hover:text-blue-500"
          : "text-slate-200"
      }`}
    />
  );
}

// ---- Pagination Component ----
function Pagination({
  total,
  page,
  perPage,
  onPageChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const end = Math.min(page * perPage, total);

  const pages: number[] = [];
  for (
    let i = Math.max(1, page - 1);
    i <= Math.min(totalPages, page + 2);
    i++
  ) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <span className="text-xs text-slate-500">
        1-{end} จาก {total} รายการ
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 mr-1">แสดงหน้าละ:</span>
        <span className="text-xs font-semibold text-slate-700 mr-2">
          {perPage}
        </span>
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronsLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-6 h-6 rounded text-xs font-medium ${
              p === page
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronsRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

// ---- Section Header ----
function SectionHeader({
  number,
  title,
  color,
  icon,
}: {
  number: number;
  title: string;
  color: string;
  icon: React.ReactNode;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    orange: "bg-orange-500",
    purple: "bg-violet-600",
  };
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`w-7 h-7 rounded-full ${bgMap[color] ?? "bg-slate-600"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      >
        {number}
      </div>
      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm">
        {icon}
        {title}
      </div>
    </div>
  );
}

// ---- Stat Card ----
function StatCard({
  icon,
  label,
  value,
  unit,
  iconBg,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 flex-1 min-w-0">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 truncate">{label}</div>
        <div
          className={`text-2xl font-bold leading-tight ${valueColor ?? "text-slate-900"}`}
        >
          {value}
          {unit && (
            <span className="text-sm font-semibold text-slate-500 ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// ---- Main Component ----
// ============================
export function CombinedReport() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<"day" | "week" | "month">("month");

  const startDateDisplay = `${firstDay.getDate().toString().padStart(2, "0")}/${(firstDay.getMonth() + 1).toString().padStart(2, "0")}/${firstDay.getFullYear() + 543}`;
  const endDateDisplay = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear() + 543}`;

  // Pagination states
  const [activityPage, setActivityPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [plotPage, setPlotPage] = useState(1);
  const [roiPage, setRoiPage] = useState(1);
  const PAGE_SIZE = 20;

  const employees = useMemo(() => {
    const set = new Set([
      ...mockActivityLogs.map((d) => d.responsible),
      ...mockStockChecks.map((d) => d.responsible),
      ...mockPlotHealths.map((d) => d.responsible),
      ...mockEventROIs.map((d) => d.organizer),
    ]);
    return Array.from(set).sort();
  }, []);

  const filteredLogs = useMemo<ActivityLogMock[]>(
    () =>
      selectedEmployee === "all"
        ? mockActivityLogs
        : mockActivityLogs.filter((d) => d.responsible === selectedEmployee),
    [selectedEmployee],
  );

  const filteredStocks = useMemo<StockCheckMock[]>(
    () =>
      selectedEmployee === "all"
        ? mockStockChecks
        : mockStockChecks.filter((d) => d.responsible === selectedEmployee),
    [selectedEmployee],
  );

  const filteredPlots = useMemo<PlotHealthMock[]>(
    () =>
      selectedEmployee === "all"
        ? mockPlotHealths
        : mockPlotHealths.filter((d) => d.responsible === selectedEmployee),
    [selectedEmployee],
  );

  const filteredROIs = useMemo(
    () =>
      selectedEmployee === "all"
        ? mockEventROIs
        : mockEventROIs.filter((d) => d.organizer === selectedEmployee),
    [selectedEmployee],
  );

  // Pagination slices
  const pagedLogs = filteredLogs.slice(
    (activityPage - 1) * PAGE_SIZE,
    activityPage * PAGE_SIZE,
  );
  const pagedStocks = filteredStocks.slice(
    (stockPage - 1) * PAGE_SIZE,
    stockPage * PAGE_SIZE,
  );
  const pagedPlots = filteredPlots.slice(
    (plotPage - 1) * PAGE_SIZE,
    plotPage * PAGE_SIZE,
  );
  const pagedROIs = filteredROIs.slice(
    (roiPage - 1) * PAGE_SIZE,
    roiPage * PAGE_SIZE,
  );

  // Stats - Activity Log
  const totalTrips = filteredLogs.length;
  const highOpportunity = filteredLogs.filter(
    (d) => d.salesOpportunity === "สูง",
  ).length;
  const upcomingAppointments = filteredLogs.filter(
    (d) => d.nextAppointmentDate !== null,
  ).length;

  // Stats - Stock
  const totalStores = filteredStocks.length;
  const outOfStock = filteredStocks.filter(
    (d) => d.stockStatus === "ขาดสต็อก",
  ).length;
  const competitorMoves = filteredStocks.filter(
    (d) => d.competitorBrand !== null,
  ).length;

  // Stats - Plot
  const totalPlots = filteredPlots.length;
  const goodPlots = filteredPlots.filter(
    (d) => d.healthStatus === "สมบูรณ์",
  ).length;
  const criticalPlots = filteredPlots.filter(
    (d) => d.healthStatus === "ทรุดโทรม",
  ).length;

  // Stats - Event ROI
  const totalEvents = filteredROIs.length;
  const totalBudget = filteredROIs.reduce((s, d) => s + d.budgetUsed, 0);
  const totalSales = filteredROIs.reduce((s, d) => s + d.actualSales, 0);
  const roi =
    totalBudget > 0
      ? (((totalSales - totalBudget) / totalBudget) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-4">
      {/* ===== Top Bar ===== */}
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-50/30 via-emerald-50/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                รายงานและวิเคราะห์ข้อมูล
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              เลือกดูรายงานและวิเคราะห์ข้อมูลจาก 4 รายงานหลักของระบบ
            </p>
          </div>
        </div>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              ช่วงวันที่
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 border border-slate-200 rounded-lg px-3 py-2 h-11">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 whitespace-nowrap">
                  {startDateDisplay} – {endDateDisplay}
                </span>
              </div>
              <div className="flex gap-1">
                {(["day", "week", "month"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors h-8 ${
                      dateRange === r
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {r === "day"
                      ? "วันนี้"
                      : r === "week"
                        ? "สัปดาห์นี้"
                        : "เดือนนี้"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Select */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              พนักงาน
            </label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="พนักงานทุกคน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">พนักงานทุกคน</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              &nbsp;
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์คีย์เวิร์ด... เช่น ชื่อร้าน, ชื่อแปลง"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 h-11 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2x2 Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* ===== Section 1: Activity Log ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <SectionHeader
            number={1}
            title="รายงานประวัติการเข้าปฏิบัติงาน (Activity Log)"
            color="blue"
            icon={<Activity className="w-4 h-4 text-blue-600" />}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard
              icon={<CalendarCheck className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              label="รวมทริปทั้งหมด"
              value={totalTrips}
              unit="ทริป"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="โอกาสขาย 'สูง'"
              value={highOpportunity}
              unit="ทริป"
              valueColor="text-emerald-600"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5 text-orange-500" />}
              iconBg="bg-orange-50"
              label="นัดหมายครั้งต่อไป"
              value={upcomingAppointments}
              unit="นัด"
              valueColor="text-orange-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    วันที่ปฏิบัติงาน
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    พนักงาน
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ประเภทกิจกรรม
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ชื่อลูกค้า / เข้าพบแปลง
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    รายละเอียด / ผลการปฏิบัติงาน
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    โอกาสขาย
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-center">
                    รายละเอียด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLogs.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.activityDate}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap font-medium">
                      {row.responsible}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.activityType}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 max-w-[120px]">
                      <span className="line-clamp-2">{row.customerOrPlot}</span>
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 max-w-[180px]">
                      <span className="line-clamp-2 text-slate-600">
                        {row.detail}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3">
                      <SalesOpportunityBadge value={row.salesOpportunity} />
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-center">
                      {" "}
                      <PhotoIcon available={row.photoAvailable} />{" "}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            total={filteredLogs.length}
            page={activityPage}
            perPage={PAGE_SIZE}
            onPageChange={setActivityPage}
          />
        </div>

        {/* ===== Section 2: Stock & Competitor ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <SectionHeader
            number={2}
            title="รายงานสถานะสต็อกและสินค้าคู่แข่ง (Stock & Competitor)"
            color="green"
            icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard
              icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="ร้านค้าตรวจสอบ"
              value={totalStores}
              unit="ร้าน"
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
              iconBg="bg-rose-50"
              label="ขาดสต็อก"
              value={outOfStock}
              unit="รายการ"
              valueColor="text-rose-600"
            />
            <StatCard
              icon={<Megaphone className="w-5 h-5 text-violet-600" />}
              iconBg="bg-violet-50"
              label="พบความเคลื่อนไหวคู่แข่ง"
              value={competitorMoves}
              unit="รายการ"
              valueColor="text-violet-600"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    วันที่ตรวจสอบ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    พนักงาน
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ชื่อร้านค้า
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ราคาสินค้าตรวจสอบ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    สถานะสต็อก
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    จำนวน / หน่วย
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    แบรนด์คู่แข่ง
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    โปรโมชั่นคู่แข่ง
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-center">
                    รายละเอียด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStocks.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.checkDate}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap font-medium">
                      {row.responsible}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.storeName}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.ourProductsStock}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3">
                      <StockStatusBadge status={row.stockStatus} />
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.stockQty !== null
                        ? `${fmt(row.stockQty)} ${row.stockUnit ?? ""}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3">
                      {row.competitorBrand ?? (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 max-w-[140px]">
                      <span className="line-clamp-2 text-slate-600">
                        {row.competitorPromotion ?? (
                          <span className="text-slate-300">-</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-center">
                      <PhotoIcon available={row.photoAvailable} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            total={filteredStocks.length}
            page={stockPage}
            perPage={PAGE_SIZE}
            onPageChange={setStockPage}
          />
        </div>

        {/* ===== Section 3: Plot Health & Issue ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <SectionHeader
            number={3}
            title="รายงานติดตามปัญหาและสภาพแปลง (Plot Health & Issue)"
            color="orange"
            icon={<Leaf className="w-4 h-4 text-orange-500" />}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard
              icon={<Leaf className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="แปลงที่ดูแล"
              value={totalPlots}
              unit="แปลง"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="สภาพแปลงสมบูรณ์"
              value={goodPlots}
              unit="แปลง"
              valueColor="text-emerald-600"
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
              iconBg="bg-rose-50"
              label="พบปัญหาเร่งด่วน"
              value={criticalPlots}
              unit="แปลง"
              valueColor="text-rose-600"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    วันที่ลงพื้นที่
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    พนักงาน/ผู้รับผิดชอบ (SPO)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ชื่อแปลง (ไร่)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    พื้นที่ (ไร่)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    สินค้า/ชนิดพืช
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ตัวยาที่ใช้
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    สภาพพืชรวม
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ปัญหาที่พบ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-center">
                    รูปภาพ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedPlots.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.visitDate}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap font-medium">
                      {row.responsible}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.plotName}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.plotSizeRai} ไร่
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 max-w-[120px]">
                      <div className="line-clamp-1">{row.cropType}</div>
                      <div className="text-slate-400 text-xs">
                        {row.cropQty}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs py-2.5 px-3">
                      <GrowthResultBadge result={row.growthResult} />
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3">
                      <HealthStatusBadge status={row.healthStatus} />
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 max-w-[150px]">
                      {row.issue ? (
                        <span className="line-clamp-2 text-rose-600">
                          {row.issue}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-center">
                      <PhotoIcon available={row.photoAvailable} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            total={filteredPlots.length}
            page={plotPage}
            perPage={PAGE_SIZE}
            onPageChange={setPlotPage}
          />
        </div>

        {/* ===== Section 4: Event ROI ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <SectionHeader
            number={4}
            title="รายงานสรุป ROI ยอดขายจากกิจกรรม (Event ROI)"
            color="purple"
            icon={<TrendingUp className="w-4 h-4 text-violet-600" />}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard
              icon={<CalendarCheck className="w-5 h-5 text-violet-600" />}
              iconBg="bg-violet-50"
              label="กิจกรรมที่จัด"
              value={totalEvents}
              unit="งาน"
            />
            <StatCard
              icon={<Activity className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              label="งบประมาณรวมที่ใช้"
              value={`฿ ${fmtCurrency(totalBudget)}`}
              valueColor="text-blue-700"
            />
            <StatCard
              icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              label="ยอดขายรวมสุทธิ"
              value={`฿ ${fmtCurrency(totalSales)}`}
              valueColor="text-emerald-700"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    วันที่จัด
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ผู้จัดกิจกรรม
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    รูปแบบกิจกรรม
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3">
                    ประเภทงบ
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-right">
                    จำนวนเงินที่ใช้ (฿)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-right">
                    คนเข้าร่วม (คน)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-right">
                    ยอดขายในกิจกรรม (฿)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap py-2.5 px-3 text-center">
                    รูปภาพ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedROIs.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.eventDate}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap font-medium">
                      {row.organizer}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.eventName}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 whitespace-nowrap">
                      {row.budgetType}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-right font-medium">
                      {fmtCurrency(row.budgetUsed)}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-right">
                      {fmt(row.participants)}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-right font-semibold text-emerald-700">
                      {fmtCurrency(row.actualSales)}
                    </TableCell>
                    <TableCell className="text-xs py-2.5 px-3 text-center">
                      <PhotoIcon available={row.photoAvailable} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            total={filteredROIs.length}
            page={roiPage}
            perPage={PAGE_SIZE}
            onPageChange={setRoiPage}
          />
        </div>
      </div>
    </div>
  );
}
