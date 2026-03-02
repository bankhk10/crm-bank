"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertTriangle,
  Pencil,
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
  TrendingUp,
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
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  fullWidth?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  icon: Icon,
  className,
  fullWidth,
}) => (
  <div
    className={`group flex flex-col gap-2 ${fullWidth ? "col-span-full" : ""
      } ${className}`}
  >
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {Icon && (
        <Icon className="h-3.5 w-3.5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
      )}
      {label}
    </div>
    <div className="text-base text-gray-900 font-medium break-words pl-5 group-hover:text-gray-700 transition-colors">
      {value}
    </div>
  </div>
);

const AddressBlock: React.FC<{
  title: string;
  icon: React.ElementType;
  addressLine?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  variant?: "blue" | "orange" | "purple";
}> = ({
  title,
  icon: Icon,
  addressLine,
  subdistrict,
  district,
  province,
  postalCode,
  variant = "blue",
}) => {
    const hasAddress =
      addressLine || subdistrict || district || province || postalCode;

    const colors = {
      blue: {
        bg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50",
        border: "border-blue-200/60",
        icon: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30",
        text: "text-blue-900",
      },
      orange: {
        bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50",
        border: "border-orange-200/60",
        icon: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30",
        text: "text-orange-900",
      },
      purple: {
        bg: "bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50",
        border: "border-purple-200/60",
        icon: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30",
        text: "text-purple-900",
      },
    };

    const style = colors[variant];

    return (
      <div
        className={`${style.bg} ${style.border} p-5 rounded-2xl border-2 h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1`}
      >
        <h3 className={`font-bold flex items-center gap-3 mb-4 ${style.text}`}>
          <div className={`p-2 rounded-xl ${style.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </h3>
        <div className="pl-11 space-y-2 text-sm/relaxed">
          {hasAddress ? (
            <>
              {addressLine && (
                <div className="font-semibold text-gray-800">{addressLine}</div>
              )}
              <div className="text-gray-600 font-medium">
                {[subdistrict, district, province, postalCode]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            </>
          ) : (
            <div className="text-gray-400 italic flex items-center gap-2">
              <span className="text-xl">📭</span>
              ไม่มีข้อมูลที่อยู่
            </div>
          )}
        </div>
      </div>
    );
  };

const InfoChip: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
    {icon}
    <span className="font-medium">{children}</span>
  </div>
);

export default function CustomerDetailPage() {
  const { customerId } = useParams() as { customerId: string };
  const router = useRouter();
  const { allowed, isLoading } = usePermission("menu.customers");
  const { allowed: canEdit } = usePermission("customer.edit");
  const canView = !isLoading && allowed;

  const [customer, setCustomer] = useState<Customer | null>(null);
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

  if (!canView) {
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

  if (loading) {
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
    <div className="max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Enhanced Hero Header Section */}
      <div className="relative rounded-2xl sm:rounded-4xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-pulse delay-700 pointer-events-none" />

        <div className="relative p-5 sm:p-8 md:p-12">
          {/* Top row: back + actions */}
          <div className="flex items-center justify-between mb-5 sm:mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {customer.latitude && customer.longitude && (
                <Button
                  size="sm"
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm font-semibold rounded-xl transition-all hover:scale-[1.03] text-xs sm:text-sm px-3 sm:px-5"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`,
                      "_blank",
                    )
                  }
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">เปิดแผนที่</span>
                  <span className="sm:hidden">แผนที่</span>
                </Button>
              )}
              {canEdit && (
                <Link href={`/customers/${customer.id}/edit`}>
                  <Button
                    size="sm"
                    className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl font-semibold rounded-xl transition-all hover:scale-[1.03] text-xs sm:text-sm px-3 sm:px-5"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">แก้ไขข้อมูล</span>
                    <span className="sm:hidden">แก้ไข</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Badges + Name + Chips */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {customerTypeInfo && (
                <Badge
                  className={`bg-gradient-to-r ${customerTypeInfo.gradient} text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg font-semibold text-xs sm:text-sm`}
                >
                  <span className="mr-1.5">{customerTypeInfo.icon}</span>
                  {customerTypeInfo.label}
                </Badge>
              )}
              {statusInfo && (
                <Badge
                  className={`${statusInfo.className} px-3 sm:px-4 py-1 sm:py-1.5 font-semibold text-xs sm:text-sm`}
                >
                  <Sparkles className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {statusInfo.label}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-white drop-shadow-xl leading-tight">
              {customer.name}
            </h1>

            <div className="flex flex-wrap gap-2 sm:gap-3 text-white/90 text-xs sm:text-sm md:text-base">
              <InfoChip icon={<Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}>
                {customer.customerCode}
              </InfoChip>
              <InfoChip icon={<MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}>
                {customer.province || "ไม่ระบุจังหวัด"}
              </InfoChip>
              {customer.region && (
                <InfoChip icon={<MapPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}>
                  เขต: {customer.region}
                </InfoChip>
              )}
              {customer.responsibleEmployee && (
                <InfoChip icon={<UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}>
                  ผู้รับผิดชอบ: {customer.responsibleEmployee.firstName} {customer.responsibleEmployee.lastName}
                </InfoChip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Info & Contact */}
        <div className="xl:col-span-8 order-2 xl:order-1 space-y-6 sm:space-y-8">
          {/* Section: Company Info */}
          <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 pb-5">
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <Building className="h-6 w-6" />
                </div>
                ข้อมูลบริษัท
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <DetailItem
                label="ชื่อบริษัท / ร้านค้า"
                value={customer.name}
                icon={Building}
                className="col-span-full"
              />
              <DetailItem
                label="เลขผู้เสียภาษี"
                value={customer.taxId || "-"}
                icon={FileText}
              />
              <DetailItem
                label="เบอร์โทรศัพท์ (องค์กร)"
                value={
                  customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:text-indigo-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                    >
                      {customer.phone}
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon={Phone}
              />
              <DetailItem
                label="อีเมล (องค์กร)"
                value={
                  customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:text-indigo-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                    >
                      {customer.email}
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon={Mail}
              />
              <DetailItem
                label="ความสัมพันธ์"
                value={
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${relationshipColor}`}>
                      {relationshipLevel}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 transition-all ${customer.relationshipScore &&
                            customer.relationshipScore >= star
                            ? "fill-yellow-400 text-yellow-400 scale-110"
                            : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                }
                icon={Award}
              />
              {customer.parentDealer && (
                <DetailItem
                  label="ร้านค้าหลัก (Parent Dealer)"
                  value={
                    <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      {customer.parentDealer.name}
                    </span>
                  }
                  icon={Building}
                />
              )}
            </CardContent>
          </Card>

          {/* Section: Sub-Dealer Info */}
          {customer.customerType === "SUBDEALER" && (
            <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pt-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200 pb-5">
                <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  ข้อมูลการขาย (Sub-Dealer)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {customer.receiveFromDealer && (
                  <DetailItem
                    label="รับของจาก Dealer"
                    value={
                      customer.parentDealer &&
                        customer.parentDealer.id === customer.receiveFromDealer
                        ? customer.parentDealer.name
                        : customer.name
                    }
                    icon={Building}
                  />
                )}
                <DetailItem
                  label="คู่แข่งหลัก"
                  value={customer.mainCompetitor || "-"}
                  icon={Target}
                />
                <DetailItem
                  label="พืชในพื้นที่"
                  value={customer.areaCrops || "-"}
                  icon={Sprout}
                />
                <DetailItem
                  label="ยอดสั่งซื้อเฉลี่ย/เดือน"
                  value={
                    customer.averageMonthlyPurchase
                      ? `${Number(
                        customer.averageMonthlyPurchase,
                      ).toLocaleString()} บาท`
                      : "-"
                  }
                  icon={Wallet}
                />
                <DetailItem
                  label="สินค้าหลักที่ขาย"
                  value={
                    customer.mainProductSold &&
                      customer.mainProductSold.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.mainProductSold.map((item, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-sm font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )
                  }
                  icon={ShoppingBag}
                  fullWidth
                />
                <DetailItem
                  label="แบรนด์ที่จำหน่าย"
                  value={
                    customer.brandsSold && customer.brandsSold.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.brandsSold.map((item, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-sm font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )
                  }
                  icon={Award}
                  fullWidth
                />
                <DetailItem
                  label="ประเภทพื้นที่"
                  value={customer.areaType || "-"}
                  icon={MapPin}
                />
              </CardContent>
            </Card>
          )}

          {/* Section: Farmer Info (Farm Plots) */}
          {customer.customerType === "FARMER" &&
            customer.farmPlots &&
            customer.farmPlots.length > 0 && (
              <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 pb-5">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                      <Sprout className="h-6 w-6" />
                    </div>
                    ข้อมูลแปลงเกษตร ({customer.farmPlots.length} แปลง)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {customer.farmPlots.map((plot, index) => (
                    <div
                      key={index}
                      className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-green-200 transition-colors"
                    >
                      <h4 className="font-bold text-lg text-green-800 mb-4 flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">
                          {index + 1}
                        </span>
                        รายละเอียดแปลง
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <DetailItem
                          label="ชนิดพืช"
                          value={plot.cropType || "-"}
                          icon={Sprout}
                        />
                        <DetailItem
                          label="สายพันธุ์"
                          value={plot.variety || "-"}
                          icon={Flower}
                        />
                        <DetailItem
                          label="ขนาดพื้นที่ (ไร่)"
                          value={plot.areaRai || "-"}
                          icon={MapPin}
                        />
                        <DetailItem
                          label="ประเภทดิน"
                          value={plot.soilType || "-"}
                          icon={MapPin}
                        />
                        <DetailItem
                          label="แหล่งน้ำ"
                          value={plot.waterSource || "-"}
                          icon={Target}
                        />
                        <DetailItem
                          label="พิกัด"
                          value={
                            plot.latitude && plot.longitude ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${plot.latitude},${plot.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                              >
                                <Navigation className="w-3 h-3" />
                                {plot.latitude}, {plot.longitude}
                              </a>
                            ) : (
                              "-"
                            )
                          }
                          icon={Navigation}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* Section: Broker Info */}
          {customer.customerType === "BROKER" && (
            <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pt-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200 pb-5">
                <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  ข้อมูลเครือข่าย (Broker)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Network Scale */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg text-gray-700 border-l-4 border-orange-500 pl-3">
                      ขนาดเครือข่าย
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailItem
                        label="จำนวนเกษตรกร"
                        value={
                          customer.farmerCount
                            ? `${customer.farmerCount} ราย`
                            : "-"
                        }
                        icon={Users}
                      />
                      <DetailItem
                        label="จำนวนแปลง"
                        value={
                          customer.plotCount
                            ? `${customer.plotCount} แปลง`
                            : "-"
                        }
                        icon={LayoutGrid}
                      />
                      <DetailItem
                        label="พื้นที่รวม"
                        value={
                          customer.totalAreaRai
                            ? `${customer.totalAreaRai} ไร่`
                            : "-"
                        }
                        icon={MapPin}
                      />
                      <DetailItem
                        label="รอบปลูก/ปี"
                        value={
                          customer.harvestPerYear
                            ? `${customer.harvestPerYear} รอบ`
                            : "-"
                        }
                        icon={Calendar}
                      />
                    </div>
                  </div>

                  {/* Production Info */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg text-gray-700 border-l-4 border-orange-500 pl-3">
                      ข้อมูลการผลิต
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <DetailItem
                        label="พืชหลัก"
                        value={customer.cropTypes || "-"}
                        icon={Sprout}
                      />
                      <DetailItem
                        label="ผลผลิตปัจจุบัน"
                        value={customer.currentYield || "-"}
                        icon={Tractor}
                      />
                    </div>
                  </div>

                  {/* Commercial Info */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg text-gray-700 border-l-4 border-orange-500 pl-3">
                      ข้อมูลเชิงพาณิชย์
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailItem
                        label="เครดิต (วัน)"
                        value={customer.creditDays || "-"}
                        icon={Clock}
                      />
                      <DetailItem
                        label="มูลค่าเคมี/รอบ"
                        value={
                          customer.chemicalValuePerCycle
                            ? `${Number(
                              customer.chemicalValuePerCycle,
                            ).toLocaleString()} บาท`
                            : "-"
                        }
                        icon={Wallet}
                      />
                      <DetailItem
                        label="ปริมาณเคมี/รอบ"
                        value={customer.chemicalQtyPerCycle || "-"}
                        icon={FlaskConical}
                      />
                      <DetailItem
                        label="ร้านค้าประจำ"
                        value={customer.regularShops || "-"}
                        icon={Store}
                      />
                    </div>
                  </div>

                  {/* Service & Brands */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg text-gray-700 border-l-4 border-orange-500 pl-3">
                      บริการและสินค้า
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <DetailItem
                        label="บริการที่ให้"
                        value={customer.serviceTypes || "-"}
                        icon={Briefcase}
                      />
                      <DetailItem
                        label="ยี่ห้อที่ใช้"
                        value={customer.usedBrands || "-"}
                        icon={Tag}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section: Contact Person */}
          <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 pb-5">
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                ข้อมูลผู้ติดต่อ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <DetailItem
                label="ชื่อ-นามสกุล"
                value={
                  <span className="text-gray-900">
                    {[customer.prefix, customer.firstName, customer.lastName]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </span>
                }
                icon={User}
                className="col-span-full"
              />
              <DetailItem
                label="เบอร์โทรศัพท์ (ส่วนตัว)"
                value={
                  customer.contactPhone ? (
                    <a
                      href={`tel:${customer.contactPhone}`}
                      className="hover:text-blue-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                    >
                      {customer.contactPhone}
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon={Phone}
              />
              <DetailItem
                label="อีเมล (ส่วนตัว)"
                value={
                  customer.contactEmail ? (
                    <a
                      href={`mailto:${customer.contactEmail}`}
                      className="hover:text-blue-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                    >
                      {customer.contactEmail}
                    </a>
                  ) : (
                    "-"
                  )
                }
                icon={Mail}
              />
              <DetailItem
                label="วันเกิด / อายุ"
                value={
                  customer.birthDate ? (
                    <span className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1 rounded-lg font-semibold">
                      🎂{" "}
                      {new Date(customer.birthDate).toLocaleDateString(
                        "th-TH",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                      {age !== null && (
                        <span className="text-pink-600">({age} ปี)</span>
                      )}
                    </span>
                  ) : (
                    "-"
                  )
                }
                icon={Calendar}
              />
            </CardContent>
            {customer.contacts && customer.contacts.length > 0 && (
              <>
                <Separator className="bg-blue-100" />
                <CardContent className="p-8">
                  <h4 className="font-bold text-lg text-gray-700 mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full" />
                    ผู้ติดต่อเพิ่มเติม ({customer.contacts.length})
                  </h4>
                  <div className="space-y-6">
                    {customer.contacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                          <DetailItem
                            label="ชื่อ-นามสกุล"
                            value={
                              <span className="text-gray-900 font-medium">
                                {[contact.firstName, contact.lastName]
                                  .filter(Boolean)
                                  .join(" ") || "-"}
                              </span>
                            }
                            icon={User}
                            className="col-span-full"
                          />
                          <DetailItem
                            label="เบอร์โทรศัพท์"
                            value={
                              contact.phone ? (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="hover:text-blue-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                                >
                                  {contact.phone}
                                </a>
                              ) : (
                                "-"
                              )
                            }
                            icon={Phone}
                          />
                          <DetailItem
                            label="อีเมล"
                            value={
                              contact.email ? (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="hover:text-blue-600 underline-offset-4 hover:underline transition-colors inline-flex items-center gap-2"
                                >
                                  {contact.email}
                                </a>
                              ) : (
                                "-"
                              )
                            }
                            icon={Mail}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Section: Addresses */}
          <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 pb-5">
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                ที่อยู่และการจัดส่ง
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-full md:col-span-2">
                  <AddressBlock
                    title="ที่อยู่บริษัท"
                    icon={Building}
                    addressLine={customer.addressLine}
                    subdistrict={customer.subdistrict}
                    district={customer.district}
                    province={customer.province}
                    postalCode={customer.postalCode}
                    variant="blue"
                  />
                </div>

                <div className="h-full">
                  <AddressBlock
                    title="ที่อยู่วางบิล"
                    icon={FileText}
                    addressLine={customer.billingAddressLine}
                    subdistrict={customer.billingSubdistrict}
                    district={customer.billingDistrict}
                    province={customer.billingProvince}
                    postalCode={customer.billingPostalCode}
                    variant="purple"
                  />
                </div>

                <div className="h-full">
                  <AddressBlock
                    title="ที่อยู่จัดส่ง"
                    icon={Truck}
                    addressLine={customer.shippingAddressLine}
                    subdistrict={customer.shippingSubdistrict}
                    district={customer.shippingDistrict}
                    province={customer.shippingProvince}
                    postalCode={customer.shippingPostalCode}
                    variant="orange"
                  />
                </div>
              </div>

              {customer.addresses && customer.addresses.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-bold text-lg text-gray-700 mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full" />
                    ที่อยู่จัดส่งเพิ่มเติม ({customer.addresses.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customer.addresses.map((addr, idx) => (
                      <div key={idx} className="h-full">
                        <AddressBlock
                          title={`ที่อยู่จัดส่งสำรอง ${idx + 1}`}
                          icon={Truck}
                          addressLine={addr.addressLine}
                          subdistrict={addr.subdistrict}
                          district={addr.district}
                          province={addr.province}
                          postalCode={addr.postalCode}
                          variant="orange"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Images & Meta */}
        <div className="xl:col-span-4 order-1 xl:order-2 space-y-6 sm:space-y-8">
          {/* Images Gallery */}
          <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pt-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-gray-200 pb-5">
              <CardTitle className="text-xl font-bold flex items-center justify-between text-gray-800">
                <span className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  รูปภาพร้านค้า
                </span>
                <Badge className="bg-gradient-to-r from-rose-400 to-pink-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                  {customer.images?.length || 0} รูป
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customer.images && customer.images.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {customer.images.map((img, index) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className="relative group aspect-square rounded-2xl overflow-hidden cursor-zoom-in border-2 border-gray-200 bg-gray-100 hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:scale-[1.05]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || "Customer Image"}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          คลิกเพื่อดูขนาดเต็ม
                        </div>
                      </div>
                    ))}
                  </div>

                  <Dialog
                    open={selectedImageIndex !== null}
                    onOpenChange={(open) =>
                      !open && setSelectedImageIndex(null)
                    }
                  >
                    <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/20 backdrop-blur-md border-none shadow-none flex items-center justify-center outline-none [&>button]:hidden">
                      <DialogTitle className="sr-only">
                        Image Preview
                      </DialogTitle>

                      {selectedImageIndex !== null && customer.images && (
                        <div className="relative w-full h-full flex items-center justify-center px-full">
                          {/* Close Button */}
                          <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 hover:scale-110"
                          >
                            <X className="h-6 w-6" />
                          </button>

                          {/* Navigation Buttons */}
                          {customer.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevImage();
                                }}
                                className="absolute left-4 md:left-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 group hover:scale-110"
                              >
                                <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextImage();
                                }}
                                className="absolute right-4 md:right-8 z-50 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 group hover:scale-110"
                              >
                                <ChevronRight className="h-7 w-7 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </>
                          )}

                          {/* Main Image */}
                          <div
                            className="relative max-w-full max-h-full flex flex-col items-center overflow-hidden"
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDoubleClick={handleDoubleClick}
                            style={{
                              cursor:
                                zoom > 1
                                  ? isDragging
                                    ? "grabbing"
                                    : "grab"
                                  : "default",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customer.images[selectedImageIndex].url}
                              alt={
                                customer.images[selectedImageIndex].name ||
                                "Full Preview"
                              }
                              className="max-w-full max-h-[85vh] object-contain select-none transition-transform duration-200"
                              style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom
                                  }px, ${pan.y / zoom}px)`,
                                transformOrigin: "center center",
                              }}
                              draggable={false}
                            />

                            {/* Zoom Level Indicator */}
                            {zoom > 1 && (
                              <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20 shadow-2xl">
                                🔍 {Math.round(zoom * 100)}%
                              </div>
                            )}

                            {/* Instructions Overlay */}
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              🖱️ ล้อเมาส์เพื่อซูม • ลากเพื่อเลื่อน •
                              ดับเบิลคลิกเพื่อรีเซ็ต
                            </div>

                            {/* Image Counter Badge */}
                            <div className="mt-6 px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white text-base font-bold border border-white/20 shadow-2xl">
                              {selectedImageIndex + 1} /{" "}
                              {customer.images.length}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium text-gray-400">
                    ไม่มีรูปภาพ
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="p-0 gap-0 border-0 shadow-xl ring-1 ring-gray-200 overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 pb-5">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-amber-900">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg">
                  <FileText className="h-5 w-5" />
                </div>
                หมายเหตุ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customer.notes ? (
                <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap bg-gradient-to-br from-amber-50/50 to-yellow-50/50 p-5 rounded-2xl border-2 border-amber-200/60 font-medium">
                  {customer.notes}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 italic text-sm flex flex-col items-center gap-3">
                  <span className="text-3xl">📝</span>
                  ไม่มีบันทึกข้อความ
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
