"use client";

import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Package,
  Layers,
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  DollarSign,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { getMonthlySalesOverviewAction } from "../../server/actions";
import type { MonthlySalesOverviewData } from "../../types";

const categoryToHex: Record<string, string> = {
  executive: "#6366f1",
  time: "#3b82f6",
  product: "#10b981",
  "customer-salesperson": "#f59e0b",
  "advanced-sales": "#8b5cf6",
};

const reportCategories = [
  {
    id: "executive",
    title: "Executive Dashboard",
    description: "ภาพรวม KPI ที่สำคัญ ยอดขายรายเดือน และอันดับสูงสุด",
    icon: TrendingUp,
    href: "/reports/dashboard",
    permissionKey: "report.executive_dashboard",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    features: ["KPI รวม (ยอดขาย, ออเดอร์)", "กราฟแนวโน้มยอดขายรายเดือน", "อันดับสินค้า/ลูกค้า/พนักงานสูงสุด"],
  },
  {
    id: "time",
    title: "รายงานยอดขายตามเวลา",
    description: "ยอดขายรายวัน / รายเดือน / รายปี / ไตรมาส / ตามภูมิภาค",
    icon: Calendar,
    href: "/reports/time-sales",
    permissionKey: "report.time_sales",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    features: [
      "ยอดขายรายวัน / รายเดือน / รายไตรมาส / รายปี",
      "ข้อมูลยอดขายรายภูมิภาค / การเติบโตเทียบปีก่อน",
      "จำนวนออเดอร์ที่ขายได้ทั้งหมด",
    ],
  },
  {
    id: "product",
    title: "รายงานสินค้าและกลุ่มชื่อการค้า",
    description: "สินค้า/กลุ่มสินค้าขายดี, ยอดขายรายสินค้า, สต๊อกค้าง",
    icon: Package,
    href: "/reports/product-sales",
    permissionKey: "report.product_sales",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    features: [
      "ผลงานรายสินค้า และ รายกลุ่มสินค้า",
      "สินค้าขายดี / ขายช้า / ค้างสต๊อก",
      "การแปลงปริมาณ (ลิตร) อัตโนมัติ",
    ],
  },
  {
    id: "customer-salesperson",
    title: "รายงานลูกค้าและพนักงานขาย",
    description: "ลูกค้าซื้อสูงสุด, ผลงานพนักงานขาย, มูลค่าลูกค้า",
    icon: Users,
    href: "/reports/customer-sales",
    permissionKey: "report.customer_sales",
    color: "from-amber-500 to-rose-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    features: [
      "รายชื่อลูกค้าซื้อสูงสุด (Top Customers)",
      "ผลงานพนักงานขายรายบุคคล (Performance)",
      "ความถี่ในการซื้อ และ มูลค่าลูกค้า",
    ],
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

// ==========================================
// Monthly Sales Overview Section
// ==========================================

function MonthlySalesOverviewSection() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [data, setData] = useState<MonthlySalesOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().getMonth() + 1;

  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const result = await getMonthlySalesOverviewAction(year);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch monthly sales overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear, fetchData]);

  // Find max for bar chart scaling
  const maxAmount = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      ...data.months.map((m) =>
        Math.max(m.totalSales, m.salesNoteAmount, m.invoiceAmount),
      ),
      1,
    );
  }, [data]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <SectionHeader
        title="ภาพรวมยอดขายรายเดือน"
        icon={<BarChart3 className="h-6 w-6" />}
        accentColor="#1e293b"
        variant="dark"
      />

      {/* Year Selector */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-95"
              aria-label="ปีก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm min-w-[120px] justify-center">
              <Calendar className="h-4 w-4 text-blue-300" />
              <span>ปี พ.ศ. {selectedYear + 543}</span>
            </div>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              disabled={selectedYear >= currentYear}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="ปีถัดไป"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-500 font-medium">ยอดขาย</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-slate-500 font-medium">Sales Note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500 font-medium">Invoice</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : data ? (
        <>
          {/* Summary KPI Cards */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Current Month Total Sales */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
                <div className="absolute top-0 right-0 opacity-10">
                  <DollarSign className="h-20 w-20 -mt-2 -mr-2" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-blue-100 mb-1">
                    {data.currentMonthHighlight
                      ? `ยอดขายเดือน${data.currentMonthHighlight.monthName}`
                      : `ยอดขายรวมปี ${selectedYear + 543}`}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight">
                    ฿
                    {formatCurrency(
                      data.currentMonthHighlight
                        ? data.currentMonthHighlight.totalSales
                        : data.totals.totalSales,
                    )}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {formatNumber(data.totals.totalOrders)} ออเดอร์ (ทั้งปี)
                  </p>
                </div>
              </div>

              {/* SalesNote Total */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white">
                <div className="absolute top-0 right-0 opacity-10">
                  <FileText className="h-20 w-20 -mt-2 -mr-2" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-orange-100 mb-1">
                    {data.currentMonthHighlight
                      ? `Sales Note เดือน${data.currentMonthHighlight.monthName}`
                      : `Sales Note รวมปี ${selectedYear + 543}`}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight">
                    ฿
                    {formatCurrency(
                      data.currentMonthHighlight
                        ? data.currentMonthHighlight.salesNoteAmount
                        : data.totals.salesNoteAmount,
                    )}
                  </p>
                  <p className="text-xs text-orange-200 mt-1">
                    {formatNumber(data.totals.salesNoteCount)} รายการ (ทั้งปี)
                  </p>
                </div>
              </div>

              {/* Invoice Total */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 p-4 text-white">
                <div className="absolute top-0 right-0 opacity-10">
                  <Receipt className="h-20 w-20 -mt-2 -mr-2" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-emerald-100 mb-1">
                    {data.currentMonthHighlight
                      ? `Invoice เดือน${data.currentMonthHighlight.monthName}`
                      : `Invoice รวมปี ${selectedYear + 543}`}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight">
                    ฿
                    {formatCurrency(
                      data.currentMonthHighlight
                        ? data.currentMonthHighlight.invoiceAmount
                        : data.totals.invoiceAmount,
                    )}
                  </p>
                  <p className="text-xs text-emerald-200 mt-1">
                    {formatNumber(data.totals.invoiceCount)} รายการ (ทั้งปี)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile legend */}
          <div className="px-6 pb-3 sm:hidden">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-500">ยอดขาย</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-500">Sales Note</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Invoice</span>
              </div>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="px-6 pb-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 w-[100px]">
                      เดือน
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-blue-600 min-w-[130px]">
                      <div className="flex items-center gap-1.5 justify-end">
                        <DollarSign className="h-3.5 w-3.5" />
                        ยอดขาย
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-orange-600 min-w-[130px]">
                      <div className="flex items-center gap-1.5 justify-end">
                        <FileText className="h-3.5 w-3.5" />
                        Sales Note
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-emerald-600 min-w-[130px]">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Receipt className="h-3.5 w-3.5" />
                        Invoice
                      </div>
                    </th>
                    <th className="hidden lg:table-cell py-3 px-4 font-semibold text-slate-500 min-w-[200px]">
                      กราฟเปรียบเทียบ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((month, idx) => {
                    const isCurrentMonth =
                      selectedYear === currentYear &&
                      month.month === currentMonth;

                    return (
                      <tr
                        key={month.month}
                        className={`border-b border-slate-100 transition-colors duration-150 ${
                          isCurrentMonth
                            ? "bg-blue-50/50 hover:bg-blue-50"
                            : idx % 2 === 0
                              ? "bg-white hover:bg-slate-50/70"
                              : "bg-slate-50/30 hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isCurrentMonth && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            <span
                              className={`font-medium ${isCurrentMonth ? "text-blue-700" : "text-slate-700"}`}
                            >
                              {month.monthShort}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <span
                              className={`font-semibold tabular-nums ${month.totalSales > 0 ? "text-blue-700" : "text-slate-300"}`}
                            >
                              {formatCurrency(month.totalSales)}
                            </span>
                            {month.totalOrders > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatNumber(month.totalOrders)} รายการ
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <span
                              className={`font-semibold tabular-nums ${month.salesNoteAmount > 0 ? "text-orange-700" : "text-slate-300"}`}
                            >
                              {formatCurrency(month.salesNoteAmount)}
                            </span>
                            {month.salesNoteCount > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatNumber(month.salesNoteCount)} รายการ
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <span
                              className={`font-semibold tabular-nums ${month.invoiceAmount > 0 ? "text-emerald-700" : "text-slate-300"}`}
                            >
                              {formatCurrency(month.invoiceAmount)}
                            </span>
                            {month.invoiceCount > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatNumber(month.invoiceCount)} รายการ
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            {/* Total Sales Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${maxAmount > 0 ? (month.totalSales / maxAmount) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {/* SalesNote Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${maxAmount > 0 ? (month.salesNoteAmount / maxAmount) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {/* Invoice Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${maxAmount > 0 ? (month.invoiceAmount / maxAmount) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals Footer */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <td className="py-3.5 px-4 rounded-bl-xl">
                      <span className="text-sm">รวมทั้งปี</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-blue-300 tabular-nums">
                        {formatCurrency(data.totals.totalSales)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatNumber(data.totals.totalOrders)} รายการ
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-orange-300 tabular-nums">
                        {formatCurrency(data.totals.salesNoteAmount)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatNumber(data.totals.salesNoteCount)} รายการ
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-emerald-300 tabular-nums">
                        {formatCurrency(data.totals.invoiceAmount)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatNumber(data.totals.invoiceCount)} รายการ
                      </p>
                    </td>
                    <td className="hidden lg:table-cell py-3.5 px-4 rounded-br-xl" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">
          ไม่สามารถโหลดข้อมูลได้
        </div>
      )}
    </div>
  );
}

export default function ReportListView() {
  const { data: session, status } = useSession();

  // Filter report categories based on user permissions
  const permissionKeys = session?.user?.permissionKeys;

  const filteredCategories = useMemo(() => {
    if (!permissionKeys) {
      return [];
    }

    return reportCategories.filter((category) => {
      // Allow mock reports without permission
      if (category.permissionKey === "none") return true;
      // Check if user has permission for this report
      return permissionKeys.includes(category.permissionKey);
    });
  }, [permissionKeys]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
      {/* Hero Header Section */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DetailHero
          backUrl="/"
          backLabel="หน้าแรก"
          title="หมวดรายงาน"
          icon={<TrendingUp className="h-8 w-8 text-white" />}
          backgroundColor="#1e293b" // Slate 800
          accentColor="#B91C1C"     // Blue 500
          badges={
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-red-100 bg-red-500/20 border border-red-400/30 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md">
              <TrendingUp className="h-4 w-4 text-red-300" />
              วิเคราะห์ข้อมูลการขาย
            </div>
          }
        />
      </div>

      {/* Monthly Sales Overview */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MonthlySalesOverviewSection />
      </div>

      {/* Report Cards Grid */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              คุณไม่มีสิทธิ์เข้าถึงรายงานใดๆ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={category.href} className="group">
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 h-full group-hover:scale-[1.01]">
                    <SectionHeader
                      title={category.title}
                      icon={<Icon className="h-6 w-6" />}
                      accentColor={categoryToHex[category.id] || "#3b82f6"}
                      variant={category.id === "executive" ? "dark" : "primary"}
                    />
                    <div className="p-8">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        {category.description}
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        {category.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-slate-200 transition-all duration-200"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: categoryToHex[category.id] || "#3b82f6" }}
                            />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
