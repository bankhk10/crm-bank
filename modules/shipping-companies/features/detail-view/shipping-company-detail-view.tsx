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
import { deleteShippingCompanyAction } from "../../server/actions";
import type { ShippingCompanyRecord } from "../../types";

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
            const result = await deleteShippingCompanyAction(shippingCompany.id);
            if (!result.success) throw new Error(result.error || "ไม่สามารถลบข้อมูลบริษัทขนส่งได้");
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
        <div className="min-h-screen pb-12 rounded-3xl">
            {/* Hero Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white border-t-4 border-red-600 rounded-3xl shadow-xl p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <Link
                            href="/shipping-companies"
                            className="inline-flex items-center text-gray-500 hover:text-red-600 transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            กลับไปหน้ารายการบริษัทขนส่ง
                        </Link>

                        <div className="flex gap-2">
                            {canEdit && (
                                <Button asChild size="sm">
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
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    ลบ
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-14 h-14 bg-orange-100 rounded-xl">
                                    <Truck className="h-7 w-7 text-orange-600" />
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                    {shippingCompany.name}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                {shippingCompany.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{shippingCompany.phone}</span>
                                    </div>
                                )}

                                {shippingCompany.status === "ACTIVE" ? (
                                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        <CheckCircle2 className="h-4 w-4" />
                                        ใช้งาน
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                                        <XCircle className="h-4 w-4" />
                                        ไม่ใช้งาน
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* General Info */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-600">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="h-6 w-6 text-white" />
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
                        </div>
                    </div>

                    {/* Customers */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-600">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="h-6 w-6 text-white" />
                                ลูกค้าที่ใช้บริการ ({shippingCompany.customerList?.length || 0} ราย)
                            </h2>
                        </div>

                        <div className="p-6">
                            {shippingCompany.customerList?.length ? (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {shippingCompany.customerList.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition"
                                        >
                                            <Badge variant="secondary">
                                                {customer.customerCode}
                                            </Badge>
                                            <span className="text-sm font-medium text-gray-700">
                                                {customer.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Users className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">
                                        ยังไม่มีลูกค้าที่ใช้บริการขนส่งนี้
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Delete Dialog */}
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