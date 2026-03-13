"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
    AlertTriangle, 
    ArrowLeft, 
    Pencil, 
    Trash2, 
    Calendar, 
    Wallet, 
    CheckCircle2, 
    XCircle,
    Building2,
    FileText,
    History
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { getCreditLimitAction, deleteCreditLimitAction } from "@/modules/credit-limits/server/actions";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DetailItem } from "@/components/custom/detail-item";

const statusMap: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "ใช้งาน", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    SUSPENDED: { label: "ระงับ", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    EXPIRED: { label: "หมดอายุ", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
});

export default function CreditLimitDetailView() {
    const { creditLimitId } = useParams() as { creditLimitId: string };
    const router = useRouter();
    const { hasPermission, allowed, isLoading } = usePermission("menu.credit_limits");
    
    const canView = !isLoading && allowed;
    const canEdit = hasPermission("creditlimit.edit");
    const canDelete = hasPermission("creditlimit.delete");

    const [creditLimit, setCreditLimit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getCreditLimitAction(creditLimitId);
                if (!res.success) throw new Error(res.error || "Failed to load credit limit");
                if (mounted) setCreditLimit(res.creditLimit);
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

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await deleteCreditLimitAction(creditLimitId);
            if (!res.success) throw new Error(res.error || "ลบวงเงินไม่สำเร็จ");
            toast.success("ลบข้อมูลวงเงินเรียบร้อยแล้ว");
            router.push("/credit-limits");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 w-48 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

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

    if (!loading && !creditLimit && !error) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
                 <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                 <h2 className="text-xl font-semibold">ไม่พบข้อมูลวงเงิน</h2>
                 <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    ย้อนกลับ
                 </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                    href="/credit-limits"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    กลับไปหน้ารายการวงเงิน
                </Link>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <Button asChild variant="outline" size="sm" className="h-9">
                            <Link href={`/credit-limits/${creditLimitId}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                แก้ไข
                            </Link>
                        </Button>
                    )}
                    {canDelete && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-9"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>ข้อผิดพลาด</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Summary and Status */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Wallet className="h-8 w-8 text-blue-100" />
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">วงเงินรวม</p>
                                    <h3 className="text-2xl font-bold">
                                        {loading ? "..." : currencyFormatter.format(creditLimit?.limitAmount ?? 0)}
                                    </h3>
                                </div>
                            </div>
                            
                            <Separator className="bg-white/20 my-4" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100/80 text-xs">ใช้ไป</p>
                                    <p className="font-semibold">{loading ? "..." : currencyFormatter.format(creditLimit?.usedAmount ?? 0)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100/80 text-xs">คงเหลือ</p>
                                    <p className="font-semibold">{loading ? "..." : currencyFormatter.format(creditLimit?.availableAmount ?? 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <History className="h-4 w-4 text-emerald-600" />
                                สถานะปัจจุบัน
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-100 animate-pulse rounded" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const s = (creditLimit?.status ?? "").toUpperCase();
                                        const info = statusMap[s];
                                        if (!info) return <Badge variant="secondary">{creditLimit?.status ?? "-"}</Badge>;
                                        return <Badge className={info.className}>{info.label}</Badge>;
                                    })()}
                                    <span className="text-xs text-slate-500">
                                        อัปเดตเมื่อ: {creditLimit?.updatedAt ? new Date(creditLimit.updatedAt).toLocaleDateString("th-TH") : "-"}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                ข้อมูลลูกค้าและวงเงิน
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-x sm:divide-y-0 divide-y divide-slate-100">
                                <div className="p-6">
                                    <DetailItem 
                                        label="ชื่อลูกค้า" 
                                        value={creditLimit?.customer?.name ?? "-"} 
                                        icon={<Building2 className="h-4 w-4 text-slate-400" />}
                                    />
                                </div>
                                <div className="p-6">
                                    <DetailItem 
                                        label="รหัสลูกค้า" 
                                        value={creditLimit?.customer?.customerCode ?? "-"} 
                                        icon={<FileText className="h-4 w-4 text-slate-400" />}
                                    />
                                </div>
                                <div className="p-6">
                                    <DetailItem 
                                        label="วันที่เริ่มใช้งาน" 
                                        value={creditLimit?.effectiveDate ? new Date(creditLimit.effectiveDate).toLocaleDateString("th-TH") : "-"} 
                                        icon={<Calendar className="h-4 w-4 text-slate-400" />}
                                    />
                                </div>
                                <div className="p-6">
                                    <DetailItem 
                                        label="วันที่หมดอายุ" 
                                        value={creditLimit?.expiryDate ? new Date(creditLimit.expiryDate).toLocaleDateString("th-TH") : "ไม่มีกำหนด"} 
                                        icon={<Calendar className="h-4 w-4 text-slate-400" />}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                หมายเหตุ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-slate-600 whitespace-pre-wrap min-h-[60px]">
                                {creditLimit?.notes || "ไม่มีหมายเหตุ"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogTitle>ยืนยันการลบข้อมูล</DialogTitle>
                    <DialogDescription>
                        คุณต้องการลบข้อมูลวงเงินของ <strong>{creditLimit?.customer?.name}</strong> ใช่หรือไม่?
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
