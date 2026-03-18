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
    AlertTriangle,
    BadgeCheck,
    MapPin,
    Layers,
    Map,
    CheckCircle2,
    XCircle,
    Cake,
    Store,
    ExternalLink,
    Search,
    FileText,
    Pencil,
    Trash2,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";
import type { EmployeeDetail } from "../../types";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailHero } from "@/components/custom/detail-hero";


// ─── Reusable Section Header ─────────────────────────────────────────────


export default function EmployeeDetailView() {
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
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = employee?.responsibleCustomers?.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.province?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const { getEmployeeAction } = await import("@/modules/employee/server/actions");
                const res = await getEmployeeAction(employeeId);
                if (!res.success) throw new Error("Failed to load employee");
                const src: any = ("employee" in res ? res.employee : null) || null;
                if (src && src.birthDate instanceof Date) {
                    src.birthDate = src.birthDate.toISOString();
                }
                if (mounted) setEmployee(src as EmployeeDetail);
            } catch (e: any) {
                if (mounted) setError(String(e?.message ?? e));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [employeeId]);

    const handleDelete = async () => {
        if (!employee) return;
        setDeleting(true);
        try {
            const { deleteEmployeeAction } = await import("@/modules/employee/server/actions");
            const res = await deleteEmployeeAction(employeeId);
            if (!res.success) throw new Error("ไม่สามารถลบข้อมูลพนักงานได้");
            router.push("/employee");
            router.refresh();
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    // ─── Loading State ───────────────────────────────────────────────────────
    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center space-y-4">
                    <div className="relative mx-auto w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-[#B91C1C] animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400 tracking-wide">กำลังโหลดข้อมูล...</p>
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
                    <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลพนักงานนี้</AlertDescription>
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
                    className="mt-4 border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C] hover:text-white transition-colors"
                    onClick={() => router.push("/employee")}
                >
                    กลับหน้ารายการ
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* ── Hero Header ──────────────────────────────────────────────── */}
            <DetailHero
                backUrl="/employee"
                backLabel="หน้ารายการพนักงาน"
                title={employee.name || ""}
                icon={<User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
                accentColor="#B91C1C"
                badges={
                    <>
                        {employee.employeeCode && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                <BadgeCheck className="h-3.5 w-3.5 text-[#F87171]" />
                                {employee.employeeCode}
                            </span>
                        )}
                        {employee.positionTitle && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                                <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                                {employee.positionTitle}
                            </span>
                        )}
                        {employee.status === "ACTIVE" || !employee.status ? (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                ใช้งาน
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                                <XCircle className="h-3.5 w-3.5" />
                                {employee.status}
                            </span>
                        )}
                    </>
                }
                actions={
                    <>
                        {canEdit && (
                            <Button
                                size="sm"
                                className="h-10 px-6 text-xs font-semibold 
                                bg-white/10 hover:bg-white/20 
                                text-white border border-white/10 
                                rounded-xl backdrop-blur-md
                                transition-all active:scale-[0.98]"
                                onClick={() => router.push(`/employee/${employeeId}/edit`)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                แก้ไขข้อมูล
                            </Button>
                        )}

                        {canDelete && (
                            <Button
                                size="sm"
                                className="h-10 px-6 text-xs font-semibold 
                                bg-red-600 hover:bg-red-700 
                                text-white border-0 
                                rounded-xl shadow-lg shadow-red-900/30
                                transition-all active:scale-[0.98]"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบ
                            </Button>
                        )}
                    </>
                }
            />


            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Personal Info ──────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="ข้อมูลส่วนตัว"
                        />
                        <div className="p-6 space-y-1 divide-y divide-gray-50">
                            <DetailItem
                                icon={<Mail className="h-4 w-4 text-gray-400" />}
                                label="อีเมล"
                                value={employee.email}
                            />
                            <DetailItem
                                icon={<Phone className="h-4 w-4 text-gray-400" />}
                                label="เบอร์โทรศัพท์"
                                value={employee.phone}
                            />
                            <DetailItem
                                icon={<Cake className="h-4 w-4 text-gray-400" />}
                                label="วันเกิด"
                                value={
                                    employee.birthDate
                                        ? new Date(employee.birthDate).toLocaleDateString("th-TH")
                                        : "-"
                                }
                            />
                        </div>
                    </div>

                    {/* ── Work Info ─────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<Building2 className="h-6 w-6" />}
                            title="ข้อมูลการทำงาน"
                            variant="dark"
                        />
                        <div className="p-6 space-y-1 divide-y divide-gray-50">
                            <DetailItem
                                icon={<Building2 className="h-4 w-4 text-gray-400" />}
                                label="สังกัดบริษัท"
                                value={
                                    employee.company ? (
                                        <Link
                                            href={`/companies/${employee.company.id}`}
                                            className="text-[#B91C1C] hover:text-[#991B1B] font-medium underline-offset-2 hover:underline transition-colors"
                                        >
                                            {employee.company.name}
                                        </Link>
                                    ) : "-"
                                }
                            />
                            <DetailItem
                                icon={<Layers className="h-4 w-4 text-gray-400" />}
                                label="แผนก"
                                value={employee.department?.name || "-"}
                            />
                            <DetailItem
                                icon={<Briefcase className="h-4 w-4 text-gray-400" />}
                                label="ตำแหน่ง"
                                value={employee.roleTitle || employee.role || "-"}
                            />
                            <DetailItem
                                icon={<Map className="h-4 w-4 text-gray-400" />}
                                label="เขตความรับผิดชอบ"
                                value={employee.responsibilityArea}
                            />
                        </div>
                    </div>

                    {/* ── Signature ─────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="ลายเซ็น"
                        />
                        <div className="p-6 flex items-center justify-center min-h-[140px] bg-gray-50/60">
                            {employee.signature ? (
                                <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-white">
                                    <img
                                        src={employee.signature}
                                        alt="ลายเซ็นพนักงาน"
                                        className="max-h-28 w-auto object-contain"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">ยังไม่มีลายเซ็น</p>
                            )}
                        </div>
                    </div>

                    {/* ── Address — full width ──────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                        <SectionHeader
                            icon={<MapPin className="h-6 w-6" />}
                            title="ที่อยู่ติดต่อ"
                            variant="dark"
                        />
                        <div className="p-6">
                            <DetailItem
                                icon={<MapPin className="h-4 w-4 text-gray-400 mt-0.5" />}
                                label=""
                                fullWidth
                                value={
                                    employee.addressLine ||
                                        employee.subdistrict ||
                                        employee.district ||
                                        employee.province ||
                                        employee.postalCode ? (
                                        <span className="leading-relaxed text-gray-700">
                                            {employee.addressLine && `${employee.addressLine} `}
                                            {[
                                                employee.subdistrict && `ต.${employee.subdistrict}`,
                                                employee.district && `อ.${employee.district}`,
                                                employee.province && `จ.${employee.province}`,
                                                employee.postalCode,
                                            ].filter(Boolean).join("  ")}
                                        </span>
                                    ) : "-"
                                }
                            />
                        </div>
                    </div>

                    {/* ── Responsible Stores — full width ──────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                        <SectionHeader
                            icon={<Store className="h-6 w-6" />}
                            title="ร้านค้าที่รับผิดชอบ"
                        >
                            <div className="flex items-center gap-3 ml-auto">
                                {/* Count badge */}
                                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-md bg-white/20 text-xs font-bold text-white">
                                    {employee.responsibleCustomers?.length || 0}
                                </span>
                                {/* Search — desktop */}
                                <div className="relative hidden sm:block">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาร้าน, รหัส, จังหวัด..."
                                        className="w-52 pl-8 pr-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/35 focus:outline-none focus:bg-white/15 focus:border-white/35 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </SectionHeader>

                        {/* Mobile search */}
                        <div className="sm:hidden px-5 pt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาร้าน, รหัส, จังหวัด..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B91C1C] focus:border-[#B91C1C] transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-5">
                            {!employee.responsibleCustomers || employee.responsibleCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                        <Store className="h-7 w-7 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">ไม่มีร้านค้าในความดูแล</p>
                                </div>
                            ) : filteredCustomers && filteredCustomers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCustomers.map((customer) => (
                                        <Link
                                            key={customer.id}
                                            href={`/customers/${customer.id}`}
                                            className={cn(
                                                "group relative p-4 rounded-xl border border-gray-150 bg-gray-50/60",
                                                "hover:bg-white hover:border-[#B91C1C]/20 hover:shadow-md",
                                                "transition-all duration-150"
                                            )}
                                        >
                                            {/* Left red accent bar */}
                                            <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-transparent group-hover:bg-[#B91C1C] rounded-full transition-colors" />

                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:bg-[#B91C1C] group-hover:border-[#B91C1C] transition-all">
                                                    <Store className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-200 group-hover:text-[#B91C1C] transition-colors mt-0.5" />
                                            </div>

                                            <p className="text-[10px] font-bold text-[#B91C1C] tracking-widest uppercase mb-0.5">
                                                {customer.customerCode}
                                            </p>
                                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#B91C1C] line-clamp-1 transition-colors mb-3">
                                                {customer.name}
                                            </h3>

                                            <div className="flex flex-wrap gap-1.5">
                                                {customer.province && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-gray-600 border border-gray-200">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        {customer.province}
                                                    </span>
                                                )}
                                                {customer.region && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-gray-600 border border-gray-200 uppercase">
                                                        {customer.region}
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                                        customer.status === "ACTIVE"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                            : "bg-gray-100 text-gray-500 border-gray-200",
                                                    )}
                                                >
                                                    {customer.status === "ACTIVE" ? "ปกติ" : customer.status}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-14 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                        <Search className="h-7 w-7 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">
                                        ไม่พบผลลัพธ์สำหรับ &quot;{searchTerm}&quot;
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-xs text-[#B91C1C] hover:text-[#991B1B] font-medium underline-offset-2 hover:underline transition-colors"
                                    >
                                        ล้างการค้นหา
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete Confirmation Dialog ────────────────────────────────── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogTitle>ยืนยันการลบพนักงาน</DialogTitle>
                    <DialogDescription>
                        คุณต้องการลบพนักงาน <strong>{employee?.name}</strong> ใช่หรือไม่?
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
                            {deleting ? "กำลังลบ..." : "ลบพนักงาน"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
