"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";

type CreditLimit = {
  id: string;
  customerId: string;
  customer?: {
    name: string;
    customerCode: string;
  };
  limitAmount: number;
  usedAmount: number;
  availableAmount: number;
  status: string;
  effectiveDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "ใช้งาน", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  SUSPENDED: { label: "ระงับ", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  EXPIRED: { label: "หมดอายุ", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

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
    <div className="text-base font-normal text-foreground">
      {value}
    </div>
  </div>
);

export default function CreditLimitDetailPage() {
  const { creditLimitId } = useParams() as { creditLimitId: string };
  const { hasPermission, allowed, isLoading } = usePermission("menu.credit_limits");
  const canView = !isLoading && allowed;

  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/credit-limits/${creditLimitId}`);
        if (!res.ok) throw new Error("Failed to load credit limit");
        const json = await res.json();
        const src = (json && (json.creditLimit ?? json)) || null;
        if (mounted) setCreditLimit(src || null);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [creditLimitId]);

  if (!canView) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลวงเงินนี้</AlertDescription>
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
            ) : creditLimit ? (
              <div className="relative flex items-center justify-center min-h-10">
                <div className="flex flex-col space-y-1 text-center">
                  <span className="text-2xl font-semibold leading-none">
                    วงเงิน - {creditLimit.customer?.name}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({creditLimit.customer?.customerCode})
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xl font-semibold">ไม่พบข้อมูลวงเงิน</span>
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
          ) : creditLimit ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem 
                  label="วงเงิน" 
                  value={currencyFormatter.format(creditLimit.limitAmount)} 
                />
                <DetailItem 
                  label="ใช้ไป" 
                  value={currencyFormatter.format(creditLimit.usedAmount)} 
                />
                <DetailItem 
                  label="คงเหลือ" 
                  value={currencyFormatter.format(creditLimit.availableAmount)} 
                />
                <DetailItem
                  label="สถานะ"
                  value={(() => {
                    const s = (creditLimit.status ?? "").toUpperCase();
                    const info = statusMap[s];
                    if (!info) return <Badge variant="secondary">{creditLimit.status ?? "-"}</Badge>;
                    return <Badge className={info.className}>{info.label}</Badge>;
                  })()}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem
                  label="วันที่เริ่มใช้งาน"
                  value={creditLimit.effectiveDate ? new Date(creditLimit.effectiveDate).toLocaleDateString("th-TH") : "-"}
                />
                <DetailItem
                  label="วันหมดอายุ"
                  value={creditLimit.expiryDate ? new Date(creditLimit.expiryDate).toLocaleDateString("th-TH") : "-"}
                />
              </div>

              <Separator />

              <DetailItem label="หมายเหตุ" value={creditLimit.notes ?? "-"} />
              <DetailItem
                label="สร้างเมื่อ"
                value={creditLimit.createdAt ? new Date(creditLimit.createdAt).toLocaleString() : "-"}
              />
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>ไม่พบข้อมูลวงเงินที่ตรงกับ ID นี้</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
