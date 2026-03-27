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
import { Separator } from "@/components/ui/separator";
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Package,
  Clock,
  ExternalLink,
  ArrowUpRight,
  Building2,
  ArrowLeft,
  Users,
  MessageSquare,
  Hash,
  FileText,
  Droplets,
  Award,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailItem } from "@/components/custom/detail-item";
import { KpiCard } from "../../ui/kpi-card";

// Types
interface CustomerKPI {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  lifetimeValue: number;
  lifetimeOrderCount: number;
  daysSinceLastPurchase: number | null;
  purchaseFrequency: number;
  lastPurchaseDate: string | null;
}

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    productCode: string;
  };
}

interface RecentSale {
  id: string;
  saleNumber: string;
  saleDate: string;
  status: string;
  totalAmount: number;
  paymentTerm: string;
  deliveryDate: string | null;
  items: SaleItem[];
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TopProduct {
  product: {
    id: string;
    name: string;
    productCode: string;
  };
  totalQuantity: number;
  totalAmount: number;
  totalVolumeLiters: number;
  orderCount: number;
}

interface CreditLimit {
  id: string;
  limitAmount: number;
  promoAmount: number | null;
  usedAmount: number;
  availableAmount: number;
  status: string;
  effectiveDate: string;
  expiryDate: string | null;
}

interface CustomerImage {
  id: string;
  url: string;
  filename: string;
  order: number;
}

interface CustomerDetail {
  id: string;
  customerCode: string;
  customerType: string;
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  region?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  billingAddressLine?: string;
  billingProvince?: string;
  billingDistrict?: string;
  billingSubdistrict?: string;
  billingPostalCode?: string;
  shippingAddressLine?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingSubdistrict?: string;
  shippingPostalCode?: string;
  status: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  latitude?: string;
  longitude?: string;
  relationshipScore?: number;
  createdAt: string;
  updatedAt: string;
  creditLimits: CreditLimit[];
  images: CustomerImage[];
  responsibleEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  parentDealer?: {
    id: string;
    name: string;
    customerCode: string;
  };
}

const customerTypeLabels: Record<string, string> = {
  DEALER: "ดีลเลอร์",
  SUBDEALER: "ซับดีลเลอร์",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

const customerStatusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: {
    label: "ใช้งาน",
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  INACTIVE: {
    label: "ไม่ใช้งาน",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
  SUSPENDED: {
    label: "ระงับ",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
};

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

const formatVolume = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

interface CustomerSalesDetailViewProps {
  customerId: string;
}

export default function CustomerSalesDetailView({ customerId }: CustomerSalesDetailViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("store-info");
  const [customerData, setCustomerData] = useState<{
    customer: CustomerDetail;
    kpi: CustomerKPI;
    recentSales: RecentSale[];
    topProducts: TopProduct[];
  } | null>(null);

  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/details`);
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const customer = customerData?.customer;
  const kpi = customerData?.kpi;
  const recentSales = customerData?.recentSales || [];
  const topProducts = customerData?.topProducts || [];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลลูกค้า...</p>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">ไม่พบข้อมูลลูกค้า</h2>
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
    <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Hero Header Section */}
        <DetailHero
          backUrl="/reports/customer-sales"
          backLabel="หน้ารายงานตามลูกค้า"
          title={customer?.name || "รายละเอียดลูกค้า"}
          icon={<Users className="h-8 w-8 text-white" />}
          accentColor="#f59e0b" // Support amber theme for reports, or move to company red if strictly requested
          backgroundColor="#111111"
          badges={
            <>
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-white bg-white/10 border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
                รหัสลูกค้า: {customer?.customerCode}
              </span>
              <Badge
                className={cn(
                  customerStatusLabels[customer?.status || "ACTIVE"]?.color,
                  "border-0 px-3 py-1.5 rounded-full"
                )}
              >
                {customerStatusLabels[customer?.status || "ACTIVE"]?.label}
              </Badge>
              <Badge className="bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full">
                {customerTypeLabels[customer?.customerType || "DEALER"]}
              </Badge>
            </>
          }
          actions={
            customer?.responsibleEmployee && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-sm">
                <User className="h-4 w-4 mr-2" />
                <span>
                  ผู้รับผิดชอบ: {customer.responsibleEmployee.firstName}{" "}
                  {customer.responsibleEmployee.lastName}
                </span>
              </div>
            )
          }
        />

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="ยอดขายรวม"
            value={formatTHB(kpi?.totalSales || 0)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
            ring="shadow-lg shadow-emerald-600/20"
          />

          <KpiCard
            label="ค่าเฉลี่ย/ออเดอร์"
            value={formatTHB(kpi?.averageOrderValue || 0)}
            icon={Award}
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            ring="shadow-lg shadow-blue-600/20"
          />

          <KpiCard
            label="ออเดอร์ทั้งหมด"
            value={formatNumber(kpi?.lifetimeOrderCount || 0)}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-purple-600 to-purple-700"
            ring="shadow-lg shadow-purple-600/20"
          />
        </div>

        {/* Tabs Content */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <Tabs
            defaultValue="store-info"
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger
                  value="store-info"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Store className="h-4 w-4 mr-2" />
                  ข้อมูลร้าน
                </TabsTrigger>
                <TabsTrigger
                  value="products-sold"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  สินค้าที่เคยขาย
                </TabsTrigger>
                <TabsTrigger
                  value="purchase-history"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  ประวัติการซื้อ
                </TabsTrigger>
                <TabsTrigger
                  value="finance"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  การเงิน
                </TabsTrigger>
                <TabsTrigger
                  value="contact-notes"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  การติดต่อ & หมายเหตุ
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {/* Store Info Tab */}
              <TabsContent value="store-info" className="m-0 p-4 space-y-4">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="ข้อมูลพื้นฐาน"
                    icon={<Building2 className="h-6 w-6" />}
                    accentColor="#f59e0b"
                  />
                  <div className="p-6 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      <DetailItem
                        icon={<Hash className="h-5 w-5" />}
                        label="รหัสลูกค้า"
                        value={customer?.customerCode}
                      />
                      <DetailItem
                        icon={<Store className="h-5 w-5" />}
                        label="ประเภท"
                        value={customerTypeLabels[customer?.customerType || "DEALER"]}
                      />
                      <DetailItem
                        icon={<MapPin className="h-5 w-5" />}
                        label="ภูมิภาค"
                        value={customer?.region}
                      />
                      <DetailItem
                        icon={<FileText className="h-5 w-5" />}
                        label="เลขประจำตัวผู้เสียภาษี"
                        value={customer?.taxId}
                      />
                    </div>
                    {customer?.parentDealer && (
                      <div className="pt-2">
                        <DetailItem
                          icon={<Users className="h-5 w-5" />}
                          label="ดีลเลอร์ต้นสังกัด"
                          value={`${customer.parentDealer.name} (${customer.parentDealer.customerCode})`}
                          fullWidth
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="ที่อยู่"
                    icon={<MapPin className="h-6 w-6" />}
                    accentColor="#f59e0b"
                  />
                  <div className="p-6 space-y-2">
                    <DetailItem
                      icon={<MapPin className="h-5 w-5" />}
                      label="ที่อยู่บริษัท"
                      value={[
                        customer?.addressLine,
                        customer?.subdistrict,
                        customer?.district,
                        customer?.province,
                        customer?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      fullWidth
                    />
                    {customer?.billingAddressLine && (
                      <DetailItem
                        icon={<MapPin className="h-5 w-5 text-blue-400" />}
                        label="ที่อยู่วางบิล"
                        value={[
                          customer.billingAddressLine,
                          customer.billingSubdistrict,
                          customer.billingDistrict,
                          customer.billingProvince,
                          customer.billingPostalCode,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        fullWidth
                      />
                    )}
                    {customer?.shippingAddressLine && (
                      <DetailItem
                        icon={<MapPin className="h-5 w-5 text-emerald-400" />}
                        label="ที่อยู่จัดส่ง"
                        value={[
                          customer.shippingAddressLine,
                          customer.shippingSubdistrict,
                          customer.shippingDistrict,
                          customer.shippingProvince,
                          customer.shippingPostalCode,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        fullWidth
                      />
                    )}
                  </div>
                </div>

                {/* Top Products */}
                {topProducts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <SectionHeader
                      title="สินค้าที่ซื้อบ่อย"
                      icon={<Package className="h-6 w-6" />}
                      accentColor="#f59e0b"
                    />
                    <div className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-bold text-slate-700">สินค้า</TableHead>
                            <TableHead className="text-center font-bold text-slate-700">จำนวน</TableHead>
                            <TableHead className="text-center font-bold text-slate-700">มูลค่ารวม</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topProducts.slice(0, 5).map((item) => (
                            <TableRow key={item.product.id}>
                              <TableCell>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {item.product.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {item.product.productCode}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {formatNumber(item.totalQuantity)}
                              </TableCell>
                              <TableCell className="text-center font-extrabold text-amber-600">
                                {formatTHB(item.totalAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Products Sold Tab */}
              <TabsContent value="products-sold" className="m-0 p-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="สินค้าที่เคยขายให้ร้านนี้"
                    icon={<Package className="h-6 w-6" />}
                    accentColor="#f59e0b"
                  />
                  <div className="p-0">
                    {topProducts.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50/30">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>ยังไม่มีข้อมูลสินค้าที่เคยขายให้ลูกค้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="font-bold text-slate-700">สินค้า</TableHead>
                              <TableHead className="text-right font-bold text-slate-700">จำนวน</TableHead>
                              <TableHead className="text-right font-bold text-slate-700">
                                <div className="flex items-center justify-end gap-1">
                                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                                  ปริมาณ (L)
                                </div>
                              </TableHead>
                              <TableHead className="text-right font-bold text-slate-700">ยอดขาย</TableHead>
                              <TableHead className="text-right font-bold text-slate-700">จำนวนออเดอร์</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topProducts.map((item) => (
                              <TableRow key={item.product.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {item.product.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {item.product.productCode}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-700">
                                  {formatNumber(item.totalQuantity)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                                    {formatVolume(item.totalVolumeLiters)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-extrabold text-emerald-600">
                                  {formatTHB(item.totalAmount)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary" className="font-semibold">
                                    {formatNumber(item.orderCount)} ออเดอร์
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {/* Summary Row */}
                        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">สินค้าทั้งหมด:</span>
                              <span className="font-bold text-slate-900">{topProducts.length} รายการ</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">ยอดขายรวม:</span>
                              <span className="font-extrabold text-emerald-600">
                                {formatTHB(topProducts.reduce((acc, item) => acc + item.totalAmount, 0))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Droplets className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-slate-500">ปริมาณรวม:</span>
                              <span className="font-bold text-blue-600">
                                {formatVolume(topProducts.reduce((acc, item) => acc + item.totalVolumeLiters, 0))} L
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">ออเดอร์รวม:</span>
                              <span className="font-bold text-slate-900">
                                {formatNumber(topProducts.reduce((acc, item) => acc + item.orderCount, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Purchase History Tab */}
              <TabsContent value="purchase-history" className="m-0 p-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="ประวัติการซื้อล่าสุด"
                    icon={<ShoppingCart className="h-6 w-6" />}
                    accentColor="#f59e0b"
                  />
                  <div className="p-0">
                    {recentSales.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50/30">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>ยังไม่มีประวัติการซื้อสำหรับลูกค้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="font-bold text-slate-700">เลขที่ใบสั่งซื้อ</TableHead>
                              <TableHead className="font-bold text-slate-700">วันที่</TableHead>
                              <TableHead className="font-bold text-slate-700">สถานะ</TableHead>
                              <TableHead className="text-right font-bold text-slate-700">มูลค่า</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentSales.map((sale) => (
                              <TableRow key={sale.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-bold text-slate-900">
                                  {sale.saleNumber}
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">
                                  {format(
                                    new Date(sale.saleDate),
                                    "d MMM yyyy",
                                    { locale: th }
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      saleStatusLabels[sale.status]?.color || "bg-gray-100",
                                      "border-0 px-3"
                                    )}
                                  >
                                    {saleStatusLabels[sale.status]?.label ||
                                      sale.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-extrabold text-emerald-600">
                                  {formatTHB(Number(sale.totalAmount))}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/sales/${sale.id}`}>
                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-lg">
                                      <ExternalLink className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Finance Tab */}
              <TabsContent value="finance" className="m-0 p-4 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="ข้อมูลการเงินที่เกี่ยวข้อง"
                    icon={<CreditCard className="h-6 w-6" />}
                    accentColor="#f59e0b"
                  />
                  <div className="p-6">
                    {customer?.creditLimits && customer.creditLimits.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {customer.creditLimits.map((limit) => (
                          <div key={limit.id} className="border border-slate-100 rounded-xl p-6 bg-slate-50/30">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="secondary" className="px-3 py-1 font-bold text-slate-600">
                                {limit.status === "ACTIVE" ? "วงเงินปัจจุบัน" : "สถานะอื่นๆ"}
                              </Badge>
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block mb-1">วันที่เริ่มใช้งาน</span>
                                <span className="text-sm font-bold text-slate-600">
                                  {format(new Date(limit.effectiveDate), "d MMM yyyy", { locale: th })}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <DetailItem
                                label="วงเงินหลัก"
                                value={formatTHB(limit.limitAmount)}
                              />
                              <DetailItem
                                label="ใช้ไปแล้ว"
                                value={formatTHB(limit.usedAmount)}
                              />
                              <DetailItem
                                label="วงเงินคงเหลือ"
                                value={<span className="text-emerald-600 font-extrabold">{formatTHB(limit.availableAmount)}</span>}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p>ไม่มีข้อมูลจำกัดวงเงิน</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Contact & Notes Tab */}
              <TabsContent value="contact-notes" className="m-0 p-4 space-y-4">
                {/* Primary Contact */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <SectionHeader
                    title="ข้อมูลการติดต่อ"
                    icon={<Phone className="h-6 w-6" />}
                    variant="dark"
                  />
                  <div className="p-6 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      <DetailItem
                        icon={<Phone className="h-5 w-5" />}
                        label="เบอร์โทรศัพท์"
                        value={customer?.phone}
                      />
                      <DetailItem
                        icon={<Mail className="h-5 w-5" />}
                        label="อีเมล"
                        value={customer?.email}
                      />
                      {customer?.contactPerson && (
                        <>
                          <DetailItem
                            icon={<User className="h-5 w-5" />}
                            label="ผู้ติดต่อประสานงาน"
                            value={customer.contactPerson}
                          />
                          <DetailItem
                            icon={<Phone className="h-5 w-5 text-slate-400" />}
                            label="เบอร์โทรศัพท์ผู้ติดต่อ"
                            value={customer.contactPhone}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {customer?.notes && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <SectionHeader
                      title="หมายเหตุ"
                      icon={<FileText className="h-6 w-6" />}
                      accentColor="#f59e0b"
                    />
                    <div className="p-6">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {customer.notes}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
