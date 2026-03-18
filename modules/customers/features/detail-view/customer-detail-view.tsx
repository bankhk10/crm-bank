"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  FileText,
  Truck,
  Star,
  UserCheck,
  ImageIcon,
  Navigation,
  Sparkles,
  Award,
  ShoppingBag,
  Target,
  Sprout,
  Wallet,
  Flower,
  Users,
  LayoutGrid,
  Clock,
  FlaskConical,
  Store,
  Briefcase,
  Tag,
  Tractor,
  MapPlus,
  Pencil,
  Trash2,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatAddress } from "@/lib/address-utils";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailHero } from "@/components/custom/detail-hero";
import { DetailItem } from "@/components/custom/detail-item";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  customerCode: string;
  customerType: string;
  name: string;
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  addressLine?: string | null;
  region?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  billingAddressLine?: string | null;
  billingProvince?: string | null;
  billingDistrict?: string | null;
  billingSubdistrict?: string | null;
  billingPostalCode?: string | null;
  shippingAddressLine?: string | null;
  shippingProvince?: string | null;
  shippingDistrict?: string | null;
  shippingSubdistrict?: string | null;
  shippingPostalCode?: string | null;
  status?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  relationshipScore?: number | null;
  birthDate?: string | null;
  responsibleEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  parentDealer?: { id: string; name: string } | null;
  images?: Array<{ id: string; url: string; name?: string }>;
  receiveFromDealer?: string | null;
  mainCompetitor?: string | null;
  areaCrops?: string | null;
  averageMonthlyPurchase?: string | null;
  mainProductSold?: string[] | null;
  brandsSold?: string[] | null;
  areaType?: string | null;
  // Farmer fields
  farmPlots?: Array<{
    latitude?: string;
    longitude?: string;
    areaRai?: string;
    cropType?: string;
    variety?: string;
    soilType?: string;
    waterSource?: string;
  }>;
  // Broker fields
  cropTypes?: string | null;
  currentYield?: string | null;
  farmerCount?: string | null;
  plotCount?: string | null;
  totalAreaRai?: string | null;
  harvestPerYear?: string | null;
  creditDays?: string | null;
  chemicalValuePerCycle?: string | null;
  chemicalQtyPerCycle?: string | null;
  regularShops?: string | null;
  serviceTypes?: string | null;
  usedBrands?: string | null;
  addresses?: Array<{
    addressLine?: string | null;
    province?: string | null;
    district?: string | null;
    subdistrict?: string | null;
    postalCode?: string | null;
  }>;
  contacts?: Array<{
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
};

const statusMap: Record<
  string,
  { label: string; className: string; gradient: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/30",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    className:
      "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 shadow-lg shadow-gray-500/20",
    gradient: "from-gray-400/20 to-gray-500/20",
  },
  SUSPENDED: {
    label: "ระงับ",
    className:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/30",
    gradient: "from-red-500/20 to-rose-500/20",
  },
};

const customerTypeMap: Record<
  string,
  { label: string; icon: string; gradient: string }
> = {
  DEALER: {
    label: "ตัวแทนจำหน่าย",
    icon: "🏪",
    gradient: "from-blue-500 to-indigo-600",
  },
  SUBDEALER: {
    label: "ตัวแทนจำหน่ายย่อย",
    icon: "🏬",
    gradient: "from-purple-500 to-pink-600",
  },
  FARMER: {
    label: "เกษตรกร",
    icon: "🌾",
    gradient: "from-green-500 to-emerald-600",
  },
  BROKER: {
    label: "นายหน้า",
    icon: "💼",
    gradient: "from-orange-500 to-amber-600",
  },
};


