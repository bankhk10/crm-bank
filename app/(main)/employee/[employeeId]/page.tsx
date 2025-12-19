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
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Hash,
  FileText,
  UserCheck,
  Pencil,
  Trash2,
  AlertTriangle,
  BadgeCheck,
  MapPin,
  Calendar,
  Layers,
  Map,
  CheckCircle2,
  XCircle,
  Clock,
  Cake,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";

// Type definition matches Prisma Employee model fields + relations
type EmployeeDetail = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  company?: { id: string; name?: string | null } | null;
  manager?: { id: string; name?: string | null } | null;

  // Extended fields
  employeeCode?: string | null;
  birthDate?: string | null; // JSON date string
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  responsibilityArea?: string | null;
  status?: string | null;
  positionTitle?: string | null;
  departmentName?: string | null;
  department?: { id: string; name?: string | null } | null; // Relation
  roleTitle?: string | null;
  createdAt?: string | null;
};

function DetailItem({
  icon,
  label,
  value,
  fullWidth = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 py-3 border-b border-gray-100 last:border-0",
        fullWidth && "col-span-full"
      )}
    >
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

export default function EmployeeDetailPage() {
  const { employeeId } = useParams() as { employeeId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.employees");
  const canView = !isLoading && allowed;
  const canEdit = hasPermission("employee.edit");
  const canDelete = hasPermission("employee.delete");

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!employee) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employee/${employeeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("ไม่สามารถลบข้อมูลพนักงานได้");
      router.push("/employee");
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
            คุณไม่มีสิทธิ์เปิดดูข้อมูลพนักงานนี้
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

  if (!employee) {
    return (
      <div className="container max-w-4xl mx-auto p-6 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ไม่พบข้อมูล</AlertTitle>
          <AlertDescription>ไม่พบข้อมูลพนักงานที่คุณค้นหา</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/employee")}
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
              href="/employee"
              className="inline-flex items-center text-blue-100 hover:text-white mb-2 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              กลับไปหน้ารายการพนักงาน
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {employee.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                {employee.employeeCode && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    <BadgeCheck className="h-4 w-4" />
                    <span>{employee.employeeCode}</span>
                  </div>
                )}
                {employee.positionTitle && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    <Briefcase className="h-4 w-4" />
                    <span>{employee.positionTitle}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 opacity-90">
                  {employee.status === "ACTIVE" || !employee.status ? (
                    <span className="flex items-center gap-1 text-green-300">
                      <CheckCircle2 className="h-4 w-4" /> ใช้งาน
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <XCircle className="h-4 w-4" /> {employee.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-blue-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                ข้อมูลส่วนตัว
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<Mail className="h-5 w-5" />}
                label="อีเมล"
                value={employee.email}
              />
              <DetailItem
                icon={<Phone className="h-5 w-5" />}
                label="เบอร์โทรศัพท์"
                value={employee.phone}
              />
              <DetailItem
                icon={<Cake className="h-5 w-5" />}
                label="วันเกิด"
                value={
                  employee.birthDate
                    ? new Date(employee.birthDate).toLocaleDateString("th-TH")
                    : "-"
                }
              />
            </div>
          </div>

          {/* Work / Organization Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-purple-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-purple-600" />
                ข้อมูลการทำงาน
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<Building2 className="h-5 w-5" />}
                label="สังกัดบริษัท"
                value={
                  employee.company ? (
                    <Link
                      href={`/companies/${employee.company.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {employee.company.name}
                    </Link>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailItem
                icon={<Layers className="h-5 w-5" />}
                label="แผนก"
                value={employee.department?.name || "-"}
              />
              <DetailItem
                icon={<Briefcase className="h-5 w-5" />}
                label="ตำแหน่ง"
                value={` ${employee.roleTitle || employee.role || "-"}`}
              />
              <DetailItem
                icon={<Map className="h-5 w-5" />}
                label="เขตความรับผิดชอบ"
                value={employee.responsibilityArea}
              />
            </div>
          </div>

          {/* Address Information Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 lg:col-span-2">
            <div className="p-6 border-b border-gray-100 bg-emerald-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-emerald-600" />
                ที่อยู่ติดต่อ
              </h2>
            </div>
            <div className="p-6">
              <DetailItem
                icon={<MapPin className="h-5 w-5 mt-1" />}
                label=""
                fullWidth
                value={
                  employee.addressLine ||
                  employee.subdistrict ||
                  employee.district ||
                  employee.province ||
                  employee.postalCode ? (
                    <span className="leading-relaxed">
                      {employee.addressLine && `${employee.addressLine} `}
                      {[
                        employee.subdistrict && `ต.${employee.subdistrict}`,
                        employee.district && `อ.${employee.district}`,
                        employee.province && `จ.${employee.province}`,
                        employee.postalCode && `${employee.postalCode}`,
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
            คุณต้องการลบพนักงาน <strong>{employee.name}</strong> ใช่หรือไม่?
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
