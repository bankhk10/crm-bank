"use client";

import { useId, useState, useTransition, useCallback } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  UserCheck,
  ArrowLeft,
  BarChart3,
  Loader2,
  Award,
  Package,
  Layers,
  TrendingUp,
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
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import {
  getSalespersonSalesReport,
  type SalespersonReportData,
  type DateRangeFilter,
} from "@/app/actions/reports";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const quickDateRanges = [
  {
    label: "เดือนนี้",
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: "3 เดือน",
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
];

export default function SalespersonReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<SalespersonReportData | null>(null);
  const [activeTab, setActiveTab] = useState("performance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  // ฟังก์ชันดึงข้อมูลที่รองรับ Error Handling
  const handleFetchReport = useCallback(() => {
    startTransition(async () => {
      try {
        const filter: DateRangeFilter = {
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
        };
        const data = await getSalespersonSalesReport(filter);
        setReportData(data);
      } catch (error) {
        console.error("Failed to fetch salesperson report:", error);
        // สามารถเพิ่ม toast.error() แจ้งเตือนตรงนี้ได้
      }
    });
  }, [dateRange]);

  // Formatters
  const formatTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(n);

  const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

  // คำนวณยอดรวมอย่างปลอดภัย
  const totalSales = reportData?.salespersonPerformance?.reduce((s, p) => s + p.totalSales, 0) || 0;
  const totalOrders = reportData?.salespersonPerformance?.reduce((s, p) => s + p.orderCount, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">รายงานตามพนักงานขาย</h1>
            <p className="text-muted-foreground text-sm">เจาะลึกผลงานรายบุคคลและกลุ่มสินค้า</p>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="rounded-2xl border bg-white/80 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-sm font-semibold">ตัวกรองช่วงเวลา</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="sm:hidden" 
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                {filtersOpen ? "ซ่อน" : "แสดง"} ตัวกรอง
              </Button>
            </div>

            <div className={`mt-4 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 ${filtersOpen ? "block" : "hidden"} sm:block`}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">เลือกวันที่</label>
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onSelect={(r) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ปุ่มด่วน</label>
                <div className="flex flex-wrap gap-2">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(r.getValue())}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                  ดูรายงาน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {isPending ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="พนักงานขายดีที่สุด" value={reportData.topSalesperson?.name || "-"} subValue={formatTHB(reportData.topSalesperson?.sales || 0)} icon={<Award className="text-rose-600" />} color="bg-rose-50" />
              <StatCard title="ยอดขายรวม" value={formatTHB(totalSales)} icon={<TrendingUp className="text-blue-600" />} color="bg-blue-50" />
              <StatCard title="ออเดอร์รวม" value={formatNumber(totalOrders)} icon={<Package className="text-emerald-600" />} color="bg-emerald-50" />
              <StatCard title="พนักงานทั้งหมด" value={formatNumber(reportData.salespersonPerformance.length)} icon={<UserCheck className="text-purple-600" />} color="bg-purple-50" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 lg:flex h-auto p-1 bg-slate-100 rounded-xl">
                <TabsTrigger value="performance" className="data-[state=active]:bg-white rounded-lg py-2">ผลงาน</TabsTrigger>
                <TabsTrigger value="groups" className="data-[state=active]:bg-white rounded-lg py-2">กลุ่มสินค้า</TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:bg-white rounded-lg py-2">สินค้า</TabsTrigger>
                <TabsTrigger value="trend" className="data-[state=active]:bg-white rounded-lg py-2">แนวโน้ม</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart Card */}
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader><CardTitle className="text-lg">Top 10 ยอดขาย</CardTitle></CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.salespersonPerformance.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [formatTHB(v), "ยอดขาย"]} />
                          <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                            {reportData.salespersonPerformance.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Table Card */}
                  <Card className="rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader><CardTitle className="text-lg">รายละเอียดพนักงาน</CardTitle></CardHeader>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">#</TableHead>
                            <TableHead>พนักงาน</TableHead>
                            <TableHead className="text-right">ยอดขาย</TableHead>
                            <TableHead className="text-right">ออเดอร์</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.salespersonPerformance.map((p, i) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-center">
                                <Badge variant={i < 3 ? "default" : "outline"} className={i === 0 ? "bg-yellow-500" : ""}>
                                  {i + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell className="text-right text-emerald-600 font-bold">{formatTHB(p.totalSales)}</TableCell>
                              <TableCell className="text-right">{p.orderCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Content สำหรับ Tab อื่นๆ สามารถใช้โครงสร้างเดิมของคุณได้เลย */}
              <TabsContent value="groups" className="mt-6">
                 {/* ... (เนื้อหากลุ่มสินค้าตามโค้ดเดิมของคุณ) */}
              </TabsContent>

              <TabsContent value="trend" className="mt-6">
                 {/* ... (เนื้อหาแนวโน้มตามโค้ดเดิมของคุณ) */}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <UserCheck className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">ยินดีต้อนรับสู่ระบบรายงาน</h3>
              <p className="text-slate-400 max-w-xs mt-2">กรุณาเลือกช่วงวันที่คุณต้องการตรวจสอบข้อมูล แล้วกดปุ่ม "ดูรายงาน"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Sub-component สำหรับ KPI เพื่อให้โค้ดสะอาดขึ้น
function StatCard({ title, value, subValue, icon, color }: { title: string; value: string; subValue?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="p-5 flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          {subValue && <p className="text-sm font-medium text-rose-500">{subValue}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}