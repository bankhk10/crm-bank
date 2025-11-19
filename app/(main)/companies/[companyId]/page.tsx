"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react"; // เพิ่มไอคอน
import { usePermission } from "@/hooks/use-permission";

// Type definition (เหมือนเดิม)
type Company = {
  id: string;
  name: string;
  shortName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

// ข้อมูลสถานะสำหรับการแสดงผล (ย้ายมาไว้ด้านนอกเพื่อความสะอาด)
const statusMap: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning";
    className?: string;
  }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    variant: "success", // สมมติว่าคุณมี variant: success ใน Badge
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    variant: "secondary",
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
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

// คอมโพเนนต์หลัก
export default function CompanyDetailPage() {
  const { companyId } = useParams() as { companyId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canView = !isLoading && allowed;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ส่วน fetch data (เหมือนเดิม)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${companyId}`);
        if (!res.ok) throw new Error("Failed to load company");
        const json = await res.json();
        const src = (json && (json.company ?? json)) || null;
        if (mounted) setCompany(src || null);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [companyId]);

  // การแสดงผลเมื่อไม่มีสิทธิ์ (ปรับปรุงให้ใช้ AlertTitle)
  if (!canView) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>
            คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทนี้
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // UI หลัก
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardHeader>
            <CardTitle>
              {loading ? (
                // Skeleton loader for the title area
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              ) : company ? (
                <div className="relative flex items-center justify-center min-h-[40px]">
                  <div className="flex flex-col space-y-1 text-center">
                    <span className="text-2xl font-semibold leading-none">
                      {company.name}
                    </span>
                    {company.shortName && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({company.shortName})
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xl font-semibold">ไม่พบข้อมูลบริษัท</span>
              )}
            </CardTitle>
          </CardHeader>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-12 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-12 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-12 w-1/3 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : company ? (
            <>
              {/* --- รายละเอียดทั่วไป --- */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem label="อีเมล" value={company.email ?? "-"} />
                <DetailItem label="โทรศัพท์" value={company.phone ?? "-"} />
                <DetailItem
                  label="เลขประจำตัวผู้เสียภาษี"
                  value={company.taxId ?? "-"}
                />
                <DetailItem
                  label="สถานะ"
                  value={(() => {
                    const s = (company.status ?? "").toUpperCase();
                    const info = statusMap[s];
                    if (!info)
                      return (
                        <Badge variant="secondary">
                          {company.status ?? "-"}
                        </Badge>
                      );

                    return (
                      <Badge
                        variant={info.variant as any} // ใช้ as any ถ้าไม่มี variant success ใน Badge ของคุณ
                        className={info.className}
                      >
                        {info.label}
                      </Badge>
                    );
                  })()}
                />
              </div>
              <Separator /> {/* เส้นแบ่งส่วน */}
              {/* --- รายละเอียดที่อยู่และเวลา --- */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem
                  label="ที่อยู่"
                  className="sm:col-span-2"
                  value={
                    company.addressLine ||
                    company.subdistrict ||
                    company.district ||
                    company.province ||
                    company.postalCode ? (
                      <div>
                        {company.addressLine && (
                          <div>{company.addressLine}</div>
                        )}
                        <div className="text-sm text-muted-foreground mt-1">
                          {[
                            company.subdistrict,
                            company.district,
                            company.province,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          {company.postalCode ? ` ${company.postalCode}` : ""}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )
                  }
                />

                <DetailItem
                  label="สร้างเมื่อ"
                  value={
                    company.createdAt
                      ? new Date(company.createdAt).toLocaleString()
                      : "-"
                  }
                />
                {/* สามารถเพิ่มข้อมูลอื่น ๆ เช่น 'อัปเดตล่าสุดเมื่อ' ที่นี่ได้ */}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>ไม่พบข้อมูลบริษัทที่ตรงกับ ID นี้</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
