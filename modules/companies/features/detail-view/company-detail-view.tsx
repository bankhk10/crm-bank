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
import { deleteCompanyAction, getCompanyAction } from "@/modules/companies/server/actions";
import type { CompanyRecord, CompanyDetail } from "@/modules/companies/types/types";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailHero } from "@/components/custom/detail-hero";
import { toast } from "sonner";


export default function CompanyDetailView() {
    const { companyId } = useParams() as { companyId: string };
    const router = useRouter();
    const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
    const canView = (!isLoading && allowed) && hasPermission("company.view");
    const canEdit = hasPermission("company.edit");
    const canDelete = hasPermission("company.delete");

    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getCompanyAction(companyId);
                if (!res.success) throw new Error("error" in res ? res.error : "Failed to load company");
                if (!("company" in res) || !res.company) throw new Error("Failed to load company");

                if (mounted) setCompany(res.company as unknown as CompanyDetail);
            } catch (err: any) {
                setError(err.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [companyId]);

    const handleDelete = async () => {
        if (!company) return;
        setDeleting(true);
        try {
            const res = await deleteCompanyAction(company.id);
            if (!res.success) throw new Error(res.error || "ไม่สามารถลบข้อมูลบริษัทได้");
            toast.success("ลบข้อมูลบริษัทเรียบร้อยแล้ว");
            router.push("/companies");
            router.refresh();
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (!canView && !isLoading) {
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

    if (isLoading || loading) {
        return (
            <div className="container max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-48 bg-gray-200 rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="container max-w-4xl mx-auto p-6 text-center">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>ไม่พบข้อมูล</AlertTitle>
                    <AlertDescription>
                        ไม่พบข้อมูลบริษัทที่คุณค้นหา
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen from-slate-50 to-blue-50 bg-slate-50/50 pb-12">
            {error && (
                <div className="container max-w-7xl mx-auto pt-6 px-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>ข้อผิดพลาด</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Hero Header Section */}
            <DetailHero
                backUrl="/companies"
                backLabel="หน้ารายการบริษัท"
                title={company.name}
                icon={<Building2 className="h-8 w-8 text-white" />}
                badges={
                    <>
                        {company.shortName && (
                            <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-medium text-slate-900 bg-red-50 border-1  border-red-500 px-3 py-1.5 rounded-full shadow-sm">
                                ชื่อย่อบริษัท : {company.shortName}
                            </span>
                        )}
                        {company.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ใช้งาน
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full shadow-sm">
                                <XCircle className="h-4 w-4 text-rose-600" />
                                ไม่ใช้งาน
                            </span>
                        )}
                    </>
                }
                actions={
                    <>
                        {canEdit && (
                            <Button
                                asChild
                                size="sm"
                                className="h-10 px-6 text-xs font-semibold 
                                bg-white/10 hover:bg-white/20 
                                text-white border border-white/10 
                                rounded-xl backdrop-blur-md
                                transition-all active:scale-[0.98]"
                            >
                                <Link href={`/companies/${company.id}/edit`}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    แก้ไข
                                </Link>
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
                                <Trash2 className="h-4 w-4 mr-2" />
                                ลบ
                            </Button>
                        )}
                    </>
                }
            />


            {/* Main Content */}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* General Information Card */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <SectionHeader
                            title="ข้อมูลทั่วไป"
                            icon={<FileText className="h-6 w-6" />}
                        />
                        <div className="p-6">
                            <DetailItem
                                icon={<Building2 className="h-5 w-5" />}
                                label="รหัสบริษัท"
                                value={company.companyCode}
                            />
                            <DetailItem
                                icon={<Building2 className="h-5 w-5" />}
                                label="ชื่อย่อบริษัท"
                                value={company.shortName}
                            />
                            <DetailItem
                                icon={<Building2 className="h-5 w-5" />}
                                label="ชื่อบริษัท"
                                value={company.name}
                            />
                            <DetailItem
                                icon={<Hash className="h-5 w-5" />}
                                label="เลขประจำตัวผู้เสียภาษี"
                                value={company.taxId}
                            />
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <SectionHeader
                            title="ข้อมูลการติดต่อ"
                            icon={<Phone className="h-6 w-6" />}
                            variant="dark"
                        />
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
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 lg:col-span-2">
                        <SectionHeader
                            title="ที่อยู่"
                            icon={<MapPin className="h-6 w-6" />}
                        />
                        <div className="p-6">
                            <DetailItem
                                icon={<MapPin className="h-5 w-5 mt-1" />}
                                label=""
                                value={
                                    (company as any).addressLine ||
                                        (company as any).subdistrict ||
                                        (company as any).district ||
                                        (company as any).province ||
                                        (company as any).postalCode ? (
                                        <span>
                                            {(company as any).addressLine && `${(company as any).addressLine} `}
                                            {[
                                                (company as any).subdistrict && `ต.${(company as any).subdistrict}`,
                                                (company as any).district && `อ.${(company as any).district}`,
                                                (company as any).province && `จ.${(company as any).province}`,
                                                (company as any).postalCode && `${(company as any).postalCode}`,
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
