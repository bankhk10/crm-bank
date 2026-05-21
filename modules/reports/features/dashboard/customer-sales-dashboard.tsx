"use client";

import { useId, useState, useTransition, Fragment } from "react";
import { format, startOfToday, endOfToday, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO } from "date-fns";
import DatePicker from "@/components/custom/DatePicker";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

import {
  Users,
  Eye,
  Search,
  TrendingUp,
  ShoppingCart,
  Award,
  UserCheck,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "../../ui/kpi-card";
import {
  getCustomerSalesReportAction,
  getSalespersonSalesReportAction,
  type CustomerSalesReportData,
  type SalespersonReportData,
  type DateRangeFilter,
} from "@/modules/reports";

const quickDateRanges = [
  {
    label: "เดือนนี้",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "เดือนที่แล้ว",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "ไตรมาสนี้",
    getValue: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
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

export function CustomerSalesDashboard() {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [customerData, setCustomerData] = useState<CustomerSalesReportData | null>(null);
  const [salespersonData, setSalespersonData] = useState<SalespersonReportData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("customers");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = useId();

  // Keep track of expanded parent dealers
  const [expandedDealers, setExpandedDealers] = useState<Set<string>>(new Set());

  const toggleDealer = (id: string) => {
    setExpandedDealers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFetchReport = () => {
    startTransition(async () => {
      const filter: DateRangeFilter = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      };
      const [custData, salesData] = await Promise.all([
        getCustomerSalesReportAction(filter),
        getSalespersonSalesReportAction(filter)
      ]);
      setCustomerData(custData);
      setSalespersonData(salesData);
    });
  };

  const formatTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(n);

  const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

  const topCustomers = customerData?.topCustomers || [];
  const salespersonPerf = salespersonData?.salespersonPerformance || [];

  const filteredCustomers = topCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.province &&
        c.province.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Group sub-shops (subdealers) under their parent dealers
  const filteredCustomerIds = new Set(filteredCustomers.map((c) => c.id));
  const subDealersMap = new Map<string, typeof filteredCustomers>();
  const topLevelCustomers: typeof filteredCustomers = [];

  filteredCustomers.forEach((c) => {
    if (c.parentDealerId && filteredCustomerIds.has(c.parentDealerId)) {
      if (!subDealersMap.has(c.parentDealerId)) {
        subDealersMap.set(c.parentDealerId, []);
      }
      subDealersMap.get(c.parentDealerId)!.push(c);
    } else {
      topLevelCustomers.push(c);
    }
  });

  const renderCustomerRow = (c: typeof topCustomers[0], index: number, isSubDealer = false, parentIndex?: number) => {
    const hasSubDealers = subDealersMap.has(c.id);
    const isExpanded = expandedDealers.has(c.id);

    return (
      <Fragment key={c.id}>
        <TableRow
          className={cn(
            "transition-colors",
            isSubDealer ? "bg-slate-50/40 hover:bg-slate-100/60" : "hover:bg-slate-50/50"
          )}
        >
          <TableCell>
            <Badge
              variant="outline"
              className={cn(
                !isSubDealer && index < 3 ? "bg-red-50 text-red-700 border-red-200" : "",
                isSubDealer ? "bg-slate-100 text-slate-500 border-transparent text-[10px]" : ""
              )}
            >
              {isSubDealer ? `${parentIndex! + 1}.${index + 1}` : index + 1}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {!isSubDealer && hasSubDealers && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-slate-200 rounded-md"
                  onClick={() => toggleDealer(c.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              )}
              {/* visually indent sub-dealers */}
              <div className={cn(isSubDealer && "pl-6 flex items-center gap-1.5")}>
                {isSubDealer && <span className="text-slate-400 font-mono">└─</span>}
                <div>
                  <p className={cn("font-medium text-slate-900", isSubDealer && "text-slate-700 text-sm")}>{c.name}</p>
                  <p className="text-xs text-slate-500">{c.code}</p>
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={cn(isSubDealer ? "bg-zinc-50 border-zinc-200 text-zinc-600" : "bg-slate-50 text-slate-600")}>
              {customerTypeLabels[c.type] || c.type}
            </Badge>
          </TableCell>
          <TableCell className="text-slate-600">{c.province && c.province !== "-" ? `${c.province} (${c.region})` : c.region}</TableCell>
          <TableCell className="text-center font-bold text-green-700">
            {formatTHB(c.totalSales)}
          </TableCell>
          <TableCell className="text-center text-slate-700 font-medium">
            {c.orderCount}
          </TableCell>
          <TableCell className="text-center">
            <Link href={`/reports/customer-sales/${c.id}`}>
              <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-700 rounded-lg">
                <Eye className="h-4 w-4 mr-1.5" />
              </Button>
            </Link>
          </TableCell>
        </TableRow>
        {/* Render children sub-dealers if expanded */}
        {!isSubDealer && isExpanded && hasSubDealers &&
          subDealersMap.get(c.id)!.map((sub, subIndex) =>
            renderCustomerRow(sub, subIndex, true, index)
          )
        }
      </Fragment>
    );
  };

  const filteredSalespersons = salespersonPerf.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalCustomerSales = topCustomers.reduce((sum, c) => sum + c.totalSales, 0);
  const totalSalespersonSales = salespersonPerf.reduce(
    (sum, s) => sum + s.totalSales,
    0,
  );
  const totalOrders = topCustomers.reduce((sum, c) => sum + c.orderCount, 0);

  return (
    <div className="min-h-screen pb-12 rounded-3xl">
      <DetailHero
        backUrl="/reports"
        backLabel="หน้ารายงาน"
        title="รายงานลูกค้าและพนักงานขาย"
        icon={<Users className="h-8 w-8 text-white" />}
        badges={
          customerData && (
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-[#60A5FA]" />
              {format(dateRange.from, "dd/MM/yyyy")} – {format(dateRange.to, "dd/MM/yyyy")}
            </span>
          )
        }
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* ── Filter Card ── */}
        <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden -py-6">
          <SectionHeader
            title="ตัวกรองช่วงเวลาและค้นหา"
            icon={<Calendar className="h-6 w-6" />}
          />
          <CardContent>
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:hidden h-8 px-3 text-xs"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
                onClick={() => setFiltersOpen((p) => !p)}
              >
                {filtersOpen ? "ซ่อน" : "แสดง"}
              </Button>
            </div>

            <div
              id={filtersPanelId}
              className={`mb-4 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap lg:flex-nowrap sm:items-end gap-3 sm:gap-4 ${filtersOpen ? "block" : "hidden"
                } sm:flex`}
            >
              {/* Start Date */}
              <div className="w-full sm:w-44">
                <DatePicker
                  label="วันที่เริ่ม"
                  placeholder="วันที่เริ่ม"
                  value={dateRange.from}
                  onChange={(val) => {
                    if (val) {
                      const day = parseISO(val);
                      const newRange = { from: day, to: dateRange.to };
                      if (day > dateRange.to) {
                        newRange.to = day;
                      }
                      setDateRange(newRange);
                    }
                  }}
                  className="h-10"
                />
              </div>

              {/* End Date */}
              <div className="w-full sm:w-44">
                <DatePicker
                  label="วันที่สิ้นสุด"
                  placeholder="วันที่สิ้นสุด"
                  value={dateRange.to}
                  onChange={(val) => {
                    if (val) {
                      const day = parseISO(val);
                      const newRange = { from: dateRange.from, to: day };
                      if (day < dateRange.from) {
                        newRange.from = day;
                      }
                      setDateRange(newRange);
                    }
                  }}
                  className="h-10"
                />
              </div>

              {/* Quick ranges */}
              <div className="grid gap-1.5">
                <label className="font-medium text-base text-gray-900 mx-1">
                  ช่วงเวลา
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickDateRanges.map((r) => (
                    <Button
                      key={r.label}
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs px-3 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                      onClick={() => {
                        const { from, to } = r.getValue();
                        setDateRange({ from, to });
                      }}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-end gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleFetchReport}
                  disabled={isPending}
                  className="flex-1 sm:w-auto h-10 px-6 bg-black hover:bg-gray-800 text-white shadow-md shadow-red-600/20 font-semibold text-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      ตกลง
                    </>
                  )}
                </Button>
                {customerData && (
                  <ClearSearchButton
                    label="ล้าง"
                    onClick={() => {
                      setDateRange({
                        from: startOfMonth(new Date()),
                        to: endOfMonth(new Date()),
                      });
                      setCustomerData(null);
                      setSalespersonData(null);
                      setSearchQuery("");
                    }}
                    className="h-10 px-4 min-h-[40px] mb-0"
                    containerClassName="w-auto mt-0"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Report Content ── */}
        {isPending ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 sm:h-96 rounded-xl" />
          </div>
        ) : !customerData ? (
          <Card className="rounded-xl border bg-white/70 shadow-sm overflow-hidden border-gray-100">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                เลือกช่วงเวลาและกดดูรายงาน
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                กรุณาเลือกช่วงวันที่ที่ต้องการแล้วกดปุ่ม &quot;ตกลง&quot;
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* KPI Cards: mobile=1 col, sm=2 cols, lg=4 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label={activeTab === "customers" ? "ยอดซื้อสูงสุด" : "ยอดขายสูงสุด"}
                value={activeTab === "customers" ? topCustomers[0]?.name || "-" : salespersonPerf[0]?.name || "-"}
                icon={Award}
                gradient="bg-gradient-to-br from-red-600 to-red-700"
                ring="shadow-lg shadow-red-600/20"
                topColor="red"
              />

              <KpiCard
                label={`ยอดขายรวม`}
                value={activeTab === "customers" ? formatTHB(totalCustomerSales) : formatTHB(totalSalespersonSales)}
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-slate-900 to-slate-800"
                ring="shadow-lg shadow-slate-900/20"
                topColor="black"
              />

              <KpiCard
                label="ออเดอร์รวม"
                value={formatNumber(totalOrders)}
                icon={ShoppingCart}
                gradient="bg-gradient-to-br from-red-500 to-red-600"
                ring="shadow-lg shadow-red-500/20"
                topColor="red"
              />

              <KpiCard
                label={activeTab === "customers" ? "จำนวนลูกค้าทั้งหมด" : "จำนวนพนักงานขายทั้งหมด"}
                value={`${formatNumber(activeTab === "customers" ? topCustomers.length : salespersonPerf.length)} รายการ`}
                icon={Users}
                gradient="bg-gradient-to-br from-slate-800 to-slate-900"
                ring="shadow-lg shadow-slate-800/20"
                topColor="black"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 space-y-5">

              <TabsList className="h-auto p-1.5 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm flex flex-wrap gap-1">
                <TabsTrigger
                  value="customers"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  ข้อมูลการขายของลูกค้า
                </TabsTrigger>
                <TabsTrigger
                  value="salespersons"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-zinc-900 data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 transition-all gap-1.5 flex items-center"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  ข้อมูลการขายของพนักงาน
                </TabsTrigger>

                {/* Search query box inside filter panel to streamline UI */}
                <div className="space-y-1.5 w-full sm:w-auto flex-1 min-w-[400px] mx-4">
                  <div className="relative h-10">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={
                        activeTab === "customers"
                          ? "ค้นหาลูกค้า"
                          : "ค้นหาพนักงานขาย"
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>
              </TabsList>

              <TabsContent value="customers">
                {/* Table */}
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-red-600" />
                      ข้อมูลการขายของลูกค้า
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">
                      {filteredCustomers.length} ลูกค้า
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-[600px]">
                      <Table className="min-w-[900px]">
                        <TableHeader className="sticky top-0 bg-white/95 backdrop-blur z-10">
                          <TableRow className="border-b border-slate-200">
                            <TableHead className="font-semibold text-slate-700">ลำดับ</TableHead>
                            <TableHead className="font-semibold text-slate-700">ลูกค้า</TableHead>
                            <TableHead className="font-semibold text-slate-700">ประเภท</TableHead>
                            <TableHead className="font-semibold text-slate-700">ภูมิภาค</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">ยอดขายรวม</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">ออเดอร์รวม</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">รายละเอียด</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topLevelCustomers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-10">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <Users className="h-10 w-10 opacity-20" />
                                  <p>ไม่พบข้อมูลลูกค้า</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            topLevelCustomers.map((c, i) => renderCustomerRow(c, i))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  {/* Footer hint */}
                  <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 items-center rounded-full border border-slate-200/70 bg-white px-2 font-medium">
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
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-red-600" />
                      ข้อมูลการขายของพนักงาน
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">
                      {filteredSalespersons.length} คน
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-[600px]">
                      <Table className="min-w-[800px]">
                        <TableHeader className="sticky top-0 bg-white/95 backdrop-blur z-10">
                          <TableRow className="border-b border-slate-200">
                            <TableHead className="w-[80px] font-semibold text-slate-700">ลำดับ</TableHead>
                            <TableHead className="font-semibold text-slate-700">พนักงานขาย</TableHead>
                            <TableHead className="font-semibold text-slate-700">แผนก</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">ยอดขายรวม</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">จำนวนออเดอร์</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">รายละเอียด</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSalespersons.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-32 text-center py-10"
                              >
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <UserCheck className="h-10 w-10 opacity-20" />
                                  <p>ไม่พบข้อมูลพนักงานขาย</p>
                                </div>
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
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "text-slate-600"
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
                                  <Badge variant="outline" className="font-normal border-slate-200 bg-slate-50 text-slate-600">
                                    {s.department}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold text-green-700">
                                  {formatTHB(s.totalSales)}
                                </TableCell>
                                <TableCell className="text-center font-medium text-slate-700">
                                  {formatNumber(s.orderCount)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Link href={`/reports/salesperson/${s.id}`}>
                                    <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-700 rounded-lg">
                                      <Eye className="h-4 w-4 mr-1.5" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 text-center italic">
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
