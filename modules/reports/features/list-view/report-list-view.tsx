"use client";

import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  FileText,
  Receipt,
  DollarSign,
  BarChart3,
  Plus,
  X,
  Target,
} from "lucide-react";
import Link from "next/link";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getMonthlySalesOverviewAction } from "../../server/actions";
import type { MonthlySalesOverviewData } from "../../types";

const categoryToHex: Record<string, string> = {
  executive: "#6366f1",
  time: "#3b82f6",
  product: "#10b981",
  "customer-salesperson": "#f59e0b",
  "sales-forecast": "#8b5cf6",
};

const YEAR_COLORS = [
  {
    bg: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50",
    bar: "from-blue-400 to-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    bg: "bg-orange-500",
    text: "text-orange-600",
    light: "bg-orange-50",
    bar: "from-orange-400 to-orange-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    bar: "from-emerald-400 to-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    bg: "bg-purple-500",
    text: "text-purple-600",
    light: "bg-purple-50",
    bar: "from-purple-400 to-purple-500",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

const THAI_MONTHS_SHORT = [
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

const reportCategories = [
  // { id: "executive", title: "Executive Dashboard", description: "ภาพรวม KPI ที่สำคัญ ยอดขายรายเดือน และอันดับสูงสุด", icon: TrendingUp, href: "/reports/dashboard", permissionKey: "report.executive_dashboard", features: ["KPI รวม (ยอดขาย, ออเดอร์)", "กราฟแนวโน้มยอดขายรายเดือน", "อันดับสินค้า/ลูกค้า/พนักงานสูงสุด"] },
  {
    id: "time",
    title: "รายงานยอดขายตามเวลา",
    description: "ยอดขายรายวัน / รายเดือน / รายปี / ไตรมาส / ตามภูมิภาค",
    icon: Calendar,
    href: "/reports/time-sales",
    permissionKey: "report.time_sales",
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
    features: [
      "รายชื่อลูกค้าซื้อสูงสุด (Top Customers)",
      "ผลงานพนักงานขายรายบุคคล (Performance)",
      "ความถี่ในการซื้อ และ มูลค่าลูกค้า",
    ],
  },
  {
    id: "sales-forecast",
    title: "รายงานการขายเทียบกับคาดการณ์ยอดขาย",
    description: "เปรียบเทียบยอดขายจริงกับเป้าหมาย/คาดการณ์",
    icon: Target,
    href: "/reports/sales-forecast",
    permissionKey: "report.sales_forecast",
    features: [
      "เปรียบเทียบยอดขาย vs คาดการณ์",
      "ความคืบหน้าของเป้าหมาย",
      "วิเคราะห์แนวโน้มยอดขาย",
    ],
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtNum(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

type ViewMode = "totalSales" | "salesNote" | "invoice";
const VIEW_MODE_CONFIG: Record<
  ViewMode,
  { label: string; key: string; countKey: string; color: string; icon: any }
> = {
  totalSales: {
    label: "ยอดขาย",
    key: "totalSales",
    countKey: "totalOrders",
    color: "blue",
    icon: DollarSign,
  },
  salesNote: {
    label: "Sales Note",
    key: "salesNoteAmount",
    countKey: "salesNoteCount",
    color: "orange",
    icon: FileText,
  },
  invoice: {
    label: "Invoice",
    key: "invoiceAmount",
    countKey: "invoiceCount",
    color: "emerald",
    icon: Receipt,
  },
};

function MonthlySalesOverviewSection() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYears, setSelectedYears] = useState<number[]>([
    currentYear,
    currentYear - 1,
  ]);
  const [dataMap, setDataMap] = useState<
    Record<number, MonthlySalesOverviewData>
  >({});
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("totalSales");

  const fetchYear = useCallback(
    async (year: number) => {
      if (dataMap[year]) return;
      setLoadingYears((prev) => new Set(prev).add(year));
      try {
        const result = await getMonthlySalesOverviewAction(year);
        setDataMap((prev) => ({ ...prev, [year]: result }));
      } catch (e) {
        console.error("Failed to fetch year", year, e);
      } finally {
        setLoadingYears((prev) => {
          const s = new Set(prev);
          s.delete(year);
          return s;
        });
      }
    },
    [dataMap],
  );

  useEffect(() => {
    selectedYears.forEach((y) => fetchYear(y));
  }, [selectedYears, fetchYear]);

  const isLoading = selectedYears.some(
    (y) => loadingYears.has(y) && !dataMap[y],
  );
  const sortedYears = useMemo(
    () => [...selectedYears].sort((a, b) => b - a),
    [selectedYears],
  );
  const availableYearsToAdd = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      if (!selectedYears.includes(y)) years.push(y);
    }
    return years;
  }, [selectedYears, currentYear]);

  const addYear = (y: number) => {
    if (selectedYears.length < 4) setSelectedYears((prev) => [...prev, y]);
  };
  const removeYear = (y: number) => {
    if (selectedYears.length > 1)
      setSelectedYears((prev) => prev.filter((v) => v !== y));
  };

  const cfg = VIEW_MODE_CONFIG[viewMode];

  // Get value from month data by viewMode
  const getVal = (monthData: MonthlySalesOverviewData["months"][0]) => {
    return (monthData as any)[cfg.key] as number;
  };
  const getCount = (monthData: MonthlySalesOverviewData["months"][0]) => {
    return (monthData as any)[cfg.countKey] as number;
  };

  // Max for bar scaling across all years
  const maxVal = useMemo(() => {
    let max = 1;
    for (const y of sortedYears) {
      const d = dataMap[y];
      if (!d) continue;
      for (const m of d.months) {
        max = Math.max(max, getVal(m));
      }
    }
    return max;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedYears, dataMap, viewMode]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <SectionHeader
        title="เปรียบเทียบยอดขายรายเดือน"
        icon={<BarChart3 className="h-6 w-6" />}
        accentColor="#1e293b"
        variant="dark"
      />

      <div className="px-6 pt-6 pb-4 space-y-4">
        {/* Year chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            เลือกปี:
          </span>
          {sortedYears.map((y, i) => (
            <div
              key={y}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${YEAR_COLORS[i % YEAR_COLORS.length].badge}`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${YEAR_COLORS[i % YEAR_COLORS.length].bg}`}
              />
              <span>พ.ศ. {y + 543}</span>
              {selectedYears.length > 1 && (
                <button
                  onClick={() => removeYear(y)}
                  className="ml-0.5 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {availableYearsToAdd.length > 0 && selectedYears.length < 4 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
                  <Plus className="h-3 w-3" /> เพิ่มปี
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                {availableYearsToAdd.map((y) => (
                  <DropdownMenuItem
                    key={y}
                    onClick={() => addYear(y)}
                    className="cursor-pointer text-xs py-2"
                  >
                    พ.ศ. {y + 543}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(Object.keys(VIEW_MODE_CONFIG) as ViewMode[]).map((mode) => {
            const c = VIEW_MODE_CONFIG[mode];
            const Icon = c.icon;
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 w-[80px]">
                    เดือน
                  </th>
                  {sortedYears.map((y, i) => (
                    <th
                      key={y}
                      className={`text-right py-3 px-4 font-semibold ${YEAR_COLORS[i % YEAR_COLORS.length].text} min-w-[120px]`}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        <div
                          className={`w-2 h-2 rounded-full ${YEAR_COLORS[i % YEAR_COLORS.length].bg}`}
                        />
                        {y + 543}
                      </div>
                    </th>
                  ))}
                  {sortedYears.length >= 2 && (
                    <th className="text-right py-3 px-4 font-semibold text-slate-500 min-w-[80px]">
                      เทียบ %
                    </th>
                  )}
                  <th className="hidden lg:table-cell py-3 px-4 font-semibold text-slate-500 min-w-[180px]">
                    กราฟเปรียบเทียบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {THAI_MONTHS_SHORT.map((mName, mIdx) => {
                  const monthNum = mIdx + 1;
                  const isCurrentMonth =
                    sortedYears.includes(currentYear) &&
                    monthNum === currentMonth;
                  const values = sortedYears.map((y) => {
                    const d = dataMap[y];
                    return d ? getVal(d.months[mIdx]) : 0;
                  });
                  const counts = sortedYears.map((y) => {
                    const d = dataMap[y];
                    return d ? getCount(d.months[mIdx]) : 0;
                  });
                  // Growth: first year vs second year (newest vs next oldest)
                  let growthPct: number | null = null;
                  if (sortedYears.length >= 2 && values[1] > 0) {
                    growthPct = ((values[0] - values[1]) / values[1]) * 100;
                  }

                  return (
                    <tr
                      key={monthNum}
                      className={`border-b border-slate-100 transition-colors ${isCurrentMonth ? "bg-blue-50/50 hover:bg-blue-50" : mIdx % 2 === 0 ? "bg-white hover:bg-slate-50/70" : "bg-slate-50/30 hover:bg-slate-50/70"}`}
                    >
                      <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-1.5">
                          {isCurrentMonth && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          <span
                            className={`font-medium ${isCurrentMonth ? "text-blue-700" : "text-slate-700"}`}
                          >
                            {mName}
                          </span>
                        </div>
                      </td>
                      {sortedYears.map((y, i) => (
                        <td key={y} className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold tabular-nums ${values[i] > 0 ? YEAR_COLORS[i % YEAR_COLORS.length].text : "text-slate-300"}`}
                          >
                            {fmt(values[i])}
                          </span>
                          {counts[i] > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {fmtNum(counts[i])} รายการ
                            </p>
                          )}
                        </td>
                      ))}
                      {sortedYears.length >= 2 && (
                        <td className="py-3 px-4 text-right">
                          {growthPct !== null ? (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${growthPct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                            >
                              {growthPct >= 0 ? "+" : ""}
                              {growthPct.toFixed(1)}%
                            </span>
                          ) : values[0] > 0 ? (
                            <span className="text-xs text-slate-400">ใหม่</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )}
                      <td className="hidden lg:table-cell py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {sortedYears.map((y, i) => (
                            <div key={y} className="flex items-center gap-1.5">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${YEAR_COLORS[i % YEAR_COLORS.length].bar} rounded-full transition-all duration-700`}
                                  style={{
                                    width: `${maxVal > 0 ? (values[i] / maxVal) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-semibold">
                  <td className="py-3.5 px-2 rounded-bl-xl text-sm">
                    รวมทั้งปี
                  </td>
                  {sortedYears.map((y, i) => {
                    const d = dataMap[y];
                    const total = d
                      ? d.months.reduce((s, m) => s + getVal(m), 0)
                      : 0;
                    const totalCount = d
                      ? d.months.reduce((s, m) => s + getCount(m), 0)
                      : 0;
                    return (
                      <td key={y} className="py-3.5 px-4 text-right">
                        <span
                          className="tabular-nums"
                          style={{
                            color:
                              i === 0
                                ? "#93c5fd"
                                : i === 1
                                  ? "#fdba74"
                                  : i === 2
                                    ? "#6ee7b7"
                                    : "#c4b5fd",
                          }}
                        >
                          {fmt(total)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {fmtNum(totalCount)} รายการ
                        </p>
                      </td>
                    );
                  })}
                  {sortedYears.length >= 2 &&
                    (() => {
                      const t0 =
                        dataMap[sortedYears[0]]?.months.reduce(
                          (s, m) => s + getVal(m),
                          0,
                        ) ?? 0;
                      const t1 =
                        dataMap[sortedYears[1]]?.months.reduce(
                          (s, m) => s + getVal(m),
                          0,
                        ) ?? 0;
                      const g = t1 > 0 ? ((t0 - t1) / t1) * 100 : null;
                      return (
                        <td className="py-3.5 px-4 text-right">
                          {g !== null ? (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${g >= 0 ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}
                            >
                              {g >= 0 ? "+" : ""}
                              {g.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      );
                    })()}
                  <td className="hidden lg:table-cell py-3.5 px-4 rounded-br-xl" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportListView() {
  const { data: session, status } = useSession();
  const permissionKeys = session?.user?.permissionKeys;
  const filteredCategories = useMemo(() => {
    if (!permissionKeys) return [];
    return reportCategories.filter(
      (c) =>
        c.permissionKey === "none" || permissionKeys.includes(c.permissionKey),
    );
  }, [permissionKeys]);

  const hasExecutivePermission = permissionKeys?.includes(
    "report.executive_dashboard",
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DetailHero
          backUrl="/"
          backLabel="หน้าแรก"
          title="หมวดรายงาน"
          icon={<TrendingUp className="h-8 w-8 text-white" />}
          backgroundColor="#1e293b"
          accentColor="#B91C1C"
          badges={
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-red-100 bg-red-500/20 border border-red-400/30 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md">
              <TrendingUp className="h-4 w-4 text-red-300" />
              วิเคราะห์ข้อมูลการขาย
            </div>
          }
        />
      </div>
      {hasExecutivePermission && (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MonthlySalesOverviewSection />
        </div>
      )}
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
                      <p className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
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
                              style={{
                                backgroundColor:
                                  categoryToHex[category.id] || "#3b82f6",
                              }}
                            />
                            <span className="text-sm font-semibold text-slate-700">
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
