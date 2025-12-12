"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
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
  Navigation
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

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
  // New fields
  latitude?: string | null;
  longitude?: string | null;
  relationshipScore?: number | null;
  birthDate?: string | null;
  responsibleEmployee?: { id: string; firstName: string; lastName: string; email: string } | null;
  parentDealer?: { id: string; name: string } | null;
  images?: Array<{ id: string; url: string; name?: string }>;
};

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "ใช้งาน", className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200" },
  INACTIVE: { label: "ไม่ได้ใช้งาน", className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200" },
  SUSPENDED: { label: "ระงับ", className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
};

const customerTypeMap: Record<string, string> = {
  DEALER: "ตัวแทนจำหน่าย",
  SUBDEALER: "ตัวแทนจำหน่ายย่อย",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  fullWidth?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon, className, fullWidth }) => (
  <div className={`flex flex-col gap-1 ${fullWidth ? "col-span-full" : ""} ${className}`}>
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
    <div className="text-base text-gray-900 font-medium break-words pl-5">
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
}> = ({ title, icon: Icon, addressLine, subdistrict, district, province, postalCode, variant = "blue" }) => {
  const hasAddress = addressLine || subdistrict || district || province || postalCode;

  const colors = {
    blue: "bg-blue-50/50 border-blue-100 text-blue-900",
    orange: "bg-orange-50/50 border-orange-100 text-orange-900",
    purple: "bg-purple-50/50 border-purple-100 text-purple-900",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[variant]} h-full transition-shadow hover:shadow-sm`}>
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg bg-white/60 shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
        {title}
      </h3>
      <div className="pl-9 space-y-1 text-sm/relaxed">
        {hasAddress ? (
          <>
            {addressLine && <div className="font-medium">{addressLine}</div>}
            <div className="text-gray-600">
              {[subdistrict, district, province, postalCode]
                .filter(Boolean)
                .join(" / ")}
            </div>
          </>
        ) : (
          <div className="text-gray-400 italic">ไม่มีข้อมูลที่อยู่</div>
        )}
      </div>
    </div>
  );
};

export default function CustomerDetailPage() {
  const { customerId } = useParams() as { customerId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.customers");
  const canView = !isLoading && allowed;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleNextImage = () => {
    if (selectedImageIndex === null || !customer?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null ? null : (prev + 1) % customer.images!.length
    );
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !customer?.images) return;
    setSelectedImageIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + customer.images!.length) % customer.images!.length
    );
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
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้านี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-full bg-gray-100 p-8 shadow-inner">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">ไม่พบข้อมูลลูกค้า</h2>
          <p className="text-gray-500">รหัสลูกค้า: {customerId}</p>
        </div>
        <Button variant="outline" className="rounded-full px-8" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
      </div>
    );
  }

  const statusInfo = customer.status ? statusMap[customer.status.toUpperCase()] : null;
  const age = customer.birthDate
    ? Math.floor((Date.now() - new Date(customer.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
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
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">

      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="rounded-full pl-2 pr-4 hover:bg-gray-100 text-gray-600" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-1" />
          ย้อนกลับ
        </Button>
      </div>

      {/* Hero Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1">
                {customerTypeMap[customer.customerType] || customer.customerType}
              </Badge>
              {statusInfo && (
                <Badge variant="outline" className={`${statusInfo.className} bg-white/90 border-0`}>
                  {statusInfo.label}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
              {customer.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-blue-100 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-lg"><Building className="h-4 w-4" /></div>
                {customer.customerCode}
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></div>
                {customer.province || "ไม่ระบุจังหวัด"}
              </div>
              {customer.responsibleEmployee && (
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 p-1.5 rounded-lg"><UserCheck className="h-4 w-4" /></div>
                  <span className="opacity-80">ผู้ดูแล:</span>
                  <span className="font-medium text-white">{customer.responsibleEmployee.firstName} {customer.responsibleEmployee.lastName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {customer.latitude && customer.longitude && (
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm shadow-sm"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`, '_blank')}
              >
                <Navigation className="mr-2 h-4 w-4" />
                เปิดแผนที่
              </Button>
            )}
            <Button className="bg-white text-blue-900 hover:bg-blue-50 border-0 shadow-lg font-semibold" asChild>
              <Link href={`./${customerId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                แก้ไขข้อมูล
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column: Info & Contact */}
        <div className="xl:col-span-8 space-y-8">

          {/* Section: Company Info */}
          <Card className="border-0 shadow-md ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <Building className="h-5 w-5 text-indigo-500" />
                ข้อมูลบริษัท
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailItem label="ชื่อบริษัท / ร้านค้า" value={customer.name} icon={Building} className="col-span-full" />
              <DetailItem label="เลขผู้เสียภาษี" value={customer.taxId || "-"} icon={FileText} />
              <DetailItem label="เบอร์โทรศัพท์ (องค์กร)" value={customer.phone ? <a href={`tel:${customer.phone}`} className="hover:text-indigo-600 underline-offset-4 hover:underline">{customer.phone}</a> : "-"} icon={Phone} />
              <DetailItem label="อีเมล (องค์กร)" value={customer.email ? <a href={`mailto:${customer.email}`} className="hover:text-indigo-600 underline-offset-4 hover:underline">{customer.email}</a> : "-"} icon={Mail} />
              <DetailItem
                label="ความสัมพันธ์"
                value={
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${relationshipColor}`}>{relationshipLevel}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${customer.relationshipScore && customer.relationshipScore >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                }
                icon={Star}
              />
              {customer.parentDealer && (
                <DetailItem label="ร้านค้าหลัก (Parent Dealer)" value={customer.parentDealer.name} icon={Building} />
              )}
            </CardContent>
          </Card>

          {/* Section: Contact Person */}
          <Card className="border-0 shadow-md ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-indigo-500" />
                ข้อมูลผู้ติดต่อ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailItem label="ชื่อ-นามสกุล" value={[customer.prefix, customer.firstName, customer.lastName].filter(Boolean).join(" ") || "-"} icon={User} className="col-span-full" />
              <DetailItem label="เบอร์โทรศัพท์ (ส่วนตัว)" value={customer.contactPhone ? <a href={`tel:${customer.contactPhone}`} className="hover:text-indigo-600 underline-offset-4 hover:underline">{customer.contactPhone}</a> : "-"} icon={Phone} />
              <DetailItem label="อีเมล (ส่วนตัว)" value={customer.contactEmail ? <a href={`mailto:${customer.contactEmail}`} className="hover:text-indigo-600 underline-offset-4 hover:underline">{customer.contactEmail}</a> : "-"} icon={Mail} />
              <DetailItem
                label="วันเกิด / อายุ"
                value={customer.birthDate
                  ? `${new Date(customer.birthDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} ${age !== null ? `(${age} ปี)` : ""}`
                  : "-"
                }
                icon={Calendar}
              />
            </CardContent>
          </Card>

          {/* Section: Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" />
                ที่อยู่และการจัดส่ง
              </h3>
            </div>

            <div className="h-full">
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

            <div className="h-full md:col-span-2">
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
        </div>

        {/* Right Column: Images & Meta */}
        <div className="xl:col-span-4 space-y-8">

          {/* Images Gallery */}
          <Card className="border-0 shadow-md ring-1 ring-gray-100 overflow-hidden text-center sm:text-left">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center justify-between text-gray-800">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-500" />
                  รูปภาพร้านค้า
                </span>
                <span className="text-xs font-normal text-muted-foreground bg-gray-200 px-2 py-0.5 rounded-full">
                  {customer.images?.length || 0} รูป
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customer.images && customer.images.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {customer.images.map((img, index) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className="relative group aspect-square rounded-xl overflow-hidden cursor-zoom-in border bg-gray-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || "Customer Image"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>

                  <Dialog
                    open={selectedImageIndex !== null}
                    onOpenChange={(open) => !open && setSelectedImageIndex(null)}
                  >
                    <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center outline-none [&>button]:hidden">
                      <DialogTitle className="sr-only">Image Preview</DialogTitle>

                      {selectedImageIndex !== null && customer.images && (
                        <div className="relative w-full h-full flex items-center justify-center px-14 md:px-24">
                          {/* Close Button */}
                          <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
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
                                className="absolute left-2 md:left-4 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm border border-white/10 group"
                              >
                                <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextImage();
                                }}
                                className="absolute right-2 md:right-4 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm border border-white/10 group"
                              >
                                <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </>
                          )}

                          {/* Main Image */}
                          <div className="relative max-w-full max-h-full flex flex-col items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customer.images[selectedImageIndex].url}
                              alt={customer.images[selectedImageIndex].name || "Full Preview"}
                              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            />

                            {/* Image Counter Badge */}
                            <div className="mt-4 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-sm font-medium">
                              {selectedImageIndex + 1} / {customer.images.length}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">ไม่มีรูปภาพ</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-0 shadow-md ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-900">
                <FileText className="h-5 w-5 text-amber-600" />
                หมายเหตุ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customer.notes ? (
                <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                  {customer.notes}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 italic text-sm">ไม่มีบันทึกข้อความ</div>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span>รหัสอ้างอิง:</span>
              <span className="font-mono">{customer.id}</span>
            </div>
            <div className="flex justify-between">
              <span>สร้างเมื่อ:</span>
              <span>
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("th-TH", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
