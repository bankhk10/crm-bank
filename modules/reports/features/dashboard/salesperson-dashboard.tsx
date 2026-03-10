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
import {
  UserCheck,
  ArrowLeft,
  Eye,
  Search,
  Award,
  TrendingUp,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  getAllSalespersonsForReportAction,
  type SalespersonListItem,
} from "@/modules/reports";

export function SalespersonDashboard() {
  const [isPending, startTransition] = useTransition();
  const [salespersons, setSalespersons] = useState<SalespersonListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  // Fetch all salespersons on mount
  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const data = await getAllSalespersonsForReportAction();
        setSalespersons(data);
      } catch (error) {
        console.error("Failed to fetch salespersons:", error);
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

  // Filter salespersons by search query
  const filteredSalespersons = salespersons.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalSales = salespersons.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOrders = salespersons.reduce((sum, s) => sum + s.orderCount, 0);
  const topSalesperson = salespersons[0];

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
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25">
              <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              รายงานตามพนักงานขาย
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              รายชื่อพนักงานขายทั้งหมด และผลงาน
            </p>
          </div>
        </div>

        {/* Search Bar: mobile collapsible */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ค้นหาพนักงาน
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-9 px-3 text-xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
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
                  placeholder="ค้นหาพนักงาน (ชื่อ, รหัส, แผนก)..."
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
                        พนักงานขายดีที่สุด
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {topSalesperson?.name || "-"}
                      </p>
                      <p className="text-xs sm:text-sm text-rose-600 mt-1">
                        {topSalesperson ? formatTHB(topSalesperson.totalSales) : "-"}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-rose-50">
                      <Award className="h-6 w-6 text-rose-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        ยอดขายรวม
                      </p>
                      <p className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
                        {formatTHB(totalSales)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
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
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-50">
                      <Package className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-white/70 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        พนักงานทั้งหมด
                      </p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">
                        {formatNumber(salespersons.length)}
                      </p>
                      <p className="text-xs sm:text-sm text-rose-600 mt-1">
                        ที่มียอดขาย
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-purple-50">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="rounded-2xl border bg-white/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-rose-500" />
                  รายชื่อพนักงานขาย
                </CardTitle>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {filteredSalespersons.length} คน
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">ลำดับ</TableHead>
                        <TableHead>พนักงาน</TableHead>
                        <TableHead>แผนก</TableHead>
                        <TableHead className="text-right">ยอดขายรวม</TableHead>
                        <TableHead className="text-right">ออเดอร์</TableHead>
                        <TableHead className="text-right">ลูกค้า</TableHead>
                        <TableHead className="text-right">เฉลี่ย/ออเดอร์</TableHead>
                        <TableHead className="text-right">คะแนนสะสม</TableHead>
                        <TableHead className="text-center">ดูรายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalespersons.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <UserCheck className="h-10 w-10" />
                              <p>ไม่พบข้อมูลพนักงาน</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSalespersons.map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-center">
                              <Badge
                                variant={i < 3 ? "default" : "outline"}
                                className={
                                  i === 0
                                    ? "bg-yellow-500"
                                    : i < 3
                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                      : ""
                                }
                              >
                                {i + 1}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{s.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {s.employeeCode}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.department}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              {formatTHB(s.totalSales)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(s.orderCount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(s.customerCount)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatTHB(s.avgOrderValue)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-amber-600">
                              {formatNumber(s.totalPoints)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/reports/salesperson/${s.id}`}>
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

                {/* Footer hint */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-full border border-slate-200/70 bg-white/70 px-2">
                      Tip
                    </span>
                    <span>
                      เลื่อนตารางในแนวนอนเพื่อดูข้อมูลทั้งหมด
                    </span>
                  </div>
                  <div className="text-slate-400">
                    คลิก &quot;ดู&quot; เพื่อดูรายละเอียดพนักงาน
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