export default function CustomerDetailView() {
  const { customerId } = useParams() as { customerId: string };
  const router = useRouter();
  const { allowed, isLoading, hasPermission } = usePermission("menu.customers");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const canView = !isLoading && allowed && (!customer || hasPermission(`customer.view.${customer.customerType?.toLowerCase() || 'dealer'}`));
  const canEdit = customer ? hasPermission(`customer.edit.${customer.customerType?.toLowerCase() || 'dealer'}`) : false;
  const canDelete = customer ? hasPermission(`customer.delete.${customer.customerType?.toLowerCase() || 'dealer'}`) : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleNextImage = () => {
    if (selectedImageIndex === null || !customer?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null ? null : (prev + 1) % customer.images!.length,
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !customer?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + customer.images!.length) % customer.images!.length,
    );
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "Escape") setSelectedImageIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex]);

  // Reset zoom and pan when dialog closes
  useEffect(() => {
    if (selectedImageIndex === null) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [selectedImageIndex]);

  // Zoom and Pan Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) throw new Error("Failed to load customer");
        const json = await res.json();
        const src = (json && (json.customer ?? json)) || null;
        if (mounted) setCustomer(src || null);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (!canView && !isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6">
        <Alert
          variant="destructive"
          className="max-w-md shadow-2xl border-red-200"
        >
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>
            คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้านี้
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-56 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-[240px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[320px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive" className="shadow-2xl border-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20"></div>
          <div className="relative rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-10 shadow-2xl">
            <User className="h-16 w-16 text-indigo-500" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            ไม่พบข้อมูลลูกค้า
          </h2>
          <p className="text-gray-500 text-lg">
            รหัสลูกค้า:{" "}
            <span className="font-mono font-semibold">{customerId}</span>
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all hover:scale-105"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const statusInfo = customer.status
    ? statusMap[customer.status.toUpperCase()]
    : null;
  const customerTypeInfo = customerTypeMap[customer.customerType];
  const age = customer.birthDate
    ? Math.floor(
      (Date.now() - new Date(customer.birthDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25),
    )
    : null;

  const relationshipLevel = !customer.relationshipScore
    ? "ไม่ระบุ"
    : customer.relationshipScore === 1
      ? "แย่"
      : customer.relationshipScore === 2
        ? "ปานกลาง"
        : customer.relationshipScore === 3
          ? "ดี"
          : "-";

  const relationshipColor = !customer.relationshipScore
    ? "text-gray-400"
    : customer.relationshipScore === 1
      ? "text-red-500"
      : customer.relationshipScore === 2
        ? "text-amber-500"
        : "text-emerald-500";

  return (
    <div className="min-h-screen">
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <DetailHero
        backUrl="/customers"
        backLabel="หน้ารายการลูกค้า"
        title={customer.name}
        icon={<Store className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
        accentColor="#B91C1C"
        badges={
          <>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
              <BadgeCheck className="h-3.5 w-3.5 text-[#F87171]" />
              {customer.customerCode}
            </span>
            {customerTypeInfo && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                {customerTypeInfo.label}
              </span>
            )}
            {customer.responsibleEmployee && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                <UserCheck className="h-3.5 w-3.5 text-gray-500" />
                ผู้รับผิดชอบ: {customer.responsibleEmployee.firstName} {customer.responsibleEmployee.lastName}
              </span>
            )}
            {customer.province && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                {customer.province}
              </span>
            )}
            {customer.status === "ACTIVE" || !customer.status ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ใช้งาน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <XCircle className="h-3.5 w-3.5" />
                {customer.status}
              </span>
            )}
          </>
        }
        actions={
          <>
            {customer.latitude && customer.longitude && (
              <Button
                size="sm"
                className="h-10 px-4 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`,
                    "_blank"
                  )
                }
              >
                <Navigation className="h-3.5 w-3.5" />
                แผนที่
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                className="h-10 px-6 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                onClick={() => router.push(`/customers/${customerId}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" />
                แก้ไข
              </Button>
            )}
          </>
        }
      />

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Company Info ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <SectionHeader
              icon={<Building className="h-6 w-6" />}
              title="ข้อมูลบริษัท"
            />
            <div className="p-6 space-y-1 divide-y divide-gray-50">
              <DetailItem
                icon={<Building className="h-4 w-4 text-gray-400" />}
                label="ชื่อบริษัท / ร้านค้า"
                value={customer.name}
              />
              <DetailItem
                icon={<FileText className="h-4 w-4 text-gray-400" />}
                label="เลขผู้เสียภาษี"
                value={customer.taxId}
              />
              <DetailItem
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                label="เบอร์โทรศัพท์ (องค์กร)"
                value={customer.phone}
              />
              <DetailItem
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                label="อีเมล (องค์กร)"
                value={customer.email}
              />
              <DetailItem
                icon={<Award className="h-4 w-4 text-gray-400" />}
                label="ความสัมพันธ์"
                value={
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${relationshipColor}`}>
                      {relationshipLevel}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${customer.relationshipScore &&
                            customer.relationshipScore >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                }
              />
              {customer.parentDealer && (
                <DetailItem
                  icon={<Building className="h-4 w-4 text-gray-400" />}
                  label="ร้านค้าหลัก (Parent Dealer)"
                  value={customer.parentDealer.name}
                />
              )}
            </div>
          </div>

          {/* ── Sub-Dealer Info ─────────────────────────────────────── */}
          {customer.customerType === "SUBDEALER" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <SectionHeader
                icon={<ShoppingBag className="h-6 w-6" />}
                title="ข้อมูลการขาย"
                variant="dark"
              />
              <div className="p-6 space-y-1 divide-y divide-gray-50">
                <DetailItem
                  icon={<Building className="h-4 w-4 text-gray-400" />}
                  label="รับของจาก Dealer"
                  value={
                    customer.parentDealer &&
                      customer.parentDealer.id === customer.receiveFromDealer
                      ? customer.parentDealer.name
                      : customer.name
                  }
                />
                <DetailItem
                  icon={<Target className="h-4 w-4 text-gray-400" />}
                  label="คู่แข่งหลัก"
                  value={customer.mainCompetitor}
                />
                <DetailItem
                  icon={<Sprout className="h-4 w-4 text-gray-400" />}
                  label="พืชในพื้นที่"
                  value={customer.areaCrops}
                />
                <DetailItem
                  icon={<Wallet className="h-4 w-4 text-gray-400" />}
                  label="ยอดสั่งซื้อเฉลี่ย/เดือน"
                  value={
                    customer.averageMonthlyPurchase
                      ? `${Number(
                        customer.averageMonthlyPurchase
                      ).toLocaleString()} บาท`
                      : null
                  }
                />
              </div>
            </div>
          )}

          {/* ── Contact Info ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <SectionHeader
              icon={<User className="h-6 w-6" />}
              title="ข้อมูลผู้ติดต่อ"
              variant={customer.customerType === "SUBDEALER" ? "primary" : "dark"}
            />
            <div className="p-6 space-y-1 divide-y divide-gray-50">
              <DetailItem
                icon={<User className="h-4 w-4 text-gray-400" />}
                label="ชื่อ-นามสกุล"
                value={[customer.prefix, customer.firstName, customer.lastName]
                  .filter(Boolean)
                  .join(" ")}
              />
              <DetailItem
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                label="เบอร์โทรศัพท์ (ส่วนตัว)"
                value={customer.contactPhone}
              />
              <DetailItem
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                label="อีเมล (ส่วนตัว)"
                value={customer.contactEmail}
              />
              <DetailItem
                icon={<Calendar className="h-4 w-4 text-gray-400" />}
                label="วันเกิด / อายุ"
                value={
                  customer.birthDate
                    ? `${new Date(customer.birthDate).toLocaleDateString(
                      "th-TH"
                    )} ${age !== null ? `(${age} ปี)` : ""}`
                    : null
                }
              />
            </div>
          </div>

          {/* ── Farmer Info — full width ──────────────────────────── */}
          {customer.customerType === "FARMER" &&
            customer.farmPlots &&
            customer.farmPlots.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                <SectionHeader
                  icon={<Sprout className="h-6 w-6" />}
                  title={`ข้อมูลแปลงเกษตร (${customer.farmPlots.length} แปลง)`}
                  variant="dark"
                />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.farmPlots.map((plot, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2"
                    >
                      <h4 className="font-bold text-sm text-[#B91C1C] flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-[#B91C1C] text-white flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        แปลงที่ {index + 1}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs text-gray-500">ชนิดพืช: {plot.cropType || "-"}</div>
                        <div className="text-xs text-gray-500">สายพันธุ์: {plot.variety || "-"}</div>
                        <div className="text-xs text-gray-500">พื้นที่: {plot.areaRai || "-"} ไร่</div>
                        <div className="text-xs text-gray-500">ดิน: {plot.soilType || "-"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* ── Broker Info — full width ──────────────────────────── */}
          {customer.customerType === "BROKER" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
              <SectionHeader
                icon={<Briefcase className="h-6 w-6" />}
                title="ข้อมูลเครือข่าย (Broker)"
                variant="dark"
              />
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">จำนวนเกษตรกร</div>
                  <div className="text-sm font-bold">{customer.farmerCount || "-"} ราย</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">จำนวนแปลง</div>
                  <div className="text-sm font-bold">{customer.plotCount || "-"} แปลง</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">พื้นที่รวม</div>
                  <div className="text-sm font-bold">{customer.totalAreaRai || "-"} ไร่</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">พืชหลัก</div>
                  <div className="text-sm font-bold">{customer.cropTypes || "-"}</div>
                </div>
              </div>
            </div>
          )}


          {/* ── Notes ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <SectionHeader
              icon={<FileText className="h-6 w-6" />}
              title="หมายเหตุ"
            />
            <div className="p-6">
              {customer.notes ? (
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {customer.notes}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center">ไม่มีบันทึกข้อมูล</p>
              )}
            </div>
          </div>

          {/* ── Addresses — full width ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
            <SectionHeader
              icon={<MapPin className="h-6 w-6" />}
              title="ที่อยู่และการจัดส่ง"
            />
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider">ที่อยู่บริษัท</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {formatAddress({
                    addressLine: customer.addressLine,
                    subdistrict: customer.subdistrict,
                    district: customer.district,
                    province: customer.province,
                    postalCode: customer.postalCode,
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider">ที่อยู่วางบิล</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {formatAddress({
                    addressLine: customer.billingAddressLine,
                    subdistrict: customer.billingSubdistrict,
                    district: customer.billingDistrict,
                    province: customer.billingProvince,
                    postalCode: customer.billingPostalCode,
                  }) || "ไม่มีข้อมูล"}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider">ที่อยู่จัดส่ง</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {formatAddress({
                    addressLine: customer.shippingAddressLine,
                    subdistrict: customer.shippingSubdistrict,
                    district: customer.shippingDistrict,
                    province: customer.shippingProvince,
                    postalCode: customer.shippingPostalCode,
                  }) || "ไม่มีข้อมูล"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Images ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
            <SectionHeader
              icon={<ImageIcon className="h-6 w-6" />}
              title="รูปภาพร้านค้า"
              variant="dark"
            />
            <div className="p-6">
              {customer.images && customer.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {customer.images.map((img, index) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-zoom-in border border-gray-200 hover:border-[#B91C1C] transition-all group"
                    >
                      <img
                        src={img.url}
                        alt="Customer"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Search className="text-white h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">ไม่มีรูปภาพ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Dialog Logic ────────────────────────────────── */}
      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedImageIndex(null)}
      >
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/20 backdrop-blur-md border-none shadow-none flex items-center justify-center outline-none [&>button]:hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImageIndex !== null && customer.images && (
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              {customer.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    className="absolute left-4 md:left-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    className="absolute right-4 md:right-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}

              <div
                className="relative max-w-full max-h-full flex flex-col items-center overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
              >
                <img
                  src={customer.images[selectedImageIndex].url}
                  alt="Full Preview"
                  className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
