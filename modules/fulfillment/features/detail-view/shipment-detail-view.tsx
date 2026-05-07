"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileText, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";

export function ShipmentDetailView({ id, saleId }: { id: string; saleId?: string }) {
    const router = useRouter();
    const { hasPermission } = usePermission("menu.fulfillment");
    const canViewPdf = hasPermission("sale.view");

    const [pdfLoading, setPdfLoading] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-purple-50">
            <div className="bg-white/80 max-w-5xl mx-auto px-4 py-3 flex items-center justify-between shadow-sm rounded-xl">
                <div className="flex items-center gap-2">
                    {/* ปุ่มกลับไปหน้าการจัดส่ง */}
                    {saleId ? (
                        <Button
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-900"
                            asChild
                        >
                            <Link href={`/fulfillment/${saleId}`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                ข้อมูลการจัดส่ง
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-900"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                    <Package className="h-4 w-4" />
                    <span>ใบจัดส่งสินค้า</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {canViewPdf ? (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative" style={{ height: "calc(100vh - 120px)" }}>
                        {pdfLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] z-10">
                                <Loader2 className="h-10 w-10 text-purple-600 animate-spin mb-4" />
                                <p className="text-slate-600 font-medium animate-pulse">กำลังเตรียมไฟล์เอกสาร...</p>
                            </div>
                        )}
                        <iframe
                            src={`/api/pdf?shipmentId=${id}`}
                            className="w-full h-full border-0"
                            title="Shipment Detail PDF"
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
                                คุณไม่มีสิทธิ์เปิดดูเอกสาร PDF กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
