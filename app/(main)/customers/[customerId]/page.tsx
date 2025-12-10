"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  FileText,
  CreditCard,
  Truck
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";

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
};

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "ใช้งาน", className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  INACTIVE: { label: "ไม่ได้ใช้งาน", className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200" },
  SUSPENDED: { label: "ระงับ", className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
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
  <div className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm ${fullWidth ? "col-span-full" : ""} ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <p className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
    </div>
    <div className="text-base font-semibold text-foreground break-words pl-6">
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
}> = ({ title, icon: Icon, addressLine, subdistrict, district, province, postalCode }) => {
  const hasAddress = addressLine || subdistrict || district || province || postalCode;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAddress ? (
          <div className="space-y-1 text-sm">
            {addressLine && <p className="font-medium">{addressLine}</p>}
            <p className="text-muted-foreground">
              {[subdistrict, district, province]
                .filter(Boolean)
                .join(" / ")}
            </p>
            {postalCode && <p className="text-muted-foreground">{postalCode}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">ไม่มีข้อมูลที่อยู่</p>
        )}
      </CardContent>
    </Card>
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
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้านี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] lg:col-span-2" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px] lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">ไม่พบข้อมูลลูกค้า</h2>
        <p className="text-muted-foreground">รหัสลูกค้า: {customerId}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
      </div>
    );
  }

  const statusInfo = customer.status ? statusMap[customer.status.toUpperCase()] : null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ลูกค้าทั้งหมด
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{customer.name}</h1>
            {statusInfo ? (
              <Badge variant="outline" className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
            ) : (
              <Badge variant="secondary">{customer.status ?? "-"}</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <Building className="h-3 w-3" /> {customer.customerCode}
            <span className="text-gray-300">•</span>
            <span className="font-medium text-foreground">
              {customerTypeMap[customer.customerType] || customer.customerType}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`./${customerId}/edit`}> {/* Relative path to edit */}
              <Pencil className="mr-2 h-4 w-4" />
              แก้ไขข้อมูล
            </Link>
          </Button>
          {/* Add Delete button logic here if needed, consistent with permissions */}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Key Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                ข้อมูลทั่วไป
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="คำนำหน้า" value={customer.prefix || "-"} icon={User} />
              <DetailItem label="ชื่อ-นามสกุล" value={`${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-"} icon={User} />
              <DetailItem label="อีเมล" value={customer.email || "-"} icon={Mail} />
              <DetailItem label="เบอร์โทรศัพท์" value={customer.phone || "-"} icon={Phone} />
              <DetailItem label="เลขผู้เสียภาษี" value={customer.taxId || "-"} icon={FileText} className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                ผู้ติดต่อ
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="ชื่อผู้ติดต่อ" value={customer.contactPerson || "-"} icon={User} />
              <DetailItem label="เบอร์โทรศัพท์" value={customer.contactPhone || "-"} icon={Phone} />
              <DetailItem label="อีเมล" value={customer.contactEmail || "-"} icon={Mail} className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                หมายเหตุ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {customer.notes || "ไม่มีหมายเหตุ"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Addresses & Meta */}
        <div className="space-y-6">
          {/* Addresses */}
          <div className="space-y-4">
            <AddressBlock
              title="ที่อยู่จดทะเบียน"
              icon={MapPin}
              addressLine={customer.addressLine}
              subdistrict={customer.subdistrict}
              district={customer.district}
              province={customer.province}
              postalCode={customer.postalCode}
            />
            <AddressBlock
              title="ที่อยู่วางบิล"
              icon={FileText}
              addressLine={customer.billingAddressLine}
              subdistrict={customer.billingSubdistrict}
              district={customer.billingDistrict}
              province={customer.billingProvince}
              postalCode={customer.billingPostalCode}
            />
            <AddressBlock
              title="ที่อยู่จัดส่ง"
              icon={Truck}
              addressLine={customer.shippingAddressLine}
              subdistrict={customer.shippingSubdistrict}
              district={customer.shippingDistrict}
              province={customer.shippingProvince}
              postalCode={customer.shippingPostalCode}
            />
          </div>

          {/* Metadata */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">สร้างเมื่อ</span>
                <span className="font-medium">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("th-TH", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
