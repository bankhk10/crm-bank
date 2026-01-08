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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-in fade-in duration-500">
      {/* Header Section - Mobile First */}
      <div className="flex flex-col gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            รายงานการขาย
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            วิเคราะห์ยอดขายแยกตามลูกค้าและพนักงาน
          </p>
        </div>

        {/* Controls - Stacked on Mobile */}
        <Card className="w-full p-3 sm:p-4 border-none shadow-md bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            {/* Row 1: Report Type */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                ประเภทรายงาน
              </label>
              <Tabs
                value={reportType}
                onValueChange={handleTypeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                  <TabsTrigger value="CUSTOMER" className="text-xs sm:text-sm">
                    ลูกค้า
                  </TabsTrigger>
                  <TabsTrigger value="EMPLOYEE" className="text-xs sm:text-sm">
                    พนักงาน
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Row 2: Year and Entity Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  เลือกปี
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(Number(v))}
                >
                  <SelectTrigger className="w-full h-9 sm:h-10 text-sm">
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

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  {reportType === "CUSTOMER"
                    ? "เลือกร้านค้า/ลูกค้า"
                    : "เลือกพนักงานขาย"}
                </label>
                <Select
                  value={selectedEntityId}
                  onValueChange={setSelectedEntityId}
                >
                  <SelectTrigger className="w-full h-9 sm:h-10 text-sm">
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
            </div>

            {/* Row 3: Submit Button */}
            <Button
              onClick={handleFetchReport}
              disabled={!selectedEntityId || isPending}
              className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium"
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

      {/* Greeting / Empty State - Responsive */}
      {!summaryData && !isPending && (
        <div className="min-h-[250px] sm:min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 border-2 border-dashed rounded-xl bg-slate-50/50">
          <div className="bg-white p-3 sm:p-4 rounded-full shadow-lg mb-3 sm:mb-4">
            {reportType === "CUSTOMER" ? (
              <Store className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500" />
            ) : (
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-500" />
            )}
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800">
            กรุณาเลือก{reportType === "CUSTOMER" ? "ร้านค้า" : "พนักงาน"}
            เพื่อดูข้อมูล
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs sm:max-w-sm mt-2">
            ระบบจะแสดงยอดขายรวม, กราฟแนวโน้มรายเดือน,
            และสินค้าที่มียอดซื้อสูงสุด
          </p>
        </div>
      )}

      {/* Dashboard Content - Responsive */}
      {summaryData && (
        <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* 1. Summary Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Sales Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">
                      ยอดขายรวมทั้งปี
                    </p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                      {formatTHB(summaryData.totalSales)}
                    </h3>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Count Card */}
            <Card className="bg-white border text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                      จำนวนรายการสั่งซื้อ
                    </p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                      {summaryData.totalOrders}{" "}
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                        รายการ
                      </span>
                    </h3>
                  </div>
                  <div className="bg-slate-100 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Product Card */}
            <Card className="bg-white border text-card-foreground shadow-sm">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                      สินค้าขายดีอันดับ 1
                    </p>
                    <h3 className="text-sm sm:text-base md:text-xl font-bold text-slate-800 truncate">
                      {summaryData.topProducts[0]?.name || "-"}
                    </h3>
                    <p className="text-xs sm:text-sm text-green-600 font-medium">
                      {summaryData.topProducts[0]
                        ? formatTHB(summaryData.topProducts[0].amount)
                        : ""}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 flex-shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Charts & Top Products - Responsive */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Chart - Full width on mobile/tablet, 2/3 on desktop */}
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  แนวโน้มยอดขายรายเดือน ปี {selectedYear + 543}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4 md:px-6">
                <div className="h-[220px] sm:h-[280px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summaryData.chartData}
                      margin={{ left: -10, right: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        width={45}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatTHB(value)}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconSize={10}
                      />
                      <Bar
                        dataKey="sales"
                        name="ยอดขาย (บาท)"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products - Responsive */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  5 อันดับสินค้าสูงสุด
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  เรียงตามยอดขายรวม
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {summaryData.topProducts.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                            {p.code} • {p.brand}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                          {formatTHB(p.amount)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          {p.quantity} ชิ้น
                        </p>
                      </div>
                    </div>
                  ))}
                  {summaryData.topProducts.length === 0 && (
                    <div className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                      ไม่มีข้อมูลสินค้า
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Detailed History Table - Mobile Responsive */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg">
                ประวัติการสั่งซื้อ/ขาย
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                รายการบิลที่สำเร็จแล้วในปีนี้
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3 px-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded">
                          {order.saleNumber}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(order.saleDate), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {formatTHB(Number(order.totalAmount))}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {order.items.map((i: any) => i.product.name).join(", ")}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        {order.items.length} รายการ
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        asChild
                      >
                        <a
                          href={`/sales/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ดูรายละเอียด
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    ไม่พบรายการสั่งซื้อ
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">
                        วันที่
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">
                        เลขที่เอกสาร
                      </TableHead>
                      <TableHead className="text-xs md:text-sm hidden md:table-cell">
                        สินค้า (ตัวอย่าง)
                      </TableHead>
                      <TableHead className="text-xs md:text-sm text-right">
                        ยอดรวม
                      </TableHead>
                      <TableHead className="text-xs md:text-sm text-center w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="group hover:bg-slate-50"
                      >
                        <TableCell className="font-medium text-xs md:text-sm py-3">
                          {format(new Date(order.saleDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-[10px] md:text-xs bg-slate-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                            {order.saleNumber}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3">
                          <div className="text-xs md:text-sm text-slate-600 max-w-[200px] lg:max-w-[300px] truncate">
                            {order.items
                              .map((i: any) => i.product.name)
                              .join(", ")}
                          </div>
                          <div className="text-[10px] md:text-xs text-slate-400">
                            {order.items.length} รายการ
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-700 text-xs md:text-sm py-3">
                          {formatTHB(Number(order.totalAmount))}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 md:h-8 text-xs md:text-sm px-2"
                            asChild
                          >
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
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          ไม่พบรายการสั่งซื้อ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
