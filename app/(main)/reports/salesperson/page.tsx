"use client";

import { useEffect, useState, useTransition } from "react";
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
  getAllSalespersonsForReport,
  type SalespersonListItem,
} from "@/app/actions/reports";

export default function SalespersonReportPage() {
  const [isPending, startTransition] = useTransition();
  const [salespersons, setSalespersons] = useState<SalespersonListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all salespersons on mount
  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const data = await getAllSalespersonsForReport();
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
        {/* Header */}
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานตามพนักงานขาย
            </h1>
            <p className="text-muted-foreground text-sm">
              รายชื่อพนักงานขายทั้งหมด และผลงาน
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาพนักงาน (ชื่อ, รหัส, แผนก)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {isLoading || isPending ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      พนักงานขายดีที่สุด
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {topSalesperson?.name || "-"}
                    </p>
                    <p className="text-sm font-medium text-rose-500">
                      {topSalesperson ? formatTHB(topSalesperson.totalSales) : "-"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50">
                    <Award className="h-5 w-5 text-rose-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ยอดขายรวม
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatTHB(totalSales)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ออเดอร์รวม
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatNumber(totalOrders)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      พนักงานทั้งหมด
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatNumber(salespersons.length)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="rounded-2xl border bg-white/70">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-rose-500" />
                  รายชื่อพนักงานขาย
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {filteredSalespersons.length} คน
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">ลำดับ</TableHead>
                        <TableHead>พนักงาน</TableHead>
                        <TableHead>แผนก</TableHead>
                        <TableHead className="text-right">ยอดขายรวม</TableHead>
                        <TableHead className="text-right">ออเดอร์</TableHead>
                        <TableHead className="text-right">ลูกค้า</TableHead>
                        <TableHead className="text-right">เฉลี่ย/ออเดอร์</TableHead>
                        <TableHead className="text-center">ดูรายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalespersons.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
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
                                className={i === 0 ? "bg-yellow-500" : ""}
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
