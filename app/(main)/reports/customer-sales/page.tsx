"use client";

import { useId, useState, useTransition } from "react";
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
import { Users, ArrowLeft, BarChart3, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { CustomerDetailPanel } from "@/components/features/customers/customer-detail-panel";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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
    null,
  );
  const [activeTab, setActiveTab] = useState("top-customers");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedCustomerId(null);
  };

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

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header: mobile stack, sm row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานตามลูกค้า
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              ลูกค้าซื้อสูงสุด, ความถี่, มูลค่าตลอดอายุ
            </p>
          </div>
        </div>

        {/* Filters: mobile collapsible, sm=2 cols, lg=3 cols */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ตัวกรองช่วงเวลา
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
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
                    onSelect={(r) =>
                      r?.from && r?.to && setDateRange({ from: r.from, to: r.to })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  ช่วงเวลาแนะนำ
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
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
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
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
            </div>
          </CardContent>
        </Card>

        <div>
          {isPending ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-80 sm:h-96 rounded-2xl" />
            </div>
          ) : reportData ? (
            <div className="space-y-4 sm:space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl h-auto grid grid-cols-2 sm:flex gap-2 sm:gap-0">
                  <TabsTrigger
                    value="top-customers"
                    className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    ลูกค้าซื้อสูงสุด
                  </TabsTrigger>
                  <TabsTrigger
                    value="by-type"
                    className="rounded-lg py-2 sm:py-3 px-3 sm:px-6 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    ตามประเภท
                  </TabsTrigger>
                </TabsList>
              <TabsContent value="top-customers" className="mt-6">
                <Card className="rounded-2xl border bg-white/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Top ลูกค้า</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table className="mt-4 min-w-[860px]">
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
                            <TableHead className="text-center">
                              ดูรายละเอียด
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
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewCustomer(c.id)}
                                  className="hover:bg-amber-100 dark:hover:bg-amber-900"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  ดู
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="by-type" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>ตามประเภทลูกค้า</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.customerTypeBreakdown.map(
                                (ct) => ({
                                  name: customerTypeLabels[ct.type] || ct.type,
                                  value: ct.totalSales,
                                }),
                              )}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              innerRadius={80}
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
                  <Card className="rounded-2xl border bg-white/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>รายละเอียด</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table className="min-w-[520px]">
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Detail Panel */}
      <CustomerDetailPanel
        customerId={selectedCustomerId}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        startDate={format(dateRange.from, "yyyy-MM-dd")}
        endDate={format(dateRange.to, "yyyy-MM-dd")}
      />
    </div>
  );
}
