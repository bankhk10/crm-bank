"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Gift,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatVolumeValue } from "@/lib/volume-utils";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailItem } from "@/components/custom/detail-item";
import { KpiCard } from "../../ui/kpi-card";
import CustomTable from "@/components/custom/custom-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButton } from "@/components/custom/action-button";

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
    packageSize?: number | null;
    packageSizeUnit?: string | null;
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

interface PromotionalBudgetDetail {
  id: string;
  type: string;
  receivedAmount: number | null;
  usedAmount: number | null;
  description: string | null;
  transactionDate: string;
  sale?: {
    saleNumber: string;
  } | null;
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
  promotionalBudgets: PromotionalBudget[];
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
  PENDING_APPROVAL: {
    label: "รออนุมัติ",
    color: "bg-amber-100 text-amber-800",
  },
  APPROVED: { label: "อนุมัติแล้ว", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "ไม่อนุมัติ", color: "bg-red-100 text-red-800" },
  PAID: { label: "ชำระเงินแล้ว", color: "bg-emerald-100 text-emerald-800" },
  AWAITING_DELIVERY: {
    label: "รอจัดส่ง",
    color: "bg-purple-100 text-purple-800",
  },
  DELIVERY_COMPLETED: {
    label: "ส่งเสร็จแล้ว",
    color: "bg-teal-100 text-teal-800",
  },
  COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
  OVERDUE: { label: "เลยกำหนดครบชำระ", color: "bg-rose-100 text-rose-800" },
};

const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

const formatNumber = (n: number) => new Intl.NumberFormat("th-TH").format(n);

const formatVolume = (n: number | null | undefined) => formatVolumeValue(n);

// ─── Columns ───────────────────────────────

const topProductsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "product",
    header: "สินค้า",
    cell: ({ row }) => (
      <div>
        <p className="font-bold text-slate-900">{row.original.product.name}</p>
        <p className="text-xs text-slate-500">
          {row.original.product.productCode}
        </p>
      </div>
    ),
    meta: { minWidth: 200, align: "left" },
  },
  {
    accessorKey: "totalQuantity",
    header: "จำนวน",
    cell: (info) => (
      <span className="font-medium text-slate-700">
        {formatNumber(info.getValue() as number)}
      </span>
    ),
    meta: { minWidth: 100, align: "right" },
  },
  {
    accessorKey: "totalVolumeLiters",
    header: () => (
      <div className="flex items-center justify-end gap-1">
        <Droplets className="h-3.5 w-3.5 text-blue-500" />
        ปริมาณ (L)
      </div>
    ),
    cell: (info) => (
      <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
        {formatVolume(info.getValue() as number)}
      </span>
    ),
    meta: { minWidth: 120, align: "right" },
  },
  {
    accessorKey: "totalAmount",
    header: "ยอดขาย",
    cell: (info) => (
      <span className="font-extrabold text-emerald-600">
        {formatTHB(info.getValue() as number)}
      </span>
    ),
    meta: { minWidth: 120, align: "right" },
  },
  {
    accessorKey: "orderCount",
    header: "จำนวนออเดอร์",
    cell: (info) => (
      <Badge variant="secondary" className="font-semibold">
        {formatNumber(info.getValue() as number)} ออเดอร์
      </Badge>
    ),
    meta: { minWidth: 120, align: "right" },
  },
];

const recentSalesColumns: ColumnDef<any>[] = [
  {
    accessorKey: "saleNumber",
    header: "เลขที่ใบสั่งซื้อ",
    cell: (info) => (
      <span className="font-bold text-slate-900">
        {info.getValue() as string}
      </span>
    ),
    meta: { minWidth: 140, align: "left" },
  },
  {
    accessorKey: "saleDate",
    header: "วันที่",
    cell: (info) => (
      <span className="text-slate-600 font-medium">
        {format(new Date(info.getValue() as string), "d MMM yyyy", {
          locale: th,
        })}
      </span>
    ),
    meta: { minWidth: 120, align: "left" },
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: (info) => {
      const status = info.getValue() as string;
      return (
        <Badge
          className={cn(
            saleStatusLabels[status]?.color || "bg-gray-100",
            "border-0 px-3",
          )}
        >
          {saleStatusLabels[status]?.label || status}
        </Badge>
      );
    },
    meta: { minWidth: 120, align: "left" },
  },
  {
    accessorKey: "totalAmount",
    header: "มูลค่า",
    cell: (info) => (
      <span className="font-extrabold text-emerald-600">
        {formatTHB(info.getValue() as number)}
      </span>
    ),
    meta: { minWidth: 120, align: "right" },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ActionButton
          href={`/sales/${row.original.id}`}
          icon={ExternalLink}
          label="ดูรายละเอียด"
          colorClass="text-slate-500 hover:bg-slate-100 rounded-md"
        />
      </div>
    ),
    meta: { minWidth: 60, align: "right" },
  },
];

