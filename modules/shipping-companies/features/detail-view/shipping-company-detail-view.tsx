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
    Edit,
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Badge } from "@/components/ui/badge";
import { deleteShippingCompanyAction } from "../../server/actions";
import type { ShippingCompanyRecord } from "../../types";
import { DetailHero } from "@/components/custom/detail-hero";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailItem } from "@/components/custom/detail-item";


interface ShippingCompanyDetailViewProps {
    shippingCompany: ShippingCompanyRecord;
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
            <div className="container max-w-4xl mx-auto p-4 sm:p-6">
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
            <div className="container max-w-4xl mx-auto p-4 sm:p-6">
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
            <DetailHero
                backUrl="/shipping-companies"
                backLabel="หน้ารายการบริษัทขนส่ง"
                title={shippingCompany.name}
                icon={<Truck className="h-8 w-8 text-white" />}
                badges={
                    <>
                        {shippingCompany.phone && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                <Phone className="h-3.5 w-3.5 text-[#F87171]" />
                                {shippingCompany.phone}
                            </span>
                        )}
                        {shippingCompany.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                ใช้งาน
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                                <XCircle className="h-3.5 w-3.5" />
                                ไม่ใช้งาน
                            </span>
                        )}
                    </>
                }
                actions={
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button
                                size="sm"
                                className="h-10 px-4 sm:px-6 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                                asChild
                            >
                                <Link href={`/shipping-companies/${shippingCompany.id}/edit`}>
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    แก้ไข
                                </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                size="sm"
                                className="h-10 px-4 sm:px-6 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2 text-red-400" />
                                ลบ
                            </Button>
                        )}
                    </div>
                }
            />


            {/* Content */}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Single column on mobile/tablet, 2 columns on lg+ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                    {/* General Info */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <SectionHeader
                            title="ข้อมูลทั่วไป"
                            icon={<FileText className="h-6 w-6" />}
                        />
                        <div className="p-4 sm:p-6">
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
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <SectionHeader
                            title={`ลูกค้าที่ใช้บริการ (${shippingCompany.customerList?.length || 0} ราย)`}
                            icon={<Users className="h-6 w-6" />}
                            variant="dark"
                        />

                        <div className="p-4 sm:p-6">
                            {shippingCompany.customerList?.length ? (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {shippingCompany.customerList.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition"
                                        >
                                            <Badge variant="secondary" className="shrink-0">
                                                {customer.customerCode}
                                            </Badge>
                                            <span className="text-sm font-medium text-gray-700 break-words min-w-0">
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
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl">
                    <DialogTitle>ยืนยันการลบข้อมูล</DialogTitle>
                    <DialogDescription>
                        คุณต้องการลบบริษัทขนส่ง <strong>{shippingCompany.name}</strong> ใช่หรือไม่?
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </DialogDescription>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                            className="w-full sm:w-auto"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full sm:w-auto"
                        >
                            {deleting ? "กำลังลบ..." : "ลบข้อมูล"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}