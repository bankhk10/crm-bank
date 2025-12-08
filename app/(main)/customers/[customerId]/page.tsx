"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertTriangle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";

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
  ACTIVE: { label: "ใช้งาน", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  INACTIVE: { label: "ไม่ได้ใช้งาน", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  SUSPENDED: { label: "ระงับ", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
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
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className }) => (
  <div className={className}>
    <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-1">
      {label}
    </p>
    <div className="text-base font-normal text-foreground break-words">
      {value}
    </div>
  </div>
);

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
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้านี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? (
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
            ) : customer ? (
              <div className="relative flex items-center justify-center min-h-[40px]">
                <div className="flex flex-col space-y-1 text-center">
                  <span className="text-2xl font-semibold leading-none">
                    {customer.name}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({customer.customerCode})
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xl font-semibold">ไม่พบข้อมูลลูกค้า</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ข้อผิดพลาดในการโหลดข้อมูล</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ) : customer ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem 
                  label="ประเภทลูกค้า" 
                  value={customerTypeMap[customer.customerType] || customer.customerType} 
                />
                <DetailItem
                  label="สถานะ"
                  value={(() => {
                    const s = (customer.status ?? "").toUpperCase();
                    const info = statusMap[s];
                    if (!info) return <Badge variant="secondary">{customer.status ?? "-"}</Badge>;
                    return <Badge className={info.className}>{info.label}</Badge>;
                  })()}
                />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">ข้อมูลทั่วไป</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem label="คำนำหน้า" value={customer.prefix ?? "-"} />
                <DetailItem label="ชื่อ" value={customer.firstName ?? "-"} />
                <DetailItem label="นามสกุล" value={customer.lastName ?? "-"} />
                <DetailItem label="อีเมล" value={customer.email ?? "-"} />
                <DetailItem label="โทรศัพท์" value={customer.phone ?? "-"} />
                <DetailItem label="เลขประจำตัวผู้เสียภาษี" value={customer.taxId ?? "-"} />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">ที่อยู่</h3>
              <div className="grid grid-cols-1 gap-6">
                <DetailItem
                  label="ที่อยู่"
                  className="sm:col-span-2"
                  value={
                    customer.addressLine || customer.subdistrict || customer.district || customer.province || customer.postalCode ? (
                      <div>
                        {customer.addressLine && <div>{customer.addressLine}</div>}
                        <div className="text-sm text-muted-foreground mt-1">
                          {[customer.subdistrict, customer.district, customer.province]
                            .filter(Boolean)
                            .join(", ")}
                          {customer.postalCode ? ` ${customer.postalCode}` : ""}
                        </div>
                      </div>
                    ) : "-"
                  }
                />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">ที่อยู่วางบิล</h3>
              <div className="grid grid-cols-1 gap-6">
                <DetailItem
                  label="ที่อยู่วางบิล"
                  className="sm:col-span-2"
                  value={
                    customer.billingAddressLine || customer.billingSubdistrict || customer.billingDistrict || customer.billingProvince || customer.billingPostalCode ? (
                      <div>
                        {customer.billingAddressLine && <div>{customer.billingAddressLine}</div>}
                        <div className="text-sm text-muted-foreground mt-1">
                          {[customer.billingSubdistrict, customer.billingDistrict, customer.billingProvince]
                            .filter(Boolean)
                            .join(", ")}
                          {customer.billingPostalCode ? ` ${customer.billingPostalCode}` : ""}
                        </div>
                      </div>
                    ) : "-"
                  }
                />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">ที่อยู่จัดส่ง</h3>
              <div className="grid grid-cols-1 gap-6">
                <DetailItem
                  label="ที่อยู่จัดส่ง"
                  className="sm:col-span-2"
                  value={
                    customer.shippingAddressLine || customer.shippingSubdistrict || customer.shippingDistrict || customer.shippingProvince || customer.shippingPostalCode ? (
                      <div>
                        {customer.shippingAddressLine && <div>{customer.shippingAddressLine}</div>}
                        <div className="text-sm text-muted-foreground mt-1">
                          {[customer.shippingSubdistrict, customer.shippingDistrict, customer.shippingProvince]
                            .filter(Boolean)
                            .join(", ")}
                          {customer.shippingPostalCode ? ` ${customer.shippingPostalCode}` : ""}
                        </div>
                      </div>
                    ) : "-"
                  }
                />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">ผู้ติดต่อ</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem label="ชื่อผู้ติดต่อ" value={customer.contactPerson ?? "-"} />
                <DetailItem label="โทรศัพท์ผู้ติดต่อ" value={customer.contactPhone ?? "-"} />
                <DetailItem label="อีเมลผู้ติดต่อ" value={customer.contactEmail ?? "-"} className="sm:col-span-2" />
              </div>

              <Separator />

              <DetailItem label="หมายเหตุ" value={customer.notes ?? "-"} />
              <DetailItem
                label="สร้างเมื่อ"
                value={customer.createdAt ? new Date(customer.createdAt).toLocaleString() : "-"}
              />
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>ไม่พบข้อมูลลูกค้าที่ตรงกับ ID นี้</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