const promoColumns: ColumnDef<any>[] = [
  {
    accessorKey: "transactionDate",
    header: "วันที่",
    cell: (info) => (
      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
        {format(new Date(info.getValue() as string), "dd/MM/yyyy", {
          locale: th,
        })}
      </span>
    ),
    meta: { minWidth: 100, align: "left" },
  },
  {
    id: "details",
    header: "รายละเอียด",
    cell: ({ row }) => {
      const detail = row.original;
      return (
        <div className="flex flex-col gap-1.5 py-1">
          <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors">
            {detail.description || "-"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={`text-[9px] h-4 py-0 font-bold leading-none ${
                detail.type === "SALES_PROMOTION"
                  ? "text-red-600 border-red-100 bg-red-50/50"
                  : "text-blue-600 border-blue-100 bg-blue-50/50"
              }`}
            >
              {detail.type === "SALES_PROMOTION"
                ? "งบส่งเสริมการขาย"
                : "งบส่งเสริมการตลาด"}
            </Badge>
            {detail.sale && (
              <Badge
                variant="outline"
                className="text-[9px] h-4 py-0 font-bold text-slate-500 border-slate-200 bg-slate-50"
              >
                {detail.sale.saleNumber}
              </Badge>
            )}
          </div>
        </div>
      );
    },
    meta: { minWidth: 200, align: "left" },
  },
  {
    id: "amount",
    header: "ยอดสะสม",
    cell: ({ row }) => {
      const detail = row.original;
      return (
        <div className="flex flex-col items-end gap-1">
          {detail.receivedAmount && Number(detail.receivedAmount) > 0 && (
            <span className="text-xs font-black text-emerald-600">
              + {formatTHB(Number(detail.receivedAmount))}
            </span>
          )}
          {detail.usedAmount && Number(detail.usedAmount) > 0 && (
            <span className="text-xs font-black text-red-600">
              - {formatTHB(Number(detail.usedAmount))}
            </span>
          )}
        </div>
      );
    },
    meta: { minWidth: 120, align: "right" },
  },
];

interface CustomerSalesDetailViewProps {
  customerId: string;
}

export default function CustomerSalesDetailView({
  customerId,
}: CustomerSalesDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("store-info");
  const [customerData, setCustomerData] = useState<{
    customer: CustomerDetail;
    kpi: CustomerKPI;
    recentSales: RecentSale[];
    topProducts: TopProduct[];
  } | null>(null);

  // Pagination for Top Products
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [topProductsPerPage, setTopProductsPerPage] = useState(5);

  // Pagination for Recent Sales
  const [recentSalesPage, setRecentSalesPage] = useState(1);
  const [recentSalesPerPage, setRecentSalesPerPage] = useState(10);

  // Pagination for Promo
  const [promoPage, setPromoPage] = useState(1);
  const [promoPerPage, setPromoPerPage] = useState(10);

  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDateParam) params.set("startDate", startDateParam);
      if (endDateParam) params.set("endDate", endDateParam);
      const queryStr = params.toString();

      const response = await fetch(
        `/api/customers/${customerId}/details${queryStr ? `?${queryStr}` : ""}`,
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
  }, [customerId, startDateParam, endDateParam]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const customer = customerData?.customer;
  const kpi = customerData?.kpi;
  const recentSales = customerData?.recentSales || [];
  const topProducts = customerData?.topProducts || [];

  const backUrl =
    startDateParam && endDateParam
      ? `/reports/customer-sales?startDate=${startDateParam}&endDate=${endDateParam}`
      : "/reports/customer-sales";

  // Pagination slices
  const topProductsSliced = topProducts.slice(
    (topProductsPage - 1) * topProductsPerPage,
    topProductsPage * topProductsPerPage,
  );

  const recentSalesSliced = recentSales.slice(
    (recentSalesPage - 1) * recentSalesPerPage,
    recentSalesPage * recentSalesPerPage,
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <p className="text-muted-foreground animate-pulse">
          กำลังโหลดข้อมูลลูกค้า...
        </p>
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
          backUrl={backUrl}
          backLabel="หน้ารายงานตามลูกค้า"
          title={customer?.name || "รายละเอียดลูกค้า"}
          icon={<Users className="h-8 w-8 text-white" />}
          accentColor="#B91C1C" // Changed to company red for consistency
          backgroundColor="#111111"
          badges={
            <>
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-white bg-white/10 border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
                รหัสลูกค้า: {customer?.customerCode}
              </span>
              <Badge
                className={cn(
                  customerStatusLabels[customer?.status || "ACTIVE"]?.color,
                  "border-0 px-3 py-1.5 rounded-full",
                )}
              >
                {customerStatusLabels[customer?.status || "ACTIVE"]?.label}
              </Badge>
              <Badge className="bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full">
                {customerTypeLabels[customer?.customerType || "DEALER"]}
              </Badge>
              {startDateParam && endDateParam && (
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-full shadow-sm">
                  <Clock className="h-3.5 w-3.5" />
                  ช่วงวันที่: {format(new Date(startDateParam), "dd/MM/yyyy", { locale: th })} - {format(new Date(endDateParam), "dd/MM/yyyy", { locale: th })}
                </span>
              )}
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
            gradient="bg-gradient-to-br from-red-600 to-red-700"
            ring="shadow-lg shadow-red-600/20"
            topColor="red"
          />

          <KpiCard
            label="ค่าเฉลี่ย/ออเดอร์"
            value={formatTHB(kpi?.averageOrderValue || 0)}
            icon={Award}
            gradient="bg-gradient-to-br from-slate-900 to-slate-800"
            ring="shadow-lg shadow-slate-900/20"
            topColor="black"
          />

          <KpiCard
            label="ออเดอร์ทั้งหมด"
            value={formatNumber(kpi?.lifetimeOrderCount || 0)}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
            ring="shadow-lg shadow-red-500/20"
            topColor="red"
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
            <div className="border-b px-2 sm:px-4 overflow-x-auto">
              <TabsList className="h-12 bg-transparent inline-flex w-auto min-w-full sm:min-w-0">
                <TabsTrigger
                  value="store-info"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Store className="h-4 w-4 mr-2" />
                  ข้อมูลร้าน
                </TabsTrigger>
                <TabsTrigger
                  value="products-sold"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  สินค้าที่เคยขาย
                </TabsTrigger>
                <TabsTrigger
                  value="purchase-history"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  ประวัติการซื้อ
                </TabsTrigger>
                <TabsTrigger
                  value="finance"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  การเงิน
                </TabsTrigger>
                <TabsTrigger
                  value="promotions"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  ประวัติงบส่งเสริมการขาย
                </TabsTrigger>
                <TabsTrigger
                  value="contact-notes"
                  className="shrink-0 whitespace-nowrap data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
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
                    accentColor="#B91C1C"
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
                        value={
                          customerTypeLabels[customer?.customerType || "DEALER"]
                        }
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
                    accentColor="#B91C1C"
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
                        icon={<MapPin className="h-5 w-5 text-red-600" />}
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
                      accentColor="#B91C1C"
                    />
                    <div className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-bold text-slate-700">
                              สินค้า
                            </TableHead>
                            <TableHead className="text-center font-bold text-slate-700">
                              จำนวน
                            </TableHead>
                            <TableHead className="text-center font-bold text-slate-700">
                              มูลค่ารวม
                            </TableHead>
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
                    accentColor="#B91C1C"
                  />
                  <div className="p-0">
                    {topProducts.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50/30">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>ยังไม่มีข้อมูลสินค้าที่เคยขายให้ลูกค้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <CustomTable
                          columns={topProductsColumns}
                          data={topProductsSliced}
                          className="w-full border-0 shadow-none"
                          toolbar={<></>}
                          pagination={{
                            page: topProductsPage,
                            perPage: topProductsPerPage,
                            total: topProducts.length,
                            onPageChange: setTopProductsPage,
                            onPerPageChange: (newPerPage) => {
                              setTopProductsPerPage(newPerPage);
                              setTopProductsPage(1);
                            },
                            perPageOptions: [5, 10, 20],
                          }}
                          emptyState={{
                            title: "ไม่มีสินค้า",
                            description: "ไม่พบสินค้าที่เคยขายให้ร้านนี้",
                          }}
                        />
                        {/* Summary Row */}
                        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                สินค้าทั้งหมด:
                              </span>
                              <span className="font-bold text-slate-900">
                                {topProducts.length} รายการ
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">ยอดขายรวม:</span>
                              <span className="font-extrabold text-emerald-600">
                                {formatTHB(
                                  topProducts.reduce(
                                    (acc, item) => acc + item.totalAmount,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Droplets className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-slate-500">ปริมาณรวม:</span>
                              <span className="font-bold text-blue-600">
                                {formatVolume(
                                  topProducts.reduce(
                                    (acc, item) => acc + item.totalVolumeLiters,
                                    0,
                                  ),
                                )}{" "}
                                L
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                ออเดอร์รวม:
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatNumber(
                                  topProducts.reduce(
                                    (acc, item) => acc + item.orderCount,
                                    0,
                                  ),
                                )}
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
                    accentColor="#B91C1C"
                  />
                  <div className="p-0">
                    {recentSales.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50/30">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>ยังไม่มีประวัติการซื้อสำหรับลูกค้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <CustomTable
                          columns={recentSalesColumns}
                          data={recentSalesSliced}
                          className="w-full border-0 shadow-none"
                          toolbar={<></>}
                          pagination={{
                            page: recentSalesPage,
                            perPage: recentSalesPerPage,
                            total: recentSales.length,
                            onPageChange: setRecentSalesPage,
                            onPerPageChange: (newPerPage) => {
                              setRecentSalesPerPage(newPerPage);
                              setRecentSalesPage(1);
                            },
                            perPageOptions: [5, 10, 20],
                          }}
                          emptyState={{
                            title: "ไม่มีประวัติการซื้อ",
                            description:
                              "ยังไม่มีประวัติการซื้อสำหรับลูกค้านี้",
                          }}
                        />
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
                    accentColor="#B91C1C"
                  />
                  <div className="p-6">
                    {customer?.creditLimits &&
                    customer.creditLimits.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {customer.creditLimits.map((limit) => (
                          <div
                            key={limit.id}
                            className="border border-slate-100 rounded-xl p-6 bg-slate-50/30"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Badge
                                variant="secondary"
                                className="px-3 py-1 font-bold text-slate-600"
                              >
                                {limit.status === "ACTIVE"
                                  ? "วงเงินปัจจุบัน"
                                  : "สถานะอื่นๆ"}
                              </Badge>
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block mb-1">
                                  วันที่เริ่มใช้งาน
                                </span>
                                <span className="text-sm font-bold text-slate-600">
                                  {format(
                                    new Date(limit.effectiveDate),
                                    "d MMM yyyy",
                                    { locale: th },
                                  )}
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
                                value={
                                  <span className="text-emerald-600 font-extrabold">
                                    {formatTHB(limit.availableAmount)}
                                  </span>
                                }
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

              {/* Promotions Tab */}
              <TabsContent value="promotions" className="m-0 p-4 space-y-4">
                {customer?.promotionalBudgets &&
                customer.promotionalBudgets.length > 0 ? (
                  customer.promotionalBudgets.map((budget) => (
                    <div key={budget.id} className="space-y-4">
                      <Card className="border border-red-100 bg-red-50/10 shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between mt-4 ml-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4 text-red-500" />
                            ประวัติการสะสมงบส่งเสริมการขาย
                          </CardTitle>
                        </div>
                        <div className="pt-2">
                          {budget.details && budget.details.length > 0 ? (
                            (() => {
                              const detailsSliced = budget.details.slice(
                                (promoPage - 1) * promoPerPage,
                                promoPage * promoPerPage,
                              );
                              return (
                                <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                                  <CustomTable
                                    columns={promoColumns}
                                    data={detailsSliced}
                                    className="w-full border-0 shadow-none"
                                    toolbar={<></>}
                                    pagination={{
                                      page: promoPage,
                                      perPage: promoPerPage,
                                      total: budget.details.length,
                                      onPageChange: setPromoPage,
                                      onPerPageChange: (newPerPage) => {
                                        setPromoPerPage(newPerPage);
                                        setPromoPage(1);
                                      },
                                      perPageOptions: [5, 10, 20],
                                    }}
                                    emptyState={{
                                      title: "ไม่มีประวัติการใช้งานงบประมาณ",
                                      description:
                                        "ยังไม่มีข้อมูลการใช้วงเงินในงบประมาณนี้",
                                    }}
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                              <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-medium italic">
                                ยังไม่มีประวัติการใช้งานงบประมาณในปีนี้
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                    <Gift className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-500 mb-1">
                      ไม่พบข้อมูลวงเงินส่งเสริมการขาย
                    </h3>
                    <p className="text-xs text-slate-400">
                      ลูกค้ารายนี้ยังไม่มีการตั้งงบประมาณส่งเสริมการขายในปีปัจจุบัน
                    </p>
                  </div>
                )}
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
                      accentColor="#B91C1C"
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
