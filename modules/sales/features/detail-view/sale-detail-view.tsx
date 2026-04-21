"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    AlertTriangle,
    Loader2,
    LayoutList,
    FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse } from "@/modules/sales/types";
import {
    SaleStatusLabels,
    getSaleStatusColor,
    getSaleStatusDotColor,
} from "@/modules/sales/types";
import { getSaleAction } from "../../server/actions";

export function SaleDetailView({ id }: { id: string }) {
    const router = useRouter();
    const { hasPermission } = usePermission("menu.sales");
    const canViewPdf = hasPermission("sale.view");

    const [data, setData] = useState<SaleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSaleAction(id)
            .then((res: any) => {
                if (!res.success || !("sale" in res)) throw new Error(res.error || "Failed to fetch sale");
                setData(res);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="h-10 w-24 sm:w-32 bg-slate-200 animate-pulse rounded" />
                        <div className="h-10 w-32 sm:w-48 bg-slate-200 animate-pulse rounded" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            <div className="h-48 sm:h-64 bg-slate-200 animate-pulse rounded-xl" />
                            <div className="h-32 sm:h-40 bg-slate-200 animate-pulse rounded-xl" />
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="h-64 sm:h-80 bg-slate-200 animate-pulse rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>ผิดพลาด</AlertTitle>
                    <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    ย้อนกลับ
                </Button>
            </div>
        );
    }

    const { sale, stockWarnings, priceWarnings } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
            <div className="bg-white/80 max-w-5xl mx-auto px-4 py-3 flex items-center justify-between shadow-sm rounded-xl">
                <div className="flex items-center gap-2">
                    {/* ปุ่มกลับไปหน้ารายการขาย */}
                    <Button
                        variant="ghost"
                        className="text-slate-600 hover:text-slate-900"
                        asChild
                    >
                        <Link href="/sales">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            ข้อมูลการขาย
                        </Link>
                    </Button>

                    {/* ปุ่มดูหน้ารายละเอียด (mobile view) */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        asChild
                    >
                        <Link href={`/sales/${sale.id}`}>
                            <LayoutList className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">ดูรายละเอียด</span>
                            <span className="sm:hidden">รายละเอียด</span>
                        </Link>
                    </Button>
                </div>

                <Badge
                    className={`${getSaleStatusColor(
                        sale.status,
                    )} border-none shadow-none px-4 py-2`}
                >
                    <span
                        className={`mr-2 h-4 w-4 rounded-full ${getSaleStatusDotColor(
                            sale.status,
                        )}`}
                    />
                    {SaleStatusLabels[sale.status]}
                </Badge>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-4">
                <WarningsSection
                    stockWarnings={stockWarnings}
                    priceWarnings={priceWarnings}
                    sale={sale}
                />
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {canViewPdf ? (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative" style={{ height: "calc(100vh - 180px)" }}>
                        {pdfLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] z-10">
                                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                                <p className="text-slate-600 font-medium animate-pulse">กำลังเตรียมไฟล์เอกสาร...</p>
                            </div>
                        )}
                        <iframe
                            src={`/api/pdf?saleId=${sale.id}`}
                            className="w-full h-full border-0"
                            title="Sale Detail PDF"
                            onLoad={() => setPdfLoading(false)}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-700 mb-2">
                                ไม่มีสิทธิ์ดูเอกสาร PDF
                            </h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                                คุณไม่มีสิทธิ์เปิดดูเอกสาร PDF กรุณาติดต่อผู้ดูแลระบบ หรือใช้ปุ่ม &ldquo;ดูรายละเอียด&rdquo; ด้านบนแทน
                            </p>
                            <Button
                                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                                asChild
                            >
                                <Link href={`/sales/${sale.id}`}>
                                    <LayoutList className="h-4 w-4 mr-2" />
                                    ดูรายละเอียด
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Components
function WarningsSection({ stockWarnings, priceWarnings, sale }: any) {
    if (
        (!stockWarnings || stockWarnings.length === 0) &&
        (!priceWarnings || priceWarnings.length === 0) &&
        (!sale || sale.status !== "REJECTED")
    ) {
        return null;
    }

    return (
        <div className="space-y-3 mb-6 sm:mb-8 print:hidden">
            {sale && sale.status === "REJECTED" && (sale as any).rejectionReason && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>รายการนี้ไม่ได้รับการอนุมัติ</AlertTitle>
                    <AlertDescription>
                        <strong>เหตุผล:</strong> {(sale as any).rejectionReason}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
