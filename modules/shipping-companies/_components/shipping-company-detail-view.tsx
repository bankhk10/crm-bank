"use client";

import React, { useState } from "react";
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
    Truck,
    Phone,
    MapPin,
    Calendar,
    FileText,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    AlertTriangle,
    Users,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Badge } from "@/components/ui/badge";
import type { ShippingCompanyRecord } from "../_types";

interface ShippingCompanyDetailViewProps {
    shippingCompany: ShippingCompanyRecord;
}

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

export function ShippingCompanyDetailView({ shippingCompany }: ShippingCompanyDetailViewProps) {
    const router = useRouter();
    const { hasPermission, allowed, isLoading } = usePermission("menu.shipping-companies");
    const canView = !isLoading && allowed;
    const canEdit = hasPermission("shipping-company.edit");
    const canDelete = hasPermission("shipping-company.delete");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!shippingCompany) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/shipping-companies/${shippingCompany.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("ไม่สามารถลบข้อมูลบริษัทขนส่งได้");
            router.push("/shipping-companies");
            router.refresh();
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (!canView) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
                    <AlertDescription>
                        คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทขนส่งนี้
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

    return (
        <div className="min-h-screen from-slate-50 to-orange-50 bg-slate-50/50 pb-12">
            {/* Hero Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 text-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <Link
                            href="/shipping-companies"
                            className="inline-flex items-center text-orange-100 hover:text-white mb-2 transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            กลับไปหน้ารายการบริษัทขนส่ง
                        </Link>
                        <div className="flex gap-2">
                            {canEdit && (
                                <Button
                                    asChild
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                                >
                                    <Link href={`/shipping-companies/${shippingCompany.id}/edit`}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        แก้ไข
                                    </Link>
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/20"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    ลบ
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <Truck className="h-8 w-8" />
                                <h1 className="text-3xl lg:text-4xl font-bold">
                                    {shippingCompany.name}
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-orange-100">
                                {shippingCompany.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{shippingCompany.phone}</span>
                                    </div>
                                )}
                                {shippingCompany.status === "ACTIVE" ? (
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
                        <div className="p-6 border-b border-gray-100 bg-orange-300">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-6 w-6 text-orange-600" />
                                ข้อมูลทั่วไป
                            </h2>
                        </div>
                        <div className="p-6">
                            <DetailItem
                                icon={<MapPin className="h-5 w-5" />}
                                label="ที่อยู่บริษัทขนส่ง"
                                value={
                                    [
                                        shippingCompany.addressLine,
                                        shippingCompany.subdistrict && `ต.${shippingCompany.subdistrict}`,
                                        shippingCompany.district && `อ.${shippingCompany.district}`,
                                        shippingCompany.province && `จ.${shippingCompany.province}`,
                                        shippingCompany.postalCode
                                    ].filter(Boolean).join(" ") || shippingCompany.address || "-"
                                }
                            />
                            <DetailItem
                                icon={<FileText className="h-5 w-5" />}
                                label="หมายเหตุ"
                                value={shippingCompany.notes}
                            />
                            <DetailItem
                                icon={<Calendar className="h-5 w-5" />}
                                label="วันที่สร้างข้อมูล"
                                value={
                                    shippingCompany.createdAt
                                        ? new Date(shippingCompany.createdAt).toLocaleDateString("th-TH", {
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

                    {/* Customers Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-blue-300">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="h-6 w-6 text-blue-600" />
                                ลูกค้าที่ใช้บริการขนส่ง ({shippingCompany.customerList?.length || 0} ราย)
                            </h2>
                        </div>
                        <div className="p-6">
                            {shippingCompany.customerList && shippingCompany.customerList.length > 0 ? (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {shippingCompany.customerList.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                                        >
                                            <Badge variant="secondary" className="bg-white border-slate-200">
                                                {customer.customerCode}
                                            </Badge>
                                            <span className="text-sm font-medium text-slate-700">
                                                {customer.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <Users className="h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-500">
                                        ยังไม่มีลูกค้าที่ใช้บริการขนส่งนี้
                                    </p>
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
                        คุณต้องการลบบริษัทขนส่ง <strong>{shippingCompany.name}</strong> ใช่หรือไม่?
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
