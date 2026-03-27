"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  FileText,
  MessageSquare,
  Paperclip,
  ExternalLink,
  ArrowUpRight,
  Building2,
  Gift,
  Award,
} from "lucide-react";
import Link from "next/link";

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

interface PromotionalBudgetDetail {
  id: string;
  transactionDate: string;
  type: string;
  amount: number;
  description: string;
  sale?: {
    saleNumber: string;
  };
}

interface PromotionalBudget {
  id: string;
  year: number;
  salesPromotionLimit: number;
  salesPromotionUsed: number;
  marketingLimit: number;
  marketingUsed: number;
  status: string;
  details: PromotionalBudgetDetail[];
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
  promotionalBudgets: PromotionalBudget[];
}

interface CustomerDetailPanelProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
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

export function CustomerDetailPanel({
  customerId,
  isOpen,
  onClose,
  startDate,
  endDate,
}: CustomerDetailPanelProps) {
  const [loading, setLoading] = useState(false);
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
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(
        `/api/customers/${customerId}/details?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId, startDate, endDate]);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
      setActiveTab("store-info");
    }
  }, [isOpen, customerId, fetchCustomerDetails]);

  const customer = customerData?.customer;
  const kpi = customerData?.kpi;
  const recentSales = customerData?.recentSales || [];
  const topProducts = customerData?.topProducts || [];
  const creditLimit = customer?.creditLimits?.[0];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-4xl p-0 overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            <span className="sr-only">รายละเอียดลูกค้า</span>
          </SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="p-6 space-y-6">
            <Skeleton className="h-24 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : customerData ? (
          <div className="h-full flex flex-col">
            {/* Store Header */}
            <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Store className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-2xl font-bold">{customer?.name}</h2>
                      <p className="text-white/80 text-sm">
                        รหัส: {customer?.customerCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Badge
                    className={`${customerStatusLabels[customer?.status || "ACTIVE"]?.color} border-0`}
                  >
                    {customerStatusLabels[customer?.status || "ACTIVE"]?.label}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0">
                    {customerTypeLabels[customer?.customerType || "DEALER"]}
                  </Badge>
                  {customer?.responsibleEmployee && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                      <User className="h-4 w-4" />
                      <span>
                        Sales: {customer.responsibleEmployee.firstName}{" "}
                        {customer.responsibleEmployee.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          ยอดขายรวม
                        </p>
                        <p className="text-lg font-bold text-emerald-600">
                          {formatTHB(kpi?.totalSales || 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi?.orderCount || 0} ออเดอร์
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          ค่าเฉลี่ย/ออเดอร์
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatTHB(kpi?.averageOrderValue || 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ซื้อเฉลี่ย {kpi?.purchaseFrequency?.toFixed(1) || 0}{" "}
                      ครั้ง/เดือน
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          มูลค่ารวมทั้งหมด
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatTHB(kpi?.lifetimeValue || 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi?.lifetimeOrderCount || 0} ออเดอร์ทั้งหมด
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          ซื้อล่าสุด
                        </p>
                        <p className="text-lg font-bold text-amber-600">
                          {kpi?.daysSinceLastPurchase != null
                            ? `${kpi.daysSinceLastPurchase} วันที่แล้ว`
                            : "-"}
                        </p>
                      </div>
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi?.lastPurchaseDate
                        ? format(new Date(kpi.lastPurchaseDate), "d MMM yyyy", {
                          locale: th,
                        })
                        : "ไม่มีประวัติ"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs
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
                      value="promotions"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      งบส่งเสริม
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

                <div className="flex-1 overflow-y-auto">
                  {/* Store Info Tab */}
                  <TabsContent value="store-info" className="m-0 p-4 space-y-4">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          ข้อมูลพื้นฐาน
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              รหัสลูกค้า
                            </p>
                            <p className="font-medium">
                              {customer?.customerCode}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              ประเภท
                            </p>
                            <p className="font-medium">
                              {
                                customerTypeLabels[
                                customer?.customerType || "DEALER"
                                ]
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              ภูมิภาค
                            </p>
                            <p className="font-medium">
                              {customer?.region || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              เลขประจำตัวผู้เสียภาษี
                            </p>
                            <p className="font-medium">
                              {customer?.taxId || "-"}
                            </p>
                          </div>
                        </div>

                        {customer?.parentDealer && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                ดีลเลอร์ต้นสังกัด
                              </p>
                              <p className="font-medium">
                                {customer.parentDealer.name} (
                                {customer.parentDealer.customerCode})
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Address */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          ที่อยู่
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            ที่อยู่หลัก
                          </p>
                          <p className="font-medium">
                            {[
                              customer?.addressLine,
                              customer?.subdistrict,
                              customer?.district,
                              customer?.province,
                              customer?.postalCode,
                            ]
                              .filter(Boolean)
                              .join(" ") || "-"}
                          </p>
                        </div>
                        {customer?.billingAddressLine && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              ที่อยู่วางบิล
                            </p>
                            <p className="font-medium">
                              {[
                                customer.billingAddressLine,
                                customer.billingSubdistrict,
                                customer.billingDistrict,
                                customer.billingProvince,
                                customer.billingPostalCode,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          </div>
                        )}
                        {customer?.shippingAddressLine && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              ที่อยู่จัดส่ง
                            </p>
                            <p className="font-medium">
                              {[
                                customer.shippingAddressLine,
                                customer.shippingSubdistrict,
                                customer.shippingDistrict,
                                customer.shippingProvince,
                                customer.shippingPostalCode,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Top Products */}
                    {topProducts.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            สินค้าที่ซื้อบ่อย
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>สินค้า</TableHead>
                                <TableHead className="text-right">
                                  จำนวน
                                </TableHead>
                                <TableHead className="text-right">
                                  มูลค่า
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topProducts.slice(0, 5).map((item) => (
                                <TableRow key={item.product.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {item.product.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.product.productCode}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatNumber(item.totalQuantity)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-emerald-600">
                                    {formatTHB(item.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Purchase History Tab */}
                  <TabsContent value="purchase-history" className="m-0 p-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            ประวัติการซื้อล่าสุด
                          </CardTitle>
                          <Link href={`/sales?customerId=${customerId}`}>
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
                            <p>ยังไม่มีประวัติการซื้อ</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>เลขที่ใบสั่งซื้อ</TableHead>
                                <TableHead>วันที่</TableHead>
                                <TableHead>สถานะ</TableHead>
                                <TableHead className="text-right">
                                  มูลค่า
                                </TableHead>
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
                                    {format(
                                      new Date(sale.saleDate),
                                      "d MMM yyyy",
                                      {
                                        locale: th,
                                      },
                                    )}
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

                  {/* Contact & Notes Tab */}
                  <TabsContent
                    value="contact-notes"
                    className="m-0 p-4 space-y-4"
                  >
                    {/* Primary Contact */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4" />
                          ข้อมูลติดต่อหลัก
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                โทรศัพท์
                              </p>
                              <p className="font-medium">
                                {customer?.phone || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                              <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                อีเมล
                              </p>
                              <p className="font-medium">
                                {customer?.email || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Person */}
                    {customer?.contactPerson && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            ผู้ติดต่อ
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                ชื่อผู้ติดต่อ
                              </p>
                              <p className="font-medium">
                                {customer.contactPerson}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                โทรศัพท์
                              </p>
                              <p className="font-medium">
                                {customer.contactPhone || "-"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">
                                อีเมล
                              </p>
                              <p className="font-medium">
                                {customer.contactEmail || "-"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Responsible Employee */}
                    {customer?.responsibleEmployee && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            พนักงานขายดูแล
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                ชื่อ
                              </p>
                              <p className="font-medium">
                                {customer.responsibleEmployee.firstName}{" "}
                                {customer.responsibleEmployee.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                โทรศัพท์
                              </p>
                              <p className="font-medium">
                                {customer.responsibleEmployee.phone || "-"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">
                                อีเมล
                              </p>
                              <p className="font-medium">
                                {customer.responsibleEmployee.email || "-"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Notes */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          หมายเหตุ
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {customer?.notes || "ไม่มีหมายเหตุ"}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Finance Tab */}
                  <TabsContent value="finance" className="m-0 p-4 space-y-4">
                    {/* Credit Limit */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          วงเงินเครดิต
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {creditLimit ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  วงเงินทั้งหมด
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                  {formatTHB(Number(creditLimit.limitAmount))}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  วงเงินคงเหลือ
                                </p>
                                <p className="text-xl font-bold text-emerald-600">
                                  {formatTHB(
                                    Number(creditLimit.availableAmount),
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  ใช้ไปแล้ว
                                </p>
                                <p className="text-lg font-semibold text-amber-600">
                                  {formatTHB(Number(creditLimit.usedAmount))}
                                </p>
                              </div>
                              {creditLimit.promoAmount && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    วงเงินโปรโมชั่น
                                  </p>
                                  <p className="text-lg font-semibold text-purple-600">
                                    {formatTHB(Number(creditLimit.promoAmount))}
                                  </p>
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  สถานะ
                                </p>
                                <Badge
                                  className={
                                    creditLimit.status === "ACTIVE"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {creditLimit.status === "ACTIVE"
                                    ? "ใช้งาน"
                                    : creditLimit.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  วันหมดอายุ
                                </p>
                                <p className="font-medium">
                                  {creditLimit.expiryDate
                                    ? format(
                                      new Date(creditLimit.expiryDate),
                                      "d MMM yyyy",
                                      {
                                        locale: th,
                                      },
                                    )
                                    : "ไม่มีกำหนด"}
                                </p>
                              </div>
                            </div>

                            {/* Usage Progress */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  การใช้งาน
                                </span>
                                <span className="font-medium">
                                  {(
                                    (Number(creditLimit.usedAmount) /
                                      Number(creditLimit.limitAmount)) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(
                                      (Number(creditLimit.usedAmount) /
                                        Number(creditLimit.limitAmount)) *
                                      100,
                                      100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>ไม่มีข้อมูลวงเงินเครดิต</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Promotions Tab */}
                  <TabsContent value="promotions" className="m-0 p-4 space-y-4">
                    {customer?.promotionalBudgets &&
                      customer.promotionalBudgets.length > 0 ? (
                      customer.promotionalBudgets.map((budget) => (
                        <div key={budget.id} className="space-y-4">
                          <Card className="border border-red-100 bg-red-50/10 shadow-sm transition-all duration-200">
                            <CardHeader className="pb-3 border-b border-red-50">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Award className="h-4 w-4 text-red-500" />
                                  งบส่งเสริมการขายปี {budget.year}
                                </CardTitle>
                                <Badge
                                  className={
                                    budget.status === "ACTIVE"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : "bg-slate-100 text-slate-800 border-slate-200"
                                  }
                                >
                                  {budget.status === "ACTIVE"
                                    ? "ใช้งานอยู่"
                                    : budget.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Sales Promotion Budget */}
                                <div className="space-y-3 p-4 rounded-xl bg-white border border-red-50 shadow-sm">
                                  <div>
                                    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider mb-1">
                                      งบส่งเสริมการขาย (Sales Promotion)
                                    </p>
                                    <div className="flex items-end justify-between">
                                      <p className="text-2xl font-black text-slate-900 leading-none">
                                        {formatTHB(Number(budget.salesPromotionLimit))}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        วงเงินรวม
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold">
                                      <span className="text-slate-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        ใช้ไปแล้ว: {formatTHB(Number(budget.salesPromotionUsed))}
                                      </span>
                                      <span className="text-red-600 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        คงเหลือ: {formatTHB(Number(budget.salesPromotionLimit) - Number(budget.salesPromotionUsed))}
                                      </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                      <div
                                        className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.min((Number(budget.salesPromotionUsed) / Number(budget.salesPromotionLimit)) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Marketing Budget */}
                                <div className="space-y-3 p-4 rounded-xl bg-white border border-blue-50 shadow-sm">
                                  <div>
                                    <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                                      งบส่งเสริมการตลาด (Marketing)
                                    </p>
                                    <div className="flex items-end justify-between">
                                      <p className="text-2xl font-black text-slate-900 leading-none">
                                        {formatTHB(Number(budget.marketingLimit))}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        วงเงินรวม
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold">
                                      <span className="text-slate-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        ใช้ไปแล้ว: {formatTHB(Number(budget.marketingUsed))}
                                      </span>
                                      <span className="text-blue-600 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        คงเหลือ: {formatTHB(Number(budget.marketingLimit) - Number(budget.marketingUsed))}
                                      </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.min((Number(budget.marketingUsed) / Number(budget.marketingLimit)) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  ประวัติการใช้งานงบประมาณ
                                </h4>
                                {budget.details && budget.details.length > 0 ? (
                                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                          <TableHead className="text-[11px] font-bold text-slate-500 py-3">วันที่</TableHead>
                                          <TableHead className="text-[11px] font-bold text-slate-500 py-3">รายละเอียดกิจกรรม / ประเภท</TableHead>
                                          <TableHead className="text-[11px] font-bold text-slate-500 py-3 text-right">ยอดที่ใช้</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {budget.details.map((detail) => (
                                          <TableRow key={detail.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="text-xs text-slate-600 font-medium whitespace-nowrap">
                                              {format(new Date(detail.transactionDate), "dd/MM/yyyy", { locale: th })}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex flex-col gap-1.5 py-1">
                                                <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                                                  {detail.description || "-"}
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-[9px] h-4 py-0 font-bold leading-none ${detail.type === "SALES_PROMOTION"
                                                      ? "text-red-600 border-red-100 bg-red-50/50"
                                                      : "text-blue-600 border-blue-100 bg-blue-50/50"
                                                      }`}
                                                  >
                                                    {detail.type === "SALES_PROMOTION" ? "งบส่งเสริมการขาย" : "งบส่งเสริมการตลาด"}
                                                  </Badge>
                                                  {detail.sale && (
                                                    <Badge variant="outline" className="text-[9px] h-4 py-0 font-bold text-slate-500 border-slate-200 bg-slate-50">
                                                      {detail.sale.saleNumber}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <span className="text-xs font-black text-red-600">
                                                - {formatTHB(Number(detail.amount))}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                                    <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 font-medium italic">ยังไม่มีประวัติการใช้งานงบประมาณในปีนี้</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                        <Gift className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-slate-500 mb-1">ไม่พบข้อมูลวงเงินส่งเสริมการขาย</h3>
                        <p className="text-xs text-slate-400">ลูกค้ารายนี้ยังไม่มีการตั้งงบประมาณส่งเสริมการขายในปีปัจจุบัน</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>ไม่พบข้อมูลลูกค้า</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
