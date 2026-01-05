"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  Loader2,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Store,
} from "lucide-react";
import {
  getReportSummary,
  getOrderHistory,
  type ReportType,
} from "@/app/actions/sales-report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SalesReportClientProps {
  customers: { id: string; name: string; customerCode: string }[];
  employees: { id: string; name: string }[];
  years: number[];
}

export function SalesReportClient({
  customers,
  employees,
  years,
}: SalesReportClientProps) {
  const [reportType, setReportType] = useState<ReportType>("CUSTOMER");
  const [selectedYear, setSelectedYear] = useState<number>(years[0]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const [summaryData, setSummaryData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleTypeChange = (value: string) => {
    setReportType(value as ReportType);
    setSelectedEntityId("");
    setSummaryData(null);
    setOrders([]);
  };

  const handleFetchReport = () => {
    if (!selectedEntityId) return;

    startTransition(async () => {
      const [summary, history] = await Promise.all([
        getReportSummary(selectedYear, reportType, selectedEntityId),
        getOrderHistory(selectedYear, reportType, selectedEntityId),
      ]);
      setSummaryData(summary);
      setOrders(history);
    });
  };

  // Format currency
  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            รายงานการขาย
          </h1>
          <p className="text-muted-foreground mt-1">
            วิเคราะห์ยอดขายแยกตามลูกค้าและพนักงาน
          </p>
        </div>

        {/* Controls */}
        <Card className="w-full md:w-auto p-4 border-none shadow-md bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                ประเภทรายงาน
              </label>
              <Tabs
                value={reportType}
                onValueChange={handleTypeChange}
                className="w-[200px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="CUSTOMER">ลูกค้า</TabsTrigger>
                  <TabsTrigger value="EMPLOYEE">พนักงาน</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                เลือกปี
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="ปี" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y + 543}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                {reportType === "CUSTOMER"
                  ? "เลือกร้านค้า/ลูกค้า"
                  : "เลือกพนักงานขาย"}
              </label>
              <Select
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
              >
                <SelectTrigger className="w-full md:min-w-[250px]">
                  <SelectValue
                    placeholder={
                      reportType === "CUSTOMER"
                        ? "ค้นหาร้านค้า..."
                        : "ค้นหาพนักงาน..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {reportType === "CUSTOMER"
                    ? customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.customerCode} - {c.name}
                        </SelectItem>
                      ))
                    : employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleFetchReport}
              disabled={!selectedEntityId || isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              ดูรายงาน
            </Button>
          </div>
        </Card>
      </div>

      {/* Greeting / Empty State */}
      {!summaryData && !isPending && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-slate-50/50">
          <div className="bg-white p-4 rounded-full shadow-lg mb-4">
            {reportType === "CUSTOMER" ? (
              <Store className="w-12 h-12 text-blue-500" />
            ) : (
              <Users className="w-12 h-12 text-indigo-500" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-slate-800">
            กรุณาเลือก{reportType === "CUSTOMER" ? "ร้านค้า" : "พนักงาน"}
            เพื่อดูข้อมูล
          </h3>
          <p className="text-slate-500 max-w-sm mt-2">
            ระบบจะแสดงยอดขายรวม, กราฟแนวโน้มรายเดือน,
            และสินค้าที่มียอดซื้อสูงสุด
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      {summaryData && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* 1. Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 font-medium mb-1">
                      ยอดขายรวมทั้งปี
                    </p>
                    <h3 className="text-3xl font-bold">
                      {formatTHB(summaryData.totalSales)}
                    </h3>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border text-card-foreground shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">
                      จำนวนรายการสั่งซื้อ
                    </p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {summaryData.totalOrders}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        รายการ
                      </span>
                    </h3>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border text-card-foreground shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">
                      สินค้าขายดีอันดับ 1
                    </p>
                    <h3 className="text-xl font-bold text-slate-800 truncate max-w-[200px]">
                      {summaryData.topProducts[0]?.name || "-"}
                    </h3>
                    <p className="text-sm text-green-600 font-medium">
                      {summaryData.topProducts[0]
                        ? formatTHB(summaryData.topProducts[0].amount)
                        : ""}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Charts & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>
                  แนวโน้มยอดขายรายเดือน ปี {selectedYear + 543}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData.chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#64748B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number) => formatTHB(value)}
                      />
                      <Legend />
                      <Bar
                        dataKey="sales"
                        name="ยอดขาย (บาท)"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>5 อันดับสินค้าสูงสุด</CardTitle>
                <CardDescription>เรียงตามยอดขายรวม</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summaryData.topProducts.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.code} • {p.brand}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">
                          {formatTHB(p.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.quantity} ชิ้น
                        </p>
                      </div>
                    </div>
                  ))}
                  {summaryData.topProducts.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      ไม่มีข้อมูลสินค้า
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Detailed History Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ประวัติการสั่งซื้อ/ขาย (Order History)</CardTitle>
              <CardDescription>รายการบิลที่สำเร็จแล้วในปีนี้</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เลขที่เอกสาร</TableHead>
                    <TableHead>สินค้า (ตัวอย่าง)</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group hover:bg-slate-50"
                    >
                      <TableCell className="font-medium">
                        {format(new Date(order.saleDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {order.saleNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 max-w-[300px] truncate">
                          {order.items
                            .map((i: any) => i.product.name)
                            .join(", ")}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.items.length} รายการ
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-700">
                        {formatTHB(Number(order.totalAmount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/sales/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ดูรายละเอียด
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        ไม่พบรายการสั่งซื้อ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
