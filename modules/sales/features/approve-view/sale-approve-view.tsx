"use client";

/**
 * Sale Approve View
 *
 * หน้า UI สำหรับพิจารณาอนุมัติ/ไม่อนุมัติรายการขาย
 * แยกออกมาจาก page.tsx เพื่อให้ page.tsx บาง (thin)
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { SaleDetailResponse, PriceWarning, StockWarning, SaleItemWithProduct } from "@/modules/sales/types";
import { PaymentTermLabels } from "@/modules/sales/types";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    CreditCard,
    User,
    Calendar,
    TrendingDown,
    FileText,
    Gift,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormTextarea } from "@/components/custom/FormTextarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getSaleForApprovalAction,
    approveSaleAction,
    rejectSaleAction,
} from "@/modules/sales/server/actions";
import { usePermission } from "@/hooks/use-permission";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailHero } from "@/components/custom/detail-hero";

interface SaleApproveViewProps {
    id: string;
}

// ----------------------------------------------------------------------
// Local UI Components matching Product Management style
// ----------------------------------------------------------------------

const AppCard = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`bg-white text-gray-800 rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 transition-all hover:shadow-lg hover:shadow-gray-500/5 hover:border-gray-100 ${className}`}
    >
        {children}
    </div>
);

const AppSectionHeader = ({
    title,
    icon: Icon,
    badge,
}: {
    title: string;
    icon: React.ElementType;
    badge?: string;
}) => (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white shadow-lg shadow-red-500/20">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                    {title}
                </h2>
                {badge && <span className="text-xs text-muted-foreground">{badge}</span>}
            </div>
        </div>
    </div>
);

export function SaleApproveView({ id }: SaleApproveViewProps) {
    const router = useRouter();
    const { allowed, isLoading: permLoading } = usePermission("sale.approve");

    const [data, setData] = useState<SaleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [approveNotes, setApproveNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        getSaleForApprovalAction(id).then((res) => {
            if (res.success) {
                setData(res.data as SaleDetailResponse);
            } else {
                setError(res.error ?? "Failed to fetch");
            }
            setLoading(false);
        });
    }, [id]);

    const handleApprove = async () => {
        setActionLoading(true);
        const res = await approveSaleAction(id, approveNotes);
        if (res.success) {
            router.push(`/sales`);
        } else {
            setError(res.error ?? "Failed to approve");
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return setError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
        setActionLoading(true);
        const res = await rejectSaleAction(id, rejectReason);
        if (res.success) {
            router.push(`/sales`);
        } else {
            setError(res.error ?? "Failed to reject");
            setActionLoading(false);
        }
    };

    /* Loading */
    if (permLoading || loading) {
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

    if (!allowed) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>การเข้าถึงถูกปฏิเสธ</AlertTitle>
                    <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (error && !data) {
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

    if (!data) return null;

    const { sale, priceWarnings, stockWarnings, creditInfo } = data;

    if (sale.status !== "PENDING_APPROVAL") {
        return (
            <div className="container max-w-4xl mx-auto p-6 text-center">
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>สถานะไม่ถูกต้อง</AlertTitle>
                    <AlertDescription>รายการนี้ไม่ได้อยู่ในสถานะรออนุมัติ</AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    className="border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C] hover:text-white transition-colors"
                    onClick={() => router.push(`/sales/${sale.id}`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> กลับสู่หน้ารายละเอียด
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* ── Hero Header ──────────────────────────────────────────────── */}
            <DetailHero
                backUrl="/sales"
                backLabel="หน้ารายการขาย"
                title="พิจารณาอนุมัติรายการขาย"
                icon={<FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
                accentColor="#B91C1C"
                badges={
                    <>
                        {sale.saleNumber && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                {sale.saleNumber}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-300 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                            {sale.customer.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            รอการอนุมัติ
                        </span>
                    </>
                }
            />

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ── Sale Information ──────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="ข้อมูลรายการขาย"
                        />
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 divide-y sm:divide-y-0 divide-gray-50">
                            <DetailItem
                                icon={<User className="h-4 w-4 text-gray-400" />}
                                label="ลูกค้า"
                                value={sale.customer.name}
                            />
                            <DetailItem
                                icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                                label="เงื่อนไขชำระเงิน"
                                value={PaymentTermLabels[sale.paymentTerm]}
                            />

                            <DetailItem
                                icon={<User className="h-4 w-4 text-gray-400" />}
                                label="พนักงานขาย"
                                value={sale.employee.name}
                            />
                            <DetailItem
                                icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                label="วันที่ออเดอร์"
                                value={format(new Date(sale.saleDate), "dd MMM yyyy", {
                                    locale: th,
                                })}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Notes ─────────────────────────────────────────────── */}
                {sale.notes && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="หมายเหตุ"
                            variant="dark"
                        />
                        <div className="p-6">
                            {sale.notes ? (
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {sale.notes}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">ไม่มีหมายเหตุ</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Price Change Warning */}
                {priceWarnings.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<TrendingDown className="h-6 w-6" />}
                            title="พบการเปลี่ยนแปลงราคา"
                        >
                            <span className="text-xs text-white/70 ml-2">กรุณาตรวจสอบรายการด้านล่างก่อนอนุมัติ</span>
                        </SectionHeader>
                        <div className="p-6 space-y-4">
                            {priceWarnings.map((w: PriceWarning, i: number) => {
                                const original = Number(w.originalPrice ?? 0);
                                const modified = Number(w.modifiedPrice ?? 0);
                                const diff = modified - original;
                                const diffPercent = original ? (diff / original) * 100 : 0;
                                const diffPositive = diff >= 0;
                                return (
                                    <div
                                        key={i}
                                        className="rounded-2xl border border-orange-200 bg-white/80 p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <p className="font-semibold text-gray-900 text-base">
                                                {w.productName}
                                            </p>
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs w-fit">
                                                ปรับราคา
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                                            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                                                <span className="text-gray-500 text-xs">ราคาเดิม</span>
                                                <p className="text-gray-700 font-semibold line-through">
                                                    ฿
                                                    {original.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-orange-50 p-3 border border-orange-100">
                                                <span className="text-gray-500 text-xs">
                                                    ราคาปัจจุบัน
                                                </span>
                                                <p className="text-orange-700 font-bold">
                                                    ฿
                                                    {modified.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-white p-3 border border-orange-100">
                                                <span className="text-gray-500 text-xs">ส่วนต่าง</span>
                                                <p
                                                    className={`font-bold ${diffPositive ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {diffPositive ? "+" : ""}
                                                    {diff.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}{" "}
                                                    บาท
                                                    <span className="text-xs block text-gray-500">
                                                        ({diffPercent.toFixed(2)}%)
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* Credit Information */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<CreditCard className="h-6 w-6" />}
                        title="ข้อมูลวงเงินเครดิต"
                        variant="dark"
                    >
                        {creditInfo.willExceedLimit && (
                            <Badge variant="destructive" className="ml-2 text-xs px-3 py-1 bg-white/20 border-white/20 text-white">
                                เกินวงเงิน
                            </Badge>
                        )}
                    </SectionHeader>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">ทั้งหมด</span>
                            <p className="font-bold text-xl text-gray-900 mt-1">
                                ฿{creditInfo.creditLimit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">คงเหลือ</span>
                            <p
                                className={`font-bold text-xl mt-1 ${creditInfo.willExceedLimit
                                    ? "text-red-600"
                                    : "text-emerald-600"
                                    }`}
                            >
                                ฿{creditInfo.availableCredit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">ยอดขายนี้</span>
                            <p className="font-bold text-xl text-[#1c6bb9] mt-1">
                                ฿{creditInfo.currentSaleAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stock Warning */}
                {stockWarnings.length > 0 && (
                    <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<Package className="h-6 w-6" />}
                            title="สินค้าบางรายการสต็อกไม่พอ"
                        />
                        <div className="p-6 space-y-3">
                            {stockWarnings.map((w: StockWarning, i: number) => (
                                <div key={i} className="flex flex-wrap items-center gap-x-2 text-sm">
                                    <span className="text-gray-400">•</span>
                                    <span className="font-bold text-gray-900">{w.productName}</span>
                                    <span className="text-gray-500">เหลือ</span>
                                    <span className="font-bold text-red-600">
                                        {w.available}
                                    </span>
                                    <span className="text-gray-500">ต้องใช้</span>
                                    <span className="font-bold text-green-600">
                                        {w.requested}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* รายการสินค้า */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<Package className="h-6 w-6" />}
                        title="รายการสินค้า"
                    />

                    {/* Mobile Card View */}
                    <div className="block md:hidden">
                        <div className="p-4 space-y-3">
                            {sale.items.map((item: SaleItemWithProduct, i: number) => {
                                const currentUnitPrice = Number(item.unitPrice ?? 0);
                                const quantity = Number(item.quantity ?? 0);
                                const currentTotal = Number(
                                    item.totalPrice ?? currentUnitPrice * quantity
                                );
                                const priceChanged = Boolean(item.priceModified);
                                const packSize = parseFloat(
                                    item.product.packageSizePerBox?.toString() || "1"
                                );
                                const multiplier =
                                    isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                                const cartonPrice = currentUnitPrice * multiplier;

                                return (
                                    <div
                                        key={item.id ?? i}
                                        className={`rounded-2xl border-2 p-4 transition-all shadow-sm ${priceChanged
                                            ? "bg-orange-50/70 border-orange-300"
                                            : "bg-white border-gray-100"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 text-base">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.product.productCode}
                                                </p>
                                                {priceChanged && (
                                                    <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                                        รายการพิเศษ
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {/* Row 1: Unit, Package Size & Quantity */}
                                            <div className="col-span-2 grid grid-cols-3 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-500 text-xs block mb-1">
                                                        จำนวน
                                                    </span>
                                                    <p className="font-bold text-gray-900">
                                                        {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-500 text-xs block mb-1">
                                                        หน่วยนับ
                                                    </span>
                                                    <p className="font-bold text-gray-900">
                                                        {item.product.unit || "-"}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-500 text-xs block mb-1">
                                                        บรรจุ
                                                    </span>
                                                    <p className="font-bold text-gray-900">
                                                        {item.product.packageSizePerBox || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Row 2: Unit Price & Carton Price */}
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <span className="text-gray-500 text-xs block mb-1">
                                                    ราคา/หน่วย
                                                </span>
                                                <p
                                                    className={`font-bold ${priceChanged ? "text-orange-700" : "text-gray-900"
                                                        }`}
                                                >
                                                    {currentUnitPrice.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <span className="text-gray-500 text-xs block mb-1">
                                                    ราคา/ลัง
                                                </span>
                                                <p className="font-bold text-gray-900">
                                                    {cartonPrice.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>

                                            {/* Row 3: Total */}
                                            <div className="col-span-2 bg-blue-50/50 rounded-lg p-3 text-right">
                                                <span className="text-gray-500 text-xs block mb-1">
                                                    ราคารวม
                                                </span>
                                                <p
                                                    className={`font-bold text-lg ${priceChanged ? "text-orange-700" : "text-blue-600"
                                                        }`}
                                                >
                                                    {currentTotal.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile Summary */}
                        <div className="bg-gray-50 border-t-2 border-gray-100 p-5 space-y-3">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-medium text-gray-700">
                                    รวมเป็นเงิน
                                </span>
                                <span className="text-base font-bold text-gray-900">
                                    {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>

                            {Number(sale.shippingCost) > 0 && (
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
                                    <span className="text-base font-semibold text-red-600">
                                        -
                                        {Number(sale.shippingCost).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            {Number(sale.otherCosts) > 0 && (
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                                    <span className="text-base font-semibold text-red-600">
                                        -
                                        {Number(sale.otherCosts).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
                                <span className="text-lg font-bold text-gray-900">ยอดสุทธิ</span>
                                <span className="text-2xl font-bold text-[#B91C1C]">
                                    {Number(sale.totalAmount).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <div className="p-6 space-y-3">
                            <div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-5 py-2 text-xs md:text-sm text-gray-500 font-semibold border-b border-gray-100">
                                <div className="col-span-4">สินค้า</div>
                                <div className="col-span-1 text-center">จำนวน</div>
                                <div className="col-span-1 text-center">หน่วย</div>
                                <div className="col-span-1 text-center">บรรจุ</div>
                                <div className="col-span-2 text-center">ราคา/หน่วย</div>
                                <div className="col-span-1 text-center">ราคา/ลัง</div>
                                <div className="col-span-2 text-center">รวม</div>
                            </div>
                            {sale.items.map((item: SaleItemWithProduct, i: number) => {
                                const originalUnitPrice = Number(
                                    item.originalPrice ?? item.unitPrice ?? 0
                                );
                                const currentUnitPrice = Number(item.unitPrice ?? 0);
                                const quantity = Number(item.quantity ?? 0);
                                const currentTotal = Number(
                                    item.totalPrice ?? currentUnitPrice * quantity
                                );
                                const originalTotal = originalUnitPrice * quantity;
                                const priceChanged = Boolean(item.priceModified);
                                const packSize = parseFloat(
                                    item.product.packageSizePerBox?.toString() || "1"
                                );
                                const multiplier =
                                    isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                                const cartonPrice = currentUnitPrice * multiplier;

                                return (
                                    <div
                                        key={item.id ?? i}
                                        className={`rounded-2xl border-2 p-3 md:p-4 transition-all shadow-sm hover:shadow-md ${priceChanged
                                            ? "bg-orange-50/70 border-orange-300"
                                            : "bg-white border-gray-100"
                                            }`}
                                    >
                                        <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                                            {/* Product Info */}
                                            <div className="col-span-4">
                                                <p className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.product.productCode}
                                                </p>
                                                {priceChanged && (
                                                    <Badge className="mt-1 bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                                        รายการพิเศษ
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-1 text-center">
                                                <p className="text-gray-900 text-sm md:text-base">
                                                    {item.quantity}
                                                </p>
                                            </div>

                                            {/* Unit */}
                                            <div className="col-span-1 text-center">
                                                <p className="text-gray-900 text-sm md:text-base">
                                                    {item.product.unit || "-"}
                                                </p>
                                            </div>

                                            {/* Package Size */}
                                            <div className="col-span-1 text-center">
                                                <p className="text-gray-900 text-sm md:text-base">
                                                    {item.product.packageSizePerBox || "-"}
                                                </p>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="col-span-2 text-center">
                                                <p
                                                    className={`text-sm md:text-base ${priceChanged ? "text-orange-700" : "text-gray-900"
                                                        }`}
                                                >
                                                    {currentUnitPrice.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                                {priceChanged && (
                                                    <p className="text-xs text-gray-500 line-through mt-0.5">
                                                        {originalUnitPrice.toLocaleString("th-TH", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Carton Price */}
                                            <div className="col-span-1 text-right">
                                                <p className="text-gray-900 text-sm md:text-base">
                                                    {cartonPrice.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>

                                            {/* Total */}
                                            <div className="col-span-2 text-center">
                                                <p
                                                    className={`font-bold text-sm md:text-lg ${priceChanged ? "text-orange-700" : "text-green-700"
                                                        }`}
                                                >
                                                    {currentTotal.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                                {priceChanged && (
                                                    <p className="text-xs text-gray-500 line-through mt-0.5">
                                                        {originalTotal.toLocaleString("th-TH", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Summary */}
                        <div className="bg-gray-50 border-t-2 border-gray-100 p-4">
                            <div className="max-w-md ml-auto mr-12">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                        รวมเป็นเงิน
                                    </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {Number(sale.subtotalAmount).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                {Number(sale.shippingCost) > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium">ส่วนค่าขนส่ง</span>
                                        <span className="text-lg font-semibold text-red-600">
                                            -
                                            {Number(sale.shippingCost).toLocaleString("th-TH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                )}

                                {Number(sale.otherCosts) > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium">ส่วนลดหน้าบิล</span>
                                        <span className="text-lg font-semibold text-red-600">
                                            -
                                            {Number(sale.otherCosts).toLocaleString("th-TH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center border-t-2 border-gray-100">
                                    <span className="text-xl font-bold text-gray-900">
                                        ยอดสุทธิ
                                    </span>
                                    <span className="text-2xl font-bold text-green-700">
                                        {Number(sale.totalAmount).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* รายการของแถม (ดึงรูปแบบมาจาก product-manage-form) */}
                {sale.items.some(item => (item.product.freeItems?.length ?? 0) > 0) && (
                    <div className="space-y-6">
                        {sale.items.map((saleItem, itemIdx) => {
                            if (!saleItem.product.freeItems || saleItem.product.freeItems.length === 0) return null;

                            return (
                                <AppCard key={itemIdx}>
                                    <AppSectionHeader
                                        title="รายการของแถม"
                                        badge={saleItem.product.name}
                                        icon={Gift}
                                    />

                                    <div className="space-y-4">
                                        <div className="grid gap-4">
                                            {/* Desktop Header */}
                                            <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_1.5fr] gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                                                <div>ซื้อ (จำนวน)</div>
                                                <div>แถม (จำนวน)</div>
                                                <div>ราคาสุทธิ (บาท)</div>
                                                <div>หมายเหตุ</div>
                                            </div>

                                            {saleItem.product.freeItems.map((freeItem, index) => (
                                                <div
                                                    key={index}
                                                    className="group relative bg-background border rounded-xl p-4 lg:p-2 lg:border-0 lg:bg-transparent lg:grid lg:grid-cols-[1fr_1fr_1fr_1.5fr] gap-4 items-start shadow-sm lg:shadow-none transition-all hover:bg-muted/30"
                                                >
                                                    {/* Mobile Labels */}
                                                    <div className="grid grid-cols-2 gap-4 lg:contents mb-4 lg:mb-0">
                                                        <div className="space-y-1.5 lg:space-y-0">
                                                            <Label className="lg:hidden text-xs text-muted-foreground">
                                                                ซื้อ (จำนวน)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={freeItem.purchaseQty}
                                                                readOnly
                                                                className="h-10 bg-slate-50"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5 lg:space-y-0">
                                                            <Label className="lg:hidden text-xs text-muted-foreground">
                                                                แถม (จำนวน)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={freeItem.freeQty}
                                                                readOnly
                                                                className="h-10 bg-slate-50 font-bold text-green-700"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:contents gap-4 mb-4 lg:mb-0">
                                                        <div className="space-y-1.5 lg:space-y-0">
                                                            <Label className="lg:hidden text-xs text-muted-foreground">
                                                                ราคาสุทธิ
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="-"
                                                                value={freeItem.netPrice || ""}
                                                                readOnly
                                                                className="h-10 bg-slate-50"
                                                            />
                                                        </div>
                                                        {/* Mobile Notes */}
                                                        <div className="md:hidden space-y-1.5 ">
                                                            <Label className="lg:hidden text-xs text-muted-foreground">
                                                                หมายเหตุ
                                                            </Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="-"
                                                                value={freeItem.notes || ""}
                                                                readOnly
                                                                className="h-10 bg-slate-50"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Desktop/Tablet Notes */}
                                                    <div className="hidden md:block space-y-1.5 lg:space-y-0">
                                                        <Label className="lg:hidden text-xs text-muted-foreground">
                                                            หมายเหตุ
                                                        </Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="-"
                                                            value={freeItem.notes || ""}
                                                            readOnly
                                                            className="h-10 bg-slate-50"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </AppCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-4 z-50 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-row justify-center items-center gap-3 sm:gap-4">
                    <Button
                        variant="destructive"
                        onClick={() => setShowRejectDialog(true)}
                        className="flex-1 sm:flex-none sm:w-auto relative bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 sm:px-8 h-12 rounded-xl font-semibold min-w-0 sm:min-w-[160px] shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <XCircle className="h-5 w-5 mr-2 relative z-10" />
                        <span className="relative z-10">ไม่อนุมัติ</span>
                    </Button>

                    <Button
                        onClick={() => setShowApproveDialog(true)}
                        className="flex-1 sm:flex-none sm:w-auto relative bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 sm:px-8 h-12 rounded-xl font-semibold min-w-0 sm:min-w-[160px] shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <CheckCircle className="h-5 w-5 mr-2 relative z-10" />
                        <span className="relative z-10">อนุมัติ</span>
                    </Button>
                </div>
            </div>

            {/* APPROVE DIALOG */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex gap-2 items-center">
                            <CheckCircle className="text-green-600" /> ยืนยันอนุมัติ
                        </DialogTitle>
                        <DialogDescription>
                            อนุมัติรายการเลข <b>{sale.saleNumber}</b> มูลค่า
                            <b className="text-green-600">
                                {" "}
                                ฿{sale.totalAmount.toLocaleString()}
                            </b>
                        </DialogDescription>
                    </DialogHeader>

                    <FormTextarea
                        label="หมายเหตุ"
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowApproveDialog(false)}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="bg-green-600 text-white"
                        >
                            ยืนยัน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REJECT DIALOG */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex gap-2 items-center text-red-600">
                            <XCircle /> ไม่อนุมัติรายการ
                        </DialogTitle>
                    </DialogHeader>

                    <FormTextarea
                        label="เหตุผล (*)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        error={!rejectReason.trim() ? "จำเป็นต้องระบุ" : ""}
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectDialog(false)}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!rejectReason.trim() || actionLoading}
                            onClick={handleReject}
                        >
                            ยืนยันไม่อนุมัติ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Error display */}
            {error && (
                <Alert
                    variant="destructive"
                    className="fixed bottom-4 right-4 max-w-sm z-50"
                >
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </Alert>
            )}
        </div>
    );
}

export default SaleApproveView;
