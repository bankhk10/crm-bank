"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertTriangle, Pencil, ArrowLeft } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";

type EmployeeDetail = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  company?: { id: string; name?: string | null } | null;
  manager?: { id: string; name?: string | null } | null;
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({
  label,
  value,
  className,
}) => (
  <div className={className}>
    <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-1">{label}</p>
    <div className="text-base font-normal text-foreground wrap-break-word">{value}</div>
  </div>
);

export default function EmployeeDetailPage() {
  const { employeeId } = useParams() as { employeeId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.employees");
  const canView = !isLoading && allowed;

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employee/${employeeId}`);
        if (!res.ok) throw new Error("Failed to load employee");
        const json = await res.json();
        const src = (json && (json.employee ?? json)) || null;
        if (mounted) setEmployee(src);
      } catch (e: any) {
        if (mounted) setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  if (!canView) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลพนักงานนี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push(`/employee`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {loading ? (
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                ) : employee ? (
                  <div className="text-lg font-semibold">{employee.name}</div>
                ) : (
                  <div className="text-lg font-semibold">ไม่พบข้อมูลพนักงาน</div>
                )}
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {!loading && employee && (
                <Link href={`/employee/${employee.id}/edit`}>
                  <Button size="sm">
                    <Pencil className="h-4 w-4" /> แก้ไข
                  </Button>
                </Link>
              )}
            </div>
          </div>
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
          ) : employee ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem label="อีเมล" value={employee.email ?? "-"} />
                <DetailItem label="โทรศัพท์" value={employee.phone ?? "-"} />
                <DetailItem label="ตำแหน่ง / บทบาท" value={employee.role ?? "-"} />
                <DetailItem label="บริษัท" value={employee.company ? <Link href={`/companies/${employee.company.id}`} className="underline">{employee.company.name}</Link> : "-"} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <DetailItem label="ผู้จัดการ" value={employee.manager?.name ?? "-"} />
                <DetailItem label="ID" value={employee.id} />
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>ไม่พบข้อมูลพนักงานที่ตรงกับ ID นี้</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
