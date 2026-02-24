"use client";

import { useId, useState, useTransition } from "react";
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
  Wallet,
} from "lucide-react";
import {
  getReportSummaryAction,
  getOrderHistoryAction,
  type ReportType,
} from "@/modules/reports";
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

interface SummaryData {
  totalSales: number;
  totalOrders: number;
  chartData: { month: string; sales: number; orders: number }[];
  topProducts: { name: string; code: string; brand: string; amount: number; quantity: number }[];
}

interface OrderItem {
  product: { name: string; productCode: string };
  quantity: number;
  totalPrice: number;
  unitPrice: number;
}

interface OrderHistory {
  id: string;
  saleNumber: string;
  saleDate: string | Date;
  totalAmount: number;
  items: OrderItem[];
}

interface SalesReportFiltersProps {
  reportType: ReportType;
  selectedYear: number;
  selectedEntityId: string;
  years: number[];
  customers: { id: string; name: string; customerCode: string }[];
  employees: { id: string; name: string }[];
  isPending: boolean;
  onTypeChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onEntityChange: (value: string) => void;
  onSubmit: () => void;
}

function SalesReportFilters({
  reportType,
  selectedYear,
  selectedEntityId,
  years,
  customers,
  employees,
  isPending,
  onTypeChange,
  onYearChange,
  onEntityChange,
  onSubmit,
}: SalesReportFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <Card className="w-full rounded-2xl border bg-white/70 shadow-sm backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="text-sm font-semibold text-slate-700">ตัวกรองรายงาน</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="sm:hidden h-9 px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
          </Button>
        </div>

        {/* Mobile-first filters: sm=2 cols, lg=4 cols */}
        <div
          id={panelId}
          className={`mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 ${isOpen ? "block" : "hidden"
            } sm:block`}
        >
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              ประเภทรายงาน
            </label>
            <Tabs value={reportType} onValueChange={onTypeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger
                  value="CUSTOMER"
                  className="text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  ลูกค้า
                </TabsTrigger>
                <TabsTrigger
                  value="EMPLOYEE"
                  className="text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  พนักงาน
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              เลือกปี
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => onYearChange(Number(value))}
            >
              <SelectTrigger className="w-full h-11 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <SelectValue placeholder="ปี" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              {reportType === "CUSTOMER" ? "เลือกร้านค้า/ลูกค้า" : "เลือกพนักงานขาย"}
            </label>
            <Select value={selectedEntityId} onValueChange={onEntityChange}>
              <SelectTrigger className="w-full h-11 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <SelectValue
                  placeholder={
                    reportType === "CUSTOMER" ? "ค้นหาร้านค้า..." : "ค้นหาพนักงาน..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {reportType === "CUSTOMER"
                  ? customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customerCode} - {customer.name}
                    </SelectItem>
                  ))
                  : employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button
              onClick={onSubmit}
              disabled={!selectedEntityId || isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              ดูรายงาน
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SalesSummaryCards({ summaryData }: { summaryData: SummaryData }) {
  const averageOrderValue = summaryData.totalOrders
    ? summaryData.totalSales / summaryData.totalOrders
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Mobile-first summary cards: sm=2 cols, lg=4 cols */}
      <Card className="rounded-2xl border bg-white/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                ยอดขายรวมทั้งปี
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {new Intl.NumberFormat("th-TH", {
                  style: "currency",
                  currency: "THB",
                }).format(summaryData.totalSales)}
              </h3>
            </div>
            <div className="bg-blue-50 p-2 sm:p-3 rounded-xl ml-2 flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-white/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                จำนวนรายการสั่งซื้อ
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {summaryData.totalOrders}{" "}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                  รายการ
                </span>
              </h3>
            </div>
            <div className="bg-slate-100 p-2 sm:p-3 rounded-xl ml-2 flex-shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-white/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                มูลค่าต่อบิลเฉลี่ย
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {new Intl.NumberFormat("th-TH", {
                  style: "currency",
                  currency: "THB",
                }).format(averageOrderValue)}
              </h3>
            </div>
            <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl ml-2 flex-shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-white/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium mb-1">
                สินค้าขายดีอันดับ 1
              </p>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {summaryData.topProducts[0]?.name || "-"}
              </h3>
              <p className="text-xs sm:text-sm text-green-600 font-medium">
                {summaryData.topProducts[0]
                  ? new Intl.NumberFormat("th-TH", {
                    style: "currency",
                    currency: "THB",
                  }).format(summaryData.topProducts[0].amount)
                  : ""}
              </p>
            </div>
            <div className="bg-orange-50 p-2 sm:p-3 rounded-xl ml-2 flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SalesReportTable({
  orders,
  isPending,
  formatTHB,
}: {
  orders: OrderHistory[];
  isPending: boolean;
  formatTHB: (amount: number) => string;
}) {
  const renderMobileCards = () => {
    if (isPending) {
      return (
        <div className="space-y-3 px-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-3 space-y-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          ไม่พบรายการสั่งซื้อ
        </div>
      );
    }

    return (
      <div className="space-y-3 px-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
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
              {order.items.map((item) => item.product.name).join(", ")}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                {order.items.length} รายการ
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                asChild
              >
                <a href={`/sales/${order.id}`} target="_blank" rel="noopener noreferrer">
                  ดูรายละเอียด
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDesktopTable = () => {
    if (isPending) {
      return (
        <div className="p-6 animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs md:text-sm">วันที่</TableHead>
            <TableHead className="text-xs md:text-sm">เลขที่เอกสาร</TableHead>
            <TableHead className="text-xs md:text-sm hidden md:table-cell">
              สินค้า (ตัวอย่าง)
            </TableHead>
            <TableHead className="text-xs md:text-sm text-right">ยอดรวม</TableHead>
            <TableHead className="text-xs md:text-sm text-center w-[110px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="group hover:bg-slate-50">
              <TableCell className="font-medium text-xs md:text-sm py-3">
                {format(new Date(order.saleDate), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="py-3">
                <span className="font-mono text-[10px] md:text-xs bg-slate-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                  {order.saleNumber}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell py-3">
                <div className="text-xs md:text-sm text-slate-600 max-w-[220px] lg:max-w-[300px] truncate">
                  {order.items.map((item) => item.product.name).join(", ")}
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
                  className="h-8 text-xs md:text-sm px-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  asChild
                >
                  <a href={`/sales/${order.id}`} target="_blank" rel="noopener noreferrer">
                    ดูรายละเอียด
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!isPending && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                ไม่พบรายการสั่งซื้อ
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="shadow-sm overflow-hidden rounded-2xl border bg-white/70">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base md:text-lg">ประวัติการสั่งซื้อ/ขาย</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          รายการบิลที่สำเร็จแล้วในปีนี้
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="block sm:hidden">{renderMobileCards()}</div>
        <div className="hidden sm:block overflow-x-auto">{renderDesktopTable()}</div>
      </CardContent>
    </Card>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border bg-white/70 px-3 py-2 shadow-sm">
      {/* Mobile pagination: condensed */}
      <div className="flex items-center gap-2 sm:hidden text-xs text-slate-600">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          disabled
        >
          ก่อนหน้า
        </Button>
        <span>
          หน้า {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          disabled
        >
          ถัดไป
        </Button>
      </div>

      {/* Desktop pagination: full numbers */}
      <div className="hidden sm:flex items-center justify-between w-full">
        <div className="text-sm text-slate-600">หน้า {currentPage} จาก {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            disabled
          >
            ก่อนหน้า
          </Button>
          <div className="flex items-center gap-1">
            {pages.map((page) => (
              <span
                key={page}
                className={`h-9 min-w-[36px] px-2 rounded-lg text-sm flex items-center justify-center border ${page === currentPage
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-slate-200 text-slate-600"
                  }`}
              >
                {page}
              </span>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            disabled
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SalesReportClient({ customers, employees, years }: SalesReportClientProps) {
  const [reportType, setReportType] = useState<ReportType>("CUSTOMER");
  const [selectedYear, setSelectedYear] = useState<number>(years[0]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
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
        getReportSummaryAction(selectedYear, reportType, selectedEntityId),
        getOrderHistoryAction(selectedYear, reportType, selectedEntityId),
      ]);
      setSummaryData(summary);
      setOrders(history as OrderHistory[]);
    });
  };

  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-sm sm:text-base animate-in fade-in duration-500">
      {/* Header + description: stack on mobile, align left on sm+ */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            รายงานยอดขาย
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            วิเคราะห์ยอดขายแยกตามลูกค้าและพนักงาน
          </p>
        </div>

        <SalesReportFilters
          reportType={reportType}
          selectedYear={selectedYear}
          selectedEntityId={selectedEntityId}
          years={years}
          customers={customers}
          employees={employees}
          isPending={isPending}
          onTypeChange={handleTypeChange}
          onYearChange={setSelectedYear}
          onEntityChange={setSelectedEntityId}
          onSubmit={handleFetchReport}
        />
      </div>

      {/* Empty state - keeps layout stable (sm/md/lg) */}
      {!summaryData && !isPending && (
        <div className="min-h-[240px] sm:min-h-[320px] md:min-h-[400px] flex flex-col items-center justify-center text-center p-4 sm:p-6 border-2 border-dashed rounded-2xl bg-slate-50/60">
          <div className="bg-white p-3 sm:p-4 rounded-full shadow-lg mb-3 sm:mb-4">
            {reportType === "CUSTOMER" ? (
              <Store className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500" />
            ) : (
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-500" />
            )}
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800">
            กรุณาเลือก{reportType === "CUSTOMER" ? "ร้านค้า" : "พนักงาน"} เพื่อดูข้อมูล
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs sm:max-w-sm mt-2">
            ระบบจะแสดงยอดขายรวม, กราฟแนวโน้มรายเดือน, และสินค้าที่มียอดซื้อสูงสุด
          </p>
        </div>
      )}

      {summaryData && (
        <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <SalesSummaryCards summaryData={summaryData} />

          {/* Charts + Top products: xl=3 cols */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
            <Card className="xl:col-span-2 shadow-sm rounded-2xl border bg-white/70">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  แนวโน้มยอดขายรายเดือน ปี {selectedYear + 543}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4 md:px-6">
                <div className="h-[220px] sm:h-[280px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData.chartData} margin={{ left: -10, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
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
                      <Legend wrapperStyle={{ fontSize: "12px" }} iconSize={10} />
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

            <Card className="shadow-sm rounded-2xl border bg-white/70">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base md:text-lg">5 อันดับสินค้าสูงสุด</CardTitle>
                <CardDescription className="text-xs sm:text-sm">เรียงตามยอดขายรวม</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {summaryData.topProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                            {product.code} • {product.brand}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                          {formatTHB(product.amount)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          {product.quantity} ชิ้น
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

          <SalesReportTable orders={orders} isPending={isPending} formatTHB={formatTHB} />

          <PaginationBar currentPage={1} totalPages={1} />
        </div>
      )}
    </div>
  );
}
