"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  User,
  UserCheck,
  Phone,
  Mail,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Building2,
  ExternalLink,
  ArrowLeft,
  Briefcase,
  Store,
  Search,
  Layers,
  CheckCircle2,
  XCircle,
  Target,
  Award,
  CalendarDays,
  Package,
  Users,
  BarChart3,
  Star,
  MapPin,
  Clock,
} from "lucide-react";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailItem } from "@/components/custom/detail-item";
import { KpiCard } from "../../ui/kpi-card";
import Link from "next/link";
import type { SalespersonDetailReportData } from "@/modules/reports/types";

// ─── Formatters ─────────────────────────────
const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

const formatShortTHB = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return formatTHB(v);
};

// ─── Status colors ──────────────────────────
const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  AWAITING_PAYMENT: "bg-blue-100 text-blue-800",
  PAID: "bg-emerald-100 text-emerald-800",
  AWAITING_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-indigo-100 text-indigo-800",
  DELIVERY_COMPLETED: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  OVERDUE: "bg-red-100 text-red-800",
  WAITING_FOR_CORRECTION: "bg-yellow-100 text-yellow-800",
};

const customerTypeLabels: Record<string, string> = {
  DEALER: "ดีลเลอร์",
  SUBDEALER: "ซับดีลเลอร์",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

// ─── Mini Bar Chart (pure CSS) ──────────────
function MiniBarChart({
  data,
}: {
  data: { label: string; actual: number; target: number }[];
}) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.actual, d.target)),
    1,
  );

  return (
    <div className="flex items-end gap-1.5 h-40 pt-4">
      {data.map((d, i) => {
        const actualHeight = (d.actual / maxVal) * 100;
        const targetHeight = (d.target / maxVal) * 100;
        const isFuture = d.actual === 0 && d.target > 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="relative w-full flex items-end justify-center gap-0.5 h-28">
              {d.target > 0 && (
                <div
                  className="w-2.5 rounded-t-sm bg-slate-200 transition-all duration-500"
                  style={{ height: `${targetHeight}%`, minHeight: 2 }}
                  title={`เป้า: ${formatShortTHB(d.target)}`}
                />
              )}
              <div
                className={`w-2.5 rounded-t-sm transition-all duration-500 ${isFuture
                  ? "bg-slate-100"
                  : d.actual >= d.target && d.target > 0
                    ? "bg-emerald-500"
                    : d.target > 0
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                style={{ height: `${Math.max(actualHeight, 1)}%`, minHeight: 2 }}
                title={`จริง: ${formatShortTHB(d.actual)}`}
              />
            </div>
            <span className="text-[9px] text-slate-400 leading-none mt-1">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ─────────────────────────────
interface SalespersonDetailViewProps {
  employeeId: string;
}

export default function SalespersonDetailView({
  employeeId,
}: SalespersonDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalespersonDetailReportData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { getSalespersonDetailReportAction } = await import(
        "@/modules/reports/server/actions"
      );
      const result = await getSalespersonDetailReportAction(employeeId);
      setData(result);
    } catch (error) {
      console.error("Error fetching salesperson detail:", error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <UserCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">ไม่พบข้อมูลพนักงาน</h2>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
        </div>
      </div>
    );
  }

  const { employee, kpi } = data;

  const filteredCustomers = data.responsibleCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.province.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <DetailHero
        backUrl="/reports/customer-sales"
        backLabel="หน้ารายงานแยกตามพนักงาน"
        title={employee.name}
        icon={<UserCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
        accentColor="#B91C1C"
        badges={
          <>
            {employee.employeeCode && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full">
                <Briefcase className="h-3.5 w-3.5 text-gray-200" />
                รหัส: {employee.employeeCode}
              </span>
            )}
            {employee.positionTitle && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full">
                <Briefcase className="h-3.5 w-3.5 text-gray-200" />
                {employee.positionTitle}
              </span>
            )}
            {employee.department?.name && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full">
                <Layers className="h-3.5 w-3.5 text-gray-200" />
                {employee.department.name}
              </span>
            )}
            {employee.status === "ACTIVE" || !employee.status ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/50 px-3 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ใช้งาน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-200 bg-white/5 border border-white/50 px-3 py-1 rounded-full">
                <XCircle className="h-3.5 w-3.5" />
                {employee.status}
              </span>
            )}
          </>
        }
      />

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── KPI Summary (8 cards) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label={`ยอดขายรวม`}
            value={formatTHB(kpi.yearTotalSales)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-red-600 to-red-700"
            ring="shadow-lg shadow-red-600/20"
            topColor="red"
          />
          <KpiCard
            label={`เป้าหมายทั้งปี`}
            value={formatTHB(data.monthlyPerformance.reduce((s, m) => s + m.target, 0))}
            icon={Target}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
            ring="shadow-lg shadow-red-500/20"
            topColor="black"
          />
          <KpiCard
            label="ออเดอร์ทั้งปี"
            value={formatNumber(kpi.yearOrderCount)}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-slate-900 to-slate-800"
            ring="shadow-lg shadow-slate-900/20"
            topColor="red"
          />
          <KpiCard
            label="คะแนนสะสม"
            value={formatNumber(kpi.totalPoints)}
            sublabel="คะแนน"
            icon={Award}
            gradient="bg-gradient-to-br from-slate-800 to-slate-900"
            ring="shadow-lg shadow-slate-800/20"
            topColor="black"
          />
          <KpiCard
            label="ยอดขายเดือนนี้"
            value={formatTHB(kpi.monthTotalSales)}
            sublabel={`${kpi.monthOrderCount} ออเดอร์`}
            icon={CalendarDays}
            gradient="bg-gradient-to-br from-red-600 to-red-700"
            ring="shadow-lg shadow-red-600/20"
            topColor="red"
          />
          <KpiCard
            label="เป้ายอดขาย (เดือนนี้)"
            value={kpi.currentMonthTarget > 0 ? formatTHB(kpi.currentMonthTarget) : "ไม่มีเป้า"}
            icon={Target}
            gradient="bg-gradient-to-br from-slate-900 to-slate-800"
            ring="shadow-lg shadow-slate-900/20"
            topColor="black"
          />
          <KpiCard
            label="ผลงาน vs เป้า"
            value={kpi.currentMonthTarget > 0 ? `${kpi.achievementPercent}%` : "-"}
            icon={BarChart3}
            gradient={kpi.achievementPercent >= 100 ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-600"}
            ring={kpi.achievementPercent >= 100 ? "shadow-lg shadow-emerald-600/20" : "shadow-lg shadow-red-500/20"}
            topColor={kpi.achievementPercent >= 100 ? undefined : "red"}
            barWidth={kpi.currentMonthTarget > 0 ? `${Math.min(kpi.achievementPercent, 100)}%` : undefined}
            barColor={kpi.achievementPercent >= 100 ? "bg-emerald-500" : "bg-red-500"}
          />
          <KpiCard
            label="ขายล่าสุด"
            value={kpi.lastSaleDate || "-"}
            icon={Clock}
            gradient="bg-gradient-to-br from-slate-800 to-slate-700"
            ring="shadow-lg shadow-slate-800/20"
            topColor="black"
          />
        </div>

        {/* ─── Tabbed Content ─── */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="border-b px-2 sm:px-4 overflow-x-auto">
              <TabsList className="h-12 bg-transparent inline-flex w-auto min-w-full sm:min-w-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  ภาพรวม
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  รายเดือน
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Package className="h-4 w-4 mr-1.5" />
                  สินค้า
                </TabsTrigger>
                <TabsTrigger
                  value="customers"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Store className="h-4 w-4 mr-1.5" />
                  ลูกค้า
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  ประวัติการขาย
                </TabsTrigger>
                <TabsTrigger
                  value="points"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Star className="h-4 w-4 mr-1.5" />
                  ประวัติคะแนนสะสม
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ══════════ Tab: Overview ══════════ */}
              <TabsContent value="overview" className="m-0 p-4 sm:p-6 space-y-6">
                {/* Status Breakdown */}
                <Card className="border border-slate-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-red-600" />
                      สถานะออเดอร์ (ตามช่วงเวลาที่เลือก)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.salesStatusData.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">
                        ไม่มีข้อมูล
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {data.salesStatusData
                          .sort((a, b) => b.count - a.count)
                          .map((s) => (
                            <div
                              key={s.status}
                              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                            >
                              <Badge
                                className={`${statusColors[s.status] || "bg-gray-100"} border-0 text-[10px] mb-2`}
                              >
                                {s.statusLabel}
                              </Badge>
                              <p className="text-lg font-bold text-slate-800">
                                {formatNumber(s.count)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTHB(s.amount)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact + Work info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-slate-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        ข้อมูลติดต่อ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow icon={<Phone className="h-4 w-4 text-blue-600" />} label="โทรศัพท์" value={employee.phone || "-"} />
                      <InfoRow icon={<Mail className="h-4 w-4 text-emerald-600" />} label="อีเมล" value={employee.email || "-"} />
                      {(employee.addressLine || employee.province) && (
                        <InfoRow
                          icon={<MapPin className="h-4 w-4 text-red-600" />}
                          label="ที่อยู่"
                          value={[
                            employee.addressLine,
                            employee.subdistrict && `ต.${employee.subdistrict}`,
                            employee.district && `อ.${employee.district}`,
                            employee.province && `จ.${employee.province}`,
                            employee.postalCode,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        />
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        ข้อมูลการทำงาน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow icon={<Building2 className="h-4 w-4 text-slate-600" />} label="บริษัท" value={employee.company?.name || "-"} />
                      <InfoRow icon={<Layers className="h-4 w-4 text-slate-600" />} label="แผนก" value={employee.department?.name || "-"} />
                      <InfoRow icon={<Briefcase className="h-4 w-4 text-slate-600" />} label="ตำแหน่ง" value={employee.positionTitle || employee.roleTitle || "-"} />
                      <InfoRow icon={<MapPin className="h-4 w-4 text-slate-600" />} label="เขตรับผิดชอบ" value={employee.responsibilityArea || "-"} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ══════════ Tab: Monthly ══════════ */}
              <TabsContent value="monthly" className="m-0 p-4 sm:p-6">
                <Card className="border border-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-red-600" />
                      ผลงานรายเดือน ({data.currentYear})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[700px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead>เดือน</TableHead>
                            <TableHead className="text-center">เป้าหมาย</TableHead>
                            <TableHead className="text-center">ยอดขายจริง</TableHead>
                            <TableHead className="text-center">สำเร็จ %</TableHead>
                            <TableHead className="text-center">ออเดอร์</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.monthlyPerformance.map((m) => {
                            const isCurrent = m.monthIndex === new Date().getMonth() + 1;
                            return (
                              <TableRow
                                key={m.monthIndex}
                                className={isCurrent ? "bg-red-50/50" : ""}
                              >
                                <TableCell className="font-medium">
                                  {m.month}
                                  {isCurrent && (
                                    <Badge className="ml-2 bg-red-100 text-red-700 border-0 text-[10px]">
                                      เดือนนี้
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {m.target > 0 ? formatTHB(m.target) : "-"}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-emerald-600">
                                  {m.actual > 0 ? formatTHB(m.actual) : "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {m.target > 0 ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Progress
                                        value={Math.min(m.achievementPercent, 100)}
                                        className="h-2 w-16"
                                      />
                                      <span
                                        className={`text-xs font-bold ${m.achievementPercent >= 100
                                          ? "text-emerald-600"
                                          : m.achievementPercent >= 70
                                            ? "text-amber-600"
                                            : "text-red-600"
                                          }`}
                                      >
                                        {m.achievementPercent}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {m.orders > 0 ? formatNumber(m.orders) : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Summary row */}
                          <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                            <TableCell>รวมทั้งปี</TableCell>
                            <TableCell className="text-center">
                              {formatTHB(
                                data.monthlyPerformance.reduce((s, m) => s + m.target, 0),
                              )}
                            </TableCell>
                            <TableCell className="text-center text-emerald-600">
                              {formatTHB(kpi.yearTotalSales)}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const totalTarget = data.monthlyPerformance.reduce(
                                  (s, m) => s + m.target,
                                  0,
                                );
                                return totalTarget > 0
                                  ? `${Math.round((kpi.yearTotalSales / totalTarget) * 100)}%`
                                  : "-";
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatNumber(kpi.yearOrderCount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ══════════ Tab: Products ══════════ */}
              <TabsContent value="products" className="m-0 p-4 sm:p-6">
                <Card className="border border-slate-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-600" />
                        สินค้าที่ขาย (ตามช่วงเวลาที่เลือก)
                      </CardTitle>
                      <Badge variant="secondary">
                        {data.productBreakdown.length} รายการ
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[800px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[60px]">ลำดับ</TableHead>
                            <TableHead>สินค้า</TableHead>
                            <TableHead className="text-center">จำนวนที่ขาย</TableHead>
                            <TableHead className="text-center">ยอดขาย</TableHead>
                            <TableHead className="text-center">สัดส่วน</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.productBreakdown.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                ไม่พบข้อมูลสินค้า
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.productBreakdown.map((p, i) => (
                              <TableRow key={p.productId} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      i < 3
                                        ? "bg-red-100 text-red-800 border-red-300"
                                        : "bg-slate-100 text-slate-600"
                                    }
                                  >
                                    {i + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="font-semibold text-slate-900 leading-tight">
                                    {p.productName}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {p.productCode}
                                    {p.brand !== "-" && ` · ${p.brand}`}
                                  </p>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {formatNumber(p.quantity)}
                                </TableCell>
                                <TableCell className="text-center font-bold text-emerald-600">
                                  {formatTHB(p.revenue)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={p.contribution} className="h-2 w-14" />
                                    <span className="text-xs font-medium text-slate-600">
                                      {p.contribution}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ══════════ Tab: Customers ══════════ */}
              <TabsContent value="customers" className="m-0 p-4 sm:p-6">
                <Card className="border border-slate-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-red-600" />
                        ลูกค้าที่ขายได้ ({data.currentYear})
                      </CardTitle>
                      <Badge variant="secondary">
                        {data.customerBreakdown.length} ราย
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[800px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[60px]">ลำดับ</TableHead>
                            <TableHead>ลูกค้า</TableHead>
                            <TableHead className="text-center">ภูมิภาค</TableHead>
                            <TableHead className="text-center">จำนวนออเดอร์</TableHead>
                            <TableHead className="text-center">ยอดขาย</TableHead>
                            <TableHead className="text-center">ขายล่าสุด</TableHead>
                            <TableHead className="text-center">สถานะ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.customerBreakdown.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                ไม่พบข้อมูลลูกค้า
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.customerBreakdown.map((c, i) => (
                              <TableRow key={c.customerId} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      i < 3
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : "bg-slate-100 text-slate-600"
                                    }
                                  >
                                    {i + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/customers/${c.customerId}`}
                                    className="hover:text-red-600 transition-colors"
                                  >
                                    <p className="font-semibold text-slate-900 leading-tight">
                                      {c.customerName}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {c.customerCode}
                                    </p>
                                  </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                                    {c.region}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {formatNumber(c.orders)}
                                </TableCell>
                                <TableCell className="text-center font-bold text-emerald-600">
                                  {formatTHB(c.revenue)}
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {c.lastOrderDate}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`font-semibold border ${c.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      : "bg-slate-50 text-slate-700 border-slate-100"
                                      }`}
                                  >
                                    {c.status === "ACTIVE" ? "ปกติ" : c.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ══════════ Tab: Sales History ══════════ */}
              <TabsContent value="sales" className="m-0 p-4 sm:p-6">
                <Card className="border border-slate-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-red-500" />
                        ประวัติการขายล่าสุด
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[700px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead>เลขที่</TableHead>
                            <TableHead>ลูกค้า</TableHead>
                            <TableHead>วันที่</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead className="text-right">มูลค่า</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recentSales.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                ยังไม่มีประวัติการขาย
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.recentSales.map((sale) => (
                              <TableRow key={sale.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-sm">
                                  {sale.saleNumber}
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium text-sm">{sale.customerName}</p>
                                  <p className="text-xs text-slate-500">{sale.customerCode}</p>
                                </TableCell>
                                <TableCell className="text-sm">{sale.saleDate}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`${statusColors[sale.status] || "bg-gray-100"} border-0 text-[10px]`}
                                  >
                                    {sale.statusLabel}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                  {formatTHB(sale.totalAmount)}
                                </TableCell>
                                <TableCell>
                                  <Link href={`/sales/${sale.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ══════════ Tab: Points History ══════════ */}
              <TabsContent value="points" className="m-0 p-4 sm:p-6">
                {data.pointHistory.length > 0 ? (
                  <Card className="border border-slate-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        ประวัติคะแนนสะสม
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[600px]">
                          <TableHeader>
                            <TableRow className="bg-slate-50/50">
                              <TableHead>เลขที่ขาย</TableHead>
                              <TableHead>สินค้า</TableHead>
                              <TableHead className="text-right">จำนวน</TableHead>
                              <TableHead className="text-right">คะแนน/หน่วย</TableHead>
                              <TableHead className="text-right">คะแนนรวม</TableHead>
                              <TableHead className="text-center">วันที่</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.pointHistory.slice(0, 50).map((ph) => (
                              <TableRow key={ph.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-sm">
                                  {ph.saleNumber}
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{ph.productName}</p>
                                  <p className="text-xs text-slate-500">{ph.productCode}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(ph.quantity)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatNumber(ph.pointPerUnit)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-yellow-600">
                                  +{formatNumber(ph.totalPoints)}
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {ph.saleDate}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>ไม่มีประวัติคะแนนสะสม</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────

// ─── Sub-components ─────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 rounded-lg shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm break-words">{value}</p>
      </div>
    </div>
  );
}
