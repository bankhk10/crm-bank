"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  User,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Building2,
  ExternalLink,
  ArrowUpRight,
  ArrowLeft,
  Briefcase,
  Store,
  Search,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// Types
interface EmployeeDetail {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  company?: { id: string; name?: string | null } | null;
  employeeCode?: string | null;
  birthDate?: string | null;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  responsibilityArea?: string | null;
  status?: string | null;
  positionTitle?: string | null;
  department?: { id: string; name?: string | null } | null;
  roleTitle?: string | null;
  responsibleCustomers?: {
    id: string;
    customerCode: string;
    name: string;
    province?: string | null;
    region?: string | null;
    status: string;
  }[];
}

interface SalesKPI {
  totalSales: number;
  orderCount: number;
  customerCount: number;
  avgOrderValue: number;
}

interface RecentSale {
  id: string;
  saleNumber: string;
  saleDate: string;
  status: string;
  totalAmount: number;
  customer: {
    id: string;
    name: string;
    customerCode: string;
  };
}

const saleStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอดำเนินการ", color: "bg-gray-100 text-gray-800" },
  PENDING_APPROVAL: {
    label: "รออนุมัติ",
    color: "bg-amber-100 text-amber-800",
  },
  APPROVED: { label: "อนุมัติแล้ว", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "ไม่อนุมัติ", color: "bg-red-100 text-red-800" },
  AWAITING_PAYMENT: { label: "รอชำระเงิน", color: "bg-blue-100 text-blue-800" },
  PAID: { label: "ชำระเงินแล้ว", color: "bg-emerald-100 text-emerald-800" },
  AWAITING_DELIVERY: {
    label: "รอจัดส่ง",
    color: "bg-purple-100 text-purple-800",
  },
  DELIVERED: { label: "ระหว่างขนส่ง", color: "bg-indigo-100 text-indigo-800" },
  DELIVERY_COMPLETED: {
    label: "ส่งเสร็จแล้ว",
    color: "bg-teal-100 text-teal-800",
  },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "หมดอายุ", color: "bg-orange-100 text-orange-800" },
  OVERDUE: { label: "เลยกำหนด", color: "bg-rose-100 text-rose-800" },
};

const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

interface SalespersonDetailViewProps {
  employeeId: string;
}

