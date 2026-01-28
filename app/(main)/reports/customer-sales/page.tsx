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
import { Users, ArrowLeft, Eye, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getAllCustomersForReport,
  type CustomerListItem,
} from "@/app/actions/reports";

const customerTypeLabels: Record<string, string> = {
  DEALER: "ดีลเลอร์",
  SUBDEALER: "ซับดีลเลอร์",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

export default function CustomerSalesReportPage() {
  const [isPending, startTransition] = useTransition();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all customers on mount
  useEffect(() => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const data = await getAllCustomersForReport();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
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

  // Filter customers by search query
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.province && c.province.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              รายงานตามลูกค้า
            </h1>
            <p className="text-muted-foreground text-sm">
              รายชื่อลูกค้าทั้งหมด และมูลค่ารวม
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="rounded-2xl border bg-white/80 dark:bg-slate-800/80 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาลูกค้า (ชื่อ, รหัส, จังหวัด)..."
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
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : (
          <Card className="rounded-2xl border bg-white/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                รายชื่อลูกค้า
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                {filteredCustomers.length} ลูกค้า
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
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
          </Card>
        )}
      </div>
    </div>
  );
}
