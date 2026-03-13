"use client";

import { useId, useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


import {
  Users,
  ArrowLeft,
  Eye,
  Search,
  TrendingUp,
  ShoppingCart,
  Award,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  getAllCustomersForReportAction,
  getAllSalespersonsForReportAction,
  type CustomerListItem,
  type SalespersonListItem,
} from "@/modules/reports";

const customerTypeLabels: Record<string, string> = {
  DEALER: "ดีลเลอร์",
  SUBDEALER: "ซับดีลเลอร์",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

export function CustomerSalesDashboard() {
  const [isPending, startTransition] = useTransition();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [salespersons, setSalespersons] = useState<SalespersonListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("customers");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  // Fetch all data on mount
  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const [customerData, salespersonData] = await Promise.all([
          getAllCustomersForReportAction(),
          getAllSalespersonsForReportAction(),
        ]);
        setCustomers(customerData);
        setSalespersons(salespersonData);
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const formatTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(n);

  const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

  // Filter customers by search query
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.province &&
        c.province.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredSalespersons = salespersons.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate totals
  const totalCustomerSales = customers.reduce((sum, c) => sum + c.totalSales, 0);
  const totalSalespersonSales = salespersons.reduce(
    (sum, s) => sum + s.totalSales,
    0,
  );
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              รายงานลูกค้าและพนักงานขาย
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              รายชื่อลูกค้าและพนักงานขายพร้อมข้อมูลยอดขายรวม
            </p>
          </div>
        </div>

        {/* Search Bar: mobile collapsible */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ค้นหาลูกค้า
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
                {filtersOpen ? "ซ่อน" : "แสดง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mt-3 ${filtersOpen ? "block" : "hidden"} sm:block`}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "customers"
                      ? "ค้นหาลูกค้า (ชื่อ, รหัส, จังหวัด)..."
                      : "ค้นหาพนักงานขาย (ชื่อ, รหัส, แผนก)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {isLoading || isPending ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 sm:h-96 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* KPI Cards: mobile=1 col, sm=2 cols, lg=4 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {activeTab === "customers" ? "ลูกค้า" : "พนักงานขาย"} ยอดสูงสุด
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {activeTab === "customers"
                          ? customers[0]?.name || "-"
                          : salespersons[0]?.name || "-"}
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-600 mt-1">
                        {activeTab === "customers"
                          ? customers[0]
                            ? formatTHB(customers[0].totalSales)
                            : "-"
                          : salespersons[0]
                            ? formatTHB(salespersons[0].totalSales)
                            : "-"}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-amber-50">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        ยอดขายรวมตาม {activeTab === "customers" ? "ลูกค้า" : "พนักงานขาย"}
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {activeTab === "customers"
                          ? formatTHB(totalCustomerSales)
                          : formatTHB(totalSalespersonSales)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-50">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        ออเดอร์รวม
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {formatNumber(totalOrders)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {activeTab === "customers" ? "จำนวนลูกค้า" : "จำนวนพนักงานขาย"}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                        {activeTab === "customers"
                          ? formatNumber(customers.length)
                          : formatNumber(salespersons.length)}
                      </p>
                      <p className="text-xs sm:text-sm text-amber-600 mt-1">
                        ที่มียอดขาย
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-orange-50">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="bg-white/50 p-1 rounded-xl h-auto border mb-6">
                <TabsTrigger
                  value="customers"
                  className="rounded-lg py-2.5 px-6 text-sm font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Users className="w-4 h-4 mr-2" />
                  รายชื่อลูกค้า
                </TabsTrigger>
                <TabsTrigger
                  value="salespersons"
                  className="rounded-lg py-2.5 px-6 text-sm font-medium data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  ผลงานพนักงานขาย
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customers">

            {/* Table */}
            <Card className="rounded-2xl border bg-white/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  รายชื่อลูกค้า
                </CardTitle>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {filteredCustomers.length} ลูกค้า
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ลำดับ</TableHead>
                        <TableHead>ลูกค้า</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>จังหวัด</TableHead>
                        <TableHead className="text-right">ยอดขายรวม</TableHead>
                        <TableHead className="text-right">ออเดอร์</TableHead>
                        <TableHead className="text-right">
                          ความถี่/เดือน
                        </TableHead>
                        <TableHead className="text-right">
                          มูลค่ารวมทั้งหมด
                        </TableHead>
                        <TableHead className="text-center">
                          ดูรายละเอียด
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Users className="h-10 w-10" />
                              <p>ไม่พบข้อมูลลูกค้า</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((c, i) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  i < 3 ? "bg-amber-100 text-amber-800 border-amber-300" : ""
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
                            <TableCell>{c.province}</TableCell>
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
                              <Link href={`/reports/customer-sales/${c.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" /> ดู
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
                {/* Footer hint */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-full border border-slate-200/70 bg-white/70 px-2 font-medium">
                      Tip
                    </span>
                    <span>เลื่อนตารางในแนวนอนเพื่อดูข้อมูลทั้งหมด</span>
                  </div>
                  <div className="text-slate-400 italic">
                    คลิก "ดู" เพื่อดูรายละเอียดเชิงลึก
                  </div>
                </div>
              </Card>
            </TabsContent>

              <TabsContent value="salespersons">
                <Card className="rounded-2xl border bg-white/70 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-lg">
                      ผลงานพนักงานขายรายบุคคล
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[800px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[80px]">ลำดับ</TableHead>
                            <TableHead>พนักงานขาย</TableHead>
                            <TableHead>แผนก/ทีม</TableHead>
                            <TableHead className="text-right">ยอดขายรวม</TableHead>
                            <TableHead className="text-right">จำนวนออเดอร์</TableHead>
                            <TableHead className="text-right">จำนวนลูกค้า</TableHead>
                            <TableHead className="text-center">ประวัติ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSalespersons.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-32 text-center text-muted-foreground"
                              >
                                ไม่พบข้อมูลพนักงานขาย
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSalespersons.map((s, idx) => (
                              <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      idx < 3
                                        ? "bg-rose-100 text-rose-800 border-rose-300 shadow-sm"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }
                                  >
                                    {idx + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-slate-900 leading-tight">
                                      {s.name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {s.employeeCode}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-normal border-slate-200 bg-white">
                                    {s.department}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-rose-600">
                                  {formatTHB(s.totalSales)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatNumber(s.orderCount)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatNumber(s.customerCount)} ราย
                                </TableCell>
                                <TableCell className="text-center">
                                  <Link href={`/reports/salesperson/${s.id}`}>
                                    <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600 rounded-lg">
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      ดูผลงาน
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400 text-center italic">
                      สรุปผลงานตามพนักงานขายตามช่วงเวลาที่กำหนด
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