export default function SalespersonDetailView({ employeeId }: SalespersonDetailViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [kpi, setKpi] = useState<SalesKPI | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      // Fetch employee details
      const { getEmployeeAction } = await import("@/modules/employee/server/actions");
      const empRes = await getEmployeeAction(employeeId);
      if (empRes.success && "employee" in empRes) {
        setEmployee(empRes.employee as any);
      }

      // Fetch sales data for this employee
      const salesRes = await fetch(
        `/api/sales?employeeId=${employeeId}&limit=20`
      );
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        const sales = salesData.sales || salesData.data || [];

        // Calculate KPI
        const totalSales = sales.reduce(
          (sum: number, s: any) => sum + Number(s.totalAmount || 0),
          0
        );
        const orderCount = sales.length;
        const customers = new Set(sales.map((s: any) => s.customerId));

        setKpi({
          totalSales,
          orderCount,
          customerCount: customers.size,
          avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
        });

        setRecentSales(
          sales.slice(0, 10).map((s: any) => ({
            id: s.id,
            saleNumber: s.saleNumber,
            saleDate: s.saleDate,
            status: s.status,
            totalAmount: s.totalAmount,
            customer: s.customer || { id: "", name: "-", customerCode: "-" },
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = employee?.responsibleCustomers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.province?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลพนักงาน...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <UserCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">ไม่พบข้อมูลพนักงาน</h2>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reports/salesperson">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
          <UserCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            รายละเอียดพนักงานขาย
          </h1>
          <p className="text-muted-foreground text-sm">
            รายงานตามพนักงานขาย
          </p>
        </div>
      </div>

      {/* Employee Header */}
      <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-6 rounded-2xl shadow-lg">
        <div className="absolute inset-0 bg-black/10 rounded-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-white/80 text-sm">
                  รหัส: {employee.employeeCode}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {employee.positionTitle && (
              <Badge className="bg-white/20 text-white border-0">
                <Briefcase className="h-3 w-3 mr-1" />
                {employee.positionTitle}
              </Badge>
            )}
            {employee.department?.name && (
              <Badge className="bg-white/20 text-white border-0">
                <Layers className="h-3 w-3 mr-1" />
                {employee.department.name}
              </Badge>
            )}
            <Badge
              className={`border-0 ${employee.status === "ACTIVE" || !employee.status
                ? "bg-green-500/80 text-white"
                : "bg-gray-500/80 text-white"
                }`}
            >
              {employee.status === "ACTIVE" || !employee.status ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  ใช้งาน
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  {employee.status}
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatTHB(kpi?.totalSales || 0)}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ออเดอร์ทั้งหมด</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatNumber(kpi?.orderCount || 0)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ลูกค้าทั้งหมด</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(kpi?.customerCount || 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  เฉลี่ย/ออเดอร์
                </p>
                <p className="text-lg font-bold text-amber-600">
                  {formatTHB(kpi?.avgOrderValue || 0)}
                </p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Card className="border-0 shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="border-b px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <User className="h-4 w-4 mr-2" />
                ข้อมูลพนักงาน
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                ประวัติการขาย
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Store className="h-4 w-4 mr-2" />
                ลูกค้าในความดูแล
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {/* Info Tab */}
            <TabsContent value="info" className="m-0 p-4 space-y-4">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ข้อมูลติดต่อ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          โทรศัพท์
                        </p>
                        <p className="font-medium">{employee.phone || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Mail className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">อีเมล</p>
                        <p className="font-medium">{employee.email || "-"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    ข้อมูลการทำงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        สังกัดบริษัท
                      </p>
                      <p className="font-medium">
                        {employee.company?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">แผนก</p>
                      <p className="font-medium">
                        {employee.department?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ตำแหน่ง</p>
                      <p className="font-medium">
                        {employee.positionTitle ||
                          employee.roleTitle ||
                          employee.role ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        เขตความรับผิดชอบ
                      </p>
                      <p className="font-medium">
                        {employee.responsibilityArea || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              {(employee.addressLine ||
                employee.province ||
                employee.district) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        ที่อยู่
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">
                        {[
                          employee.addressLine,
                          employee.subdistrict &&
                          `ต.${employee.subdistrict}`,
                          employee.district && `อ.${employee.district}`,
                          employee.province && `จ.${employee.province}`,
                          employee.postalCode,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="m-0 p-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      ประวัติการขายล่าสุด
                    </CardTitle>
                    <Link href={`/sales?employeeId=${employeeId}`}>
                      <Button variant="ghost" size="sm">
                        ดูทั้งหมด
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>ยังไม่มีประวัติการขาย</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>เลขที่ใบสั่งซื้อ</TableHead>
                          <TableHead>ลูกค้า</TableHead>
                          <TableHead>วันที่</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead className="text-right">มูลค่า</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">
                              {sale.saleNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {sale.customer?.name || "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {sale.customer?.customerCode || "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(sale.saleDate), "d MMM yyyy", {
                                locale: th,
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${saleStatusLabels[sale.status]?.color || "bg-gray-100"} border-0`}
                              >
                                {saleStatusLabels[sale.status]?.label ||
                                  sale.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                              {formatTHB(Number(sale.totalAmount))}
                            </TableCell>
                            <TableCell>
                              <Link href={`/sales/${sale.id}`}>
                                <Button variant="ghost" size="icon">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="m-0 p-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      ลูกค้าในความดูแล
                      <Badge variant="secondary">
                        {employee.responsibleCustomers?.length || 0}
                      </Badge>
                    </CardTitle>
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="ค้นหาชื่อร้าน, รหัส หรือจังหวัด..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!employee.responsibleCustomers ||
                    employee.responsibleCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>ไม่มีลูกค้าในความดูแล</p>
                    </div>
                  ) : filteredCustomers && filteredCustomers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCustomers.map((customer) => (
                        <Link
                          key={customer.id}
                          href={`/customers/${customer.id}`}
                          className="group p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-rose-200 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-rose-100 transition-colors text-rose-600 shadow-sm">
                              <Store className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-medium text-gray-400">
                                ดูรายละเอียด
                              </span>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                              <div className="w-1 h-1 bg-rose-600 rounded-full" />
                              {customer.customerCode}
                            </div>
                            <h3 className="font-bold text-gray-900 group-hover:text-rose-700 transition-colors line-clamp-1 text-lg">
                              {customer.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {customer.province && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {customer.province}
                                </span>
                              )}
                              {customer.region && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                                  {customer.region}
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${customer.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-slate-50 text-slate-700 border-slate-100"
                                  }`}
                              >
                                {customer.status === "ACTIVE"
                                  ? "ปกติ"
                                  : customer.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>ไม่พบข้อมูลที่ตรงกับการค้นหา &quot;{searchTerm}&quot;</p>
                      <Button
                        variant="link"
                        className="mt-2 text-rose-600"
                        onClick={() => setSearchTerm("")}
                      >
                        ล้างการค้นหา
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
