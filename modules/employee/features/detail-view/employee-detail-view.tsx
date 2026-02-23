"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";
import type { EmployeeDetail } from "../../types";
import { DetailItem } from "../../ui/detail-item";

interface EmployeeDetailViewProps {
    employeeId: string;
}

export function EmployeeDetailView({ employeeId }: EmployeeDetailViewProps) {
    const router = useRouter();
    const { hasPermission, allowed, isLoading } = usePermission("menu.employees");
    const canView = !isLoading && allowed;
    const canEdit =
        hasPermission("employee.edit") || hasPermission("employee.manage");
    const canDelete =
        hasPermission("employee.delete") || hasPermission("employee.manage");

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
                const src: any = res.employee || null;
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
        return () => {
            mounted = false;
        };
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
                <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
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
                        <div className="p-6 border-b border-gray-100 bg-blue-300">
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
                        <div className="p-6 border-b border-gray-100 bg-purple-300">
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
                        <div className="p-6 border-b border-gray-100 bg-emerald-200">
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

                    {/* Responsible Stores Section */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 lg:col-span-2">
                        <div className="p-6 border-b border-gray-100 bg-linear-to-r from-orange-200 to-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Store className="h-6 w-6 text-orange-600" />
                                ร้านค้าที่รับผิดชอบ
                                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-orange-300 text-orange-700 text-sm font-semibold">
                                    {employee.responsibleCustomers?.length || 0}
                                </span>
                            </h2>

                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อร้าน, รหัส หรือจังหวัด..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6">
                            {!employee.responsibleCustomers ||
                                employee.responsibleCustomers.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">
                                        ไม่มีร้านค้าในความดูแล
                                    </p>
                                </div>
                            ) : filteredCustomers && filteredCustomers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredCustomers.map((customer) => (
                                        <Link
                                            key={customer.id}
                                            href={`/customers/${customer.id}`}
                                            className="group p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-orange-200 transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-orange-100 transition-colors text-orange-600 shadow-sm">
                                                    <Store className="h-5 w-5" />
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        ดูรายละเอียด
                                                    </span>
                                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                                                    <div className="w-1 h-1 bg-orange-600 rounded-full" />
                                                    {customer.customerCode}
                                                </div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors line-clamp-1 text-lg">
                                                    {customer.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {customer.province && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {customer.province}
                                                        </span>
                                                    )}
                                                    {customer.region && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                                                            {customer.region}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border",
                                                            customer.status === "ACTIVE"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                : "bg-slate-50 text-slate-700 border-slate-100",
                                                        )}
                                                    >
                                                        {customer.status === "ACTIVE"
                                                            ? "ปกติ"
                                                            : customer.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">
                                        ไม่พบข้อมูลที่ตรงกับการค้นหา &quot;{searchTerm}&quot;
                                    </p>
                                    <Button
                                        variant="link"
                                        className="mt-2 text-orange-600"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        ล้างการค้นหา
                                    </Button>
                                </div>
                            )}
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
