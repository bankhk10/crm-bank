"use client";

import { useState, useTransition } from "react";
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
  Users,
  ArrowLeft,
  BarChart3,
  Loader2,
  Crown,
  UserPlus,
  Repeat,
  UserX,
  MapPin,
  UserCheck,
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
  Legend,
} from "recharts";
import {
  getCustomerSalesReport,
  type CustomerSalesReportData,
  type DateRangeFilter,
} from "@/app/actions/reports";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];
const quickDateRanges = [
  {
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "3 เดือน",
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "ปีนี้",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];
const customerTypeLabels: Record<string, string> = {
  DEALER: "ดีลเลอร์",
  SUBDEALER: "ซับดีลเลอร์",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

export default function CustomerSalesReportPage() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [reportData, setReportData] = useState<CustomerSalesReportData | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("top-customers");

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const data = await getCustomerSalesReport(filter);
      setReportData(data);
    });
  };

  const formatTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(n);
  const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative overflow-hidden border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reports">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">รายงานตามลูกค้า</h1>
              <p className="text-muted-foreground text-sm">
                ลูกค้าซื้อสูงสุด, ความถี่, มูลค่าตลอดอายุ
              </p>
            </div>
          </div>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[280px]">
                  <label className="text-sm font-medium mb-2 block">
                    เลือกช่วงเวลา
                  </label>
                  <DateRangePicker
                    from={dateRange.from}
                    to={dateRange.to}
                    onSelect={(r) =>
                      r?.from &&
                      r?.to &&
                      setDateRange({ from: r.from, to: r.to })
                    }
                  />
                </div>
                <div className="flex gap-2">
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
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      โหลด...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      ดูรายงาน
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {isPending ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">ลูกค้าอันดับ 1</p>
                      <p className="text-lg font-bold mt-1 truncate max-w-[150px]">
                        {reportData.topCustomers[0]?.name || "-"}
                      </p>
                    </div>
                    <Crown className="h-10 w-10 text-amber-200" />
                  </div>
                  <p className="mt-4 text-sm text-amber-100">
                    {formatTHB(reportData.topCustomers[0]?.totalSales || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">ลูกค้าใหม่</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.customerAcquisition.newCustomers}
                      </p>
                    </div>
                    <UserPlus className="h-10 w-10 text-emerald-200" />
                  </div>
                  <p className="mt-4 text-sm text-emerald-100">
                    {formatTHB(
                      reportData.customerAcquisition.newCustomersSales
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">ลูกค้าเดิม</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.customerAcquisition.returningCustomers}
                      </p>
                    </div>
                    <Repeat className="h-10 w-10 text-blue-200" />
                  </div>
                  <p className="mt-4 text-sm text-blue-100">
                    {formatTHB(
                      reportData.customerAcquisition.returningCustomersSales
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-500">
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-red-100 text-sm">ลูกค้าไม่ Active</p>
                      <p className="text-2xl font-bold mt-1">
                        {reportData.inactiveCustomers.length}
                      </p>
                    </div>
                    <UserX className="h-10 w-10 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl">
                <TabsTrigger value="top-customers" className="rounded-lg">
                  ลูกค้าซื้อสูงสุด
                </TabsTrigger>
                <TabsTrigger value="by-type" className="rounded-lg">
                  ตามประเภท
                </TabsTrigger>
                <TabsTrigger value="by-region" className="rounded-lg">
                  ตามภูมิภาค
                </TabsTrigger>
                <TabsTrigger value="inactive" className="rounded-lg">
                  ไม่ Active
                </TabsTrigger>
              </TabsList>
              <TabsContent value="top-customers" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Top ลูกค้า</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reportData.topCustomers
                            .slice(0, 10)
                            .map((c) => ({
                              name: c.name.slice(0, 15),
                              sales: c.totalSales,
                            }))}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(v: number) => [formatTHB(v), "ยอดขาย"]}
                          />
                          <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                            {reportData.topCustomers
                              .slice(0, 10)
                              .map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={COLORS[i % COLORS.length]}
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>ลูกค้า</TableHead>
                          <TableHead>ประเภท</TableHead>
                          <TableHead className="text-right">ยอดขาย</TableHead>
                          <TableHead className="text-right">ออเดอร์</TableHead>
                          <TableHead className="text-right">
                            ความถี่/เดือน
                          </TableHead>
                          <TableHead className="text-right">
                            Lifetime Value
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.topCustomers.slice(0, 20).map((c, i) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  i < 3 ? "bg-amber-100 text-amber-800" : ""
                                }
                              >
                                {i + 1}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.code}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {customerTypeLabels[c.type] || c.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              {formatTHB(c.totalSales)}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.orderCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.purchaseFrequency.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatTHB(c.lifetimeValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="by-type" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>ตามประเภทลูกค้า</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.customerTypeBreakdown.map(
                                (ct) => ({
                                  name: customerTypeLabels[ct.type] || ct.type,
                                  value: ct.totalSales,
                                })
                              )}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={60}
                              label={({ name, percent }) =>
                                `${name}:${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {reportData.customerTypeBreakdown.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={COLORS[i % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number) => [
                                formatTHB(v),
                                "ยอดขาย",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>รายละเอียด</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ประเภท</TableHead>
                            <TableHead className="text-right">จำนวน</TableHead>
                            <TableHead className="text-right">ยอดขาย</TableHead>
                            <TableHead className="text-right">เฉลี่ย</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.customerTypeBreakdown.map((ct, i) => (
                            <TableRow key={ct.type}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        COLORS[i % COLORS.length],
                                    }}
                                  />
                                  {customerTypeLabels[ct.type] || ct.type}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {ct.customerCount}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 font-semibold">
                                {formatTHB(ct.totalSales)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatTHB(ct.avgSalesPerCustomer)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="by-region" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-amber-500" />
                      ตามภูมิภาค
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.customerByRegion}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                          <YAxis
                            tickFormatter={(v) =>
                              `${(v / 1000000).toFixed(1)}M`
                            }
                          />
                          <Tooltip
                            formatter={(v: number) => [formatTHB(v), "ยอดขาย"]}
                          />
                          <Bar dataKey="totalSales" radius={[4, 4, 0, 0]}>
                            {reportData.customerByRegion.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ภูมิภาค</TableHead>
                          <TableHead className="text-right">ลูกค้า</TableHead>
                          <TableHead className="text-right">ยอดขาย</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.customerByRegion.map((r, i) => (
                          <TableRow key={r.region}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: COLORS[i % COLORS.length],
                                  }}
                                />
                                {r.region}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.customerCount}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 font-semibold">
                              {formatTHB(r.totalSales)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="inactive" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-500" />
                      ลูกค้าไม่ Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.inactiveCustomers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ทุกคน Active!</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่อ</TableHead>
                            <TableHead className="text-right">
                              ไม่ซื้อมา
                            </TableHead>
                            <TableHead className="text-right">
                              Lifetime
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.inactiveCustomers.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono text-sm">
                                {c.code}
                              </TableCell>
                              <TableCell className="font-medium">
                                {c.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    c.daysSinceLastPurchase > 180
                                      ? "bg-red-100 text-red-800"
                                      : ""
                                  }
                                >
                                  {c.daysSinceLastPurchase} วัน
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatTHB(c.lifetimeValue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
