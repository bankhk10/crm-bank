"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  FileText,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";

// Type definition
type Company = {
  id: string;
  name: string;
  companyCode?: string | null;
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

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd className="text-base text-gray-900 font-medium break-words">
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { companyId } = useParams() as { companyId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canView = !isLoading && allowed;
  const canEdit = hasPermission("company.edit");
  const canDelete = hasPermission("company.delete");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!company) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("ไม่สามารถลบข้อมูลบริษัทได้");
      router.push("/companies");
      router.refresh();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
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

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container max-w-4xl mx-auto p-6 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ไม่พบข้อมูล</AlertTitle>
          <AlertDescription>ไม่พบข้อมูลบริษัทที่คุณค้นหา</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          กลับหน้ารายการ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <Link
              href="/companies"
              className="inline-flex items-center text-blue-100 hover:text-white mb-2 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              กลับไปหน้ารายการบริษัท
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-8 w-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {company.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                {company.companyCode && (
                  <div className="flex items-center gap-2">
                    <span>รหัสบริษัท: {company.companyCode}</span>
                  </div>
                )}
                {company.shortName && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>ชื่อย่อ: {company.shortName}</span>
                  </div>
                )}
                {company.status === "ACTIVE" ? (
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-300" />
                    <span className="text-green-100">ใช้งาน</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-500/20 px-3 py-1 rounded-full">
                    <XCircle className="h-4 w-4 text-gray-300" />
                    <span className="text-gray-100">ไม่ใช้งาน</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-blue-300">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                ข้อมูลทั่วไป
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<Hash className="h-5 w-5" />}
                label="เลขประจำตัวผู้เสียภาษี"
                value={company.taxId}
              />
              <DetailItem
                icon={<Calendar className="h-5 w-5" />}
                label="วันที่สร้างข้อมูล"
                value={
                  company.createdAt
                    ? new Date(company.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"
                }
              />
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-purple-300">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Phone className="h-6 w-6 text-purple-600" />
                ข้อมูลการติดต่อ
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<Mail className="h-5 w-5" />}
                label="อีเมล"
                value={company.email}
              />
              <DetailItem
                icon={<Phone className="h-5 w-5" />}
                label="เบอร์โทรศัพท์"
                value={company.phone}
              />
            </div>
          </div>

          {/* Address Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 lg:col-span-2">
            <div className="p-6 border-b border-gray-100 bg-emerald-300">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-emerald-600" />
                ที่อยู่
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<MapPin className="h-5 w-5 mt-1" />}
                label=""
                value={
                  company.addressLine ||
                  company.subdistrict ||
                  company.district ||
                  company.province ||
                  company.postalCode ? (
                    <span>
                      {company.addressLine && `${company.addressLine} `}
                      {[
                        company.subdistrict && `ต.${company.subdistrict}`,
                        company.district && `อ.${company.district}`,
                        company.province && `จ.${company.province}`,
                        company.postalCode && `${company.postalCode}`,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>ยืนยันการลบข้อมูล</DialogTitle>
          <DialogDescription>
            คุณต้องการลบบริษัท <strong>{company.name}</strong> ใช่หรือไม่?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบข้อมูล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
