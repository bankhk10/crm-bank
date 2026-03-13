"use client";

import { useId, useState, useTransition } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  TrendingUp,
  ArrowLeft,
  BarChart3,
  Loader2,
  Users,
  Package,
  UserCheck,
  MapPin,
} from "lucide-react";
import Link from "next/link";
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
import {
  getExecutiveDashboardReportAction,
  type ExecutiveDashboardData,
  type DateRangeFilter,
  formatTHB,
  formatNumber,
  formatShortTHB,
  chartTooltipStyle,
  COLORS,
  quickDateRanges,
} from "@/modules/reports";
import { KpiCard } from "../../ui/kpi-card";

export function AggregateReportDashboard() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<ExecutiveDashboardData | null>(
    null,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getExecutiveDashboardReportAction(filter);
      setReportData(data);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/25">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Executive Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              ภาพรวมสรุปผลประกอบการและข้อมูลสำคัญทางธุรกิจ
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ตัวกรองสรุปรายงาน
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-9 px-3 text-xs"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                {filtersOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 ${
                filtersOpen ? "block" : "hidden"
              } sm:block`}
            >
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  เลือกช่วงเวลา
                </label>
                <div className="h-11">
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  ช่วงเวลาแนะนำ
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {quickDateRanges.slice(0, 4).map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs w-full sm:w-auto"
                      onClick={() => {
                        const { from, to } = range.getValue();
                        setDateRange({ from, to });
                      }}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="w-full h-11 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-lg shadow-primary/25 text-sm sm:text-base"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      ดูรายงาน
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
            <Skeleton className="h-96 col-span-full rounded-2xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="ยอดขายรวม"
                value={formatTHB(reportData.summary.totalSales)}
                sub={<div className="text-[10px] text-muted-foreground">Growth: {reportData.summary.growthPercentage.toFixed(1)}%</div>}
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-primary to-indigo-600"
                ring="shadow-lg shadow-primary/20"
                barColor="bg-primary"
                barWidth={`${Math.min(Math.abs(reportData.summary.growthPercentage), 100)}%`}
              />
              <KpiCard
                label="จำนวนออเดอร์"
                value={formatNumber(reportData.summary.totalOrders)}
                sub={<div className="text-[10px] text-muted-foreground">บิลที่ยืนยันแล้ว</div>}
                icon={BarChart3}
                gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
                ring="shadow-lg shadow-indigo-500/20"
                barColor="bg-indigo-500"
                barWidth="70%"
              />
              <KpiCard
                label="ค่าเฉลี่ยต่อบิล"
                value={formatTHB(reportData.summary.avgOrderValue)}
                sub={<div className="text-[10px] text-muted-foreground">Avg. Order Value</div>}
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                ring="shadow-lg shadow-emerald-500/20"
                barColor="bg-emerald-500"
                barWidth="60%"
              />
              <KpiCard
                label="ภูมิภาคหลัก"
                value={reportData.salesByRegion[0]?.region || "-"}
                sub={<div className="text-[10px] text-muted-foreground">{formatTHB(reportData.salesByRegion[0]?.sales || 0)}</div>}
                icon={MapPin}
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                ring="shadow-lg shadow-amber-500/20"
                barColor="bg-amber-500"
                barWidth="80%"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trend Chart */}
              <Card className="lg:col-span-2 rounded-2xl border shadow-sm bg-white/70 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">แนวโน้มยอดขายรายเดือน</CardTitle>
                  <CardDescription>กราฟแสดงยอดขายและจำนวนออเดอร์รายเดือน</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        tickFormatter={(v) => formatShortTHB(v)}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatTHB(v), "ยอดขาย"]} />
                      <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Regional Chart */}
              <Card className="rounded-2xl border shadow-sm bg-white/70">
                <CardHeader>
                  <CardTitle className="text-lg">สัดส่วนพื้นที่ขาย</CardTitle>
                  <CardDescription>ยอดขายแยกตามภูมิภาค</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.salesByRegion}
                        dataKey="sales"
                        nameKey="region"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {reportData.salesByRegion.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatTHB(v), "ยอดขาย"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Top Products */}
              <Card className="rounded-2xl border shadow-sm bg-white/70">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Top 5 สินค้าขายดี</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {reportData.topProducts.map((p, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{formatTHB(p.sales)}</p>
                          <p className="text-[10px] text-muted-foreground">{p.quantity} ชิ้น</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card className="rounded-2xl border shadow-sm bg-white/70">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base">Top 5 ลูกค้าคนสำคัญ</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {reportData.topCustomers.map((c, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{formatTHB(c.sales)}</p>
                          <p className="text-[10px] text-muted-foreground">{c.orders} ออเดอร์</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Salespersons */}
              <Card className="rounded-2xl border shadow-sm bg-white/70">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">Top 5 พนักงานขายดาวรุ่ง</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {reportData.topSalespersons.map((s, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[120px]">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{formatTHB(s.sales)}</p>
                          <p className="text-[10px] text-muted-foreground">{s.orders} ออเดอร์</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="rounded-3xl border border-dashed bg-white/50 py-20">
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-white shadow-sm">
                <TrendingUp className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-700">เริ่มวิเคราะห์ข้อมูลของคุณ</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  เลือกช่วงวันที่และกดปุ่มดูรายงานเพื่อแสดงสรุปผลประกอบการ
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
