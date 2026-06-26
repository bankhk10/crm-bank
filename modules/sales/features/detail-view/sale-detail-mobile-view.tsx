"use client";

/**
 * Sale Detail Mobile View (Adapted from Sale Approve View)
 *
 * หน้า UI สำหรับดูรายละเอียดรายการขาย (Read-only)
 * รองรับการแสดงผลทั้งบน Mobile และ Desktop
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { SaleDetailResponse, SaleWithRelations } from "@/modules/sales/types";
import {
    SaleStatusLabels,
    PaymentTermLabels,
    getSaleStatusDotColor,
} from "@/modules/sales/types";
import {
    ArrowLeft,
    AlertTriangle,
    Package,
    CreditCard,
    User,
    Calendar,
    FileText,
    Gift,
    ExternalLink,
    Truck,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";
import { DetailHero } from "@/components/custom/detail-hero";
import { getSaleAction } from "../../server/actions";
import { formatAddress } from "@/lib/address-utils";

interface SaleDetailMobileViewProps {
    id: string;
}

// ----------------------------------------------------------------------
// Local UI Components
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
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
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

export function SaleDetailMobileView({ id }: SaleDetailMobileViewProps) {
    const router = useRouter();
    const { hasPermission } = usePermission("menu.sales");
    const canViewPdf = hasPermission("menu.fulfillment");

    const [data, setData] = useState<{ sale: SaleWithRelations } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSaleAction(id).then((res: any) => {
            if (res.success && res.sale) {
                setData({ sale: res.sale });
            } else {
                setError(res.error ?? "Failed to fetch");
            }
            setLoading(false);
        });
    }, [id]);

    /* Loading */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center space-y-4">
                    <div className="relative mx-auto w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-blue-600 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400 tracking-wide">กำลังโหลดข้อมูล...</p>
                </div>
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
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    ย้อนกลับ
                </Button>
            </div>
        );
    }

    if (!data) return null;

    const { sale } = data;
    const promotionalBudgetTotal = sale.items.reduce((sum, item) => {
        return sum + (Number(item.quantity) * Number(item.promotionBudget ?? 0));
    }, 0);

    const sa = (sale as any).saleAddress || {};

    const shippingAddress = formatAddress({
        addressLine: sa.shipping_address_line,
        subdistrict: sa.shipping_subdistrict,
        district: sa.shipping_district,
        province: sa.shipping_province,
        postalCode: sa.shipping_postal_code,
    });

    const receivingAddress = formatAddress({
        addressLine: sa.receiving_address_line,
        subdistrict: sa.receiving_subdistrict,
        district: sa.receiving_district,
        province: sa.receiving_province,
        postalCode: sa.receiving_postal_code,
    });

    const senderAddress = formatAddress({
        addressLine: sa.sender_line,
        subdistrict: sa.sender_subdistrict,
        district: sa.sender_district,
        province: sa.sender_province,
        postalCode: sa.sender_postal_code,
    });

    const shippingCompanyName = sa.sender_name || "-";
    const formatThaiDate = (d: any) => {
        if (!d) return "-";
        const date = new Date(d);
        const beYear = date.getFullYear() + 543;
        return format(date, `dd MMM ${beYear}`, { locale: th });
    };

    const latestShipment = sale.shipments?.[0];
    const displayCreditDueDate = latestShipment?.dueDate ?? sale.creditDueDate;
    const displayPaymentDate = latestShipment?.paymentDate ?? (sale as any).paymentDate;
    const displayDeliveryDate = latestShipment?.scheduledDate ?? sale.deliveryDate;

    return (
        <div className="min-h-screen">
            {/* ── Hero Header ──────────────────────────────────────────────── */}
            <DetailHero
                backUrl="/sales"
                backLabel="หน้ารายการขาย"
                title="รายละเอียดรายการขาย"
                icon={<FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
                accentColor="#2563eb" // Blue for detail view
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
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white bg-white/20 border border-white/20 px-3 py-1 rounded-full">
                            <span className={`h-2 w-2 rounded-full ${getSaleStatusDotColor(sale.status)}`} />
                            {SaleStatusLabels[sale.status]}
                        </span>
                    </>
                }
            />

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ── Warnings ── */}
                {sale.status === "REJECTED" && (sale as any).rejectionReason && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>รายการนี้ไม่ได้รับการอนุมัติ</AlertTitle>
                        <AlertDescription>
                            <strong>เหตุผล:</strong> {(sale as any).rejectionReason}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ── Sale Information ──────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="ข้อมูลรายการขาย"
                        />
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1 divide-y sm:divide-y-0 divide-gray-50">
                            <DetailItem
                                icon={<User className="h-4 w-4 text-gray-400" />}
                                label="ลูกค้า"
                                value={`${sale.customer.name} (${sale.customer.customerCode || "-"})`}
                            />
                            <DetailItem
                                icon={<User className="h-4 w-4 text-gray-400" />}
                                label="พนักงานขาย"
                                value={sale.employee?.name || "-"}
                            />
                            {/* วันที่ออเดอร์ */}
                            <DetailItem
                                icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                label="วันที่ออเดอร์"
                                value={formatThaiDate(sale.saleDate)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ── Sale payment ──────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="เงื่อนไขการชำระเงิน"
                            variant="dark"
                        />
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 divide-y sm:divide-y-0 divide-gray-50">
                            <DetailItem
                                icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                                label="เงื่อนไขชำระเงิน"
                                value={PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm}
                            />
                            {sale.deliveryMethod !== "CUSTOMER_PICKUP" && (
                                <DetailItem
                                    icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                    label="วันที่ต้องการของ"
                                    value={formatThaiDate(sale.requestedDeliveryDate)}
                                />
                            )}
                            <DetailItem
                                icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                label="วันครบกำหนดชำระ"
                                value={formatThaiDate(displayCreditDueDate)}
                            />
                            <DetailItem
                                icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                                label="วันที่ชำระเงิน"
                                value={formatThaiDate(displayPaymentDate)}
                            />
                        </div>
                    </div>
                </div>


                {/* ── Delivery Information ──────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-3">
                    <SectionHeader
                        icon={<Truck className="h-6 w-6" />}
                        title="ข้อมูลการจัดส่ง"
                    />
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {sale.deliveryMethod && (
                            <DetailItem
                                icon={<Truck className="h-4 w-4 text-gray-400" />}
                                label="วิธีจัดส่ง"
                                value={sale.deliveryMethod === "SALES_DELIVERY" ? "พนักงานขายจัดส่งสินค้า" : sale.deliveryMethod === "FACTORY_DELIVERY" ? "ส่งโดยรถโรงงาน" : sale.deliveryMethod === "CUSTOMER_PICKUP" ? "ลูกค้ามารับสินค้าเอง" : sale.deliveryMethod === "COURIER" ? "ส่งโดยบริษัทขนส่ง" : sale.deliveryMethod}
                            />
                        )}

                        {(sale.deliveryMethod === "FACTORY_DELIVERY" || sale.deliveryMethod === "SALES_DELIVERY") && (
                            <>
                                <DetailItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="ที่อยู่จัดส่งสินค้า" value={shippingAddress || "-"} />
                                <DetailItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="วันที่จัดส่งสินค้า" value={formatThaiDate(displayDeliveryDate)} />
                            </>
                        )}

                        {sale.deliveryMethod === "CUSTOMER_PICKUP" && (
                            <>
                                <DetailItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="วันที่มารับสินค้า" value={formatThaiDate(sale.requestedDeliveryDate)} />
                                <DetailItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="สถานที่รับสินค้า" value={receivingAddress || "-"} />
                                <DetailItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="วันที่จัดส่งสินค้า" value={formatThaiDate(displayDeliveryDate)} />
                            </>
                        )}

                        {sale.deliveryMethod === "COURIER" && (
                            <>
                                <DetailItem icon={<Truck className="h-4 w-4 text-gray-400" />} label="ชื่อบริษัทขนส่ง" value={shippingCompanyName} />
                                <DetailItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="ที่อยู่บริษัทขนส่ง" value={senderAddress || "-"} />
                                <DetailItem icon={<MapPin className="h-4 w-4 text-gray-400" />} label="ที่อยู่จัดส่งสินค้า" value={shippingAddress || "-"} />
                                <DetailItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="วันที่จัดส่งสินค้า" value={formatThaiDate(displayDeliveryDate)} />
                            </>
                        )}

                        {!sale.deliveryMethod && (sale.customer?.addressLine || sale.customer?.province) && (
                            <DetailItem
                                icon={<MapPin className="h-4 w-4 text-gray-400" />}
                                label="ที่อยู่จัดส่ง"
                                value={[
                                    sale.customer?.addressLine,
                                    sale.customer?.district,
                                    sale.customer?.province,
                                    sale.customer?.postalCode,
                                ].filter(Boolean).join(" ") || "-"}
                            />
                        )}
                    </div>
                </div>

                {/* รายการสินค้า */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<Package className="h-6 w-6" />}
                        title="รายการสินค้า"
                    />

                    {/* Mobile Card View */}
                    <div className="block md:hidden">
                        <div className="p-4 space-y-4">
                            {sale.items.map((item: any, i: number) => {
                                const currentUnitPrice = Number(item.unitPrice ?? 0);
                                const quantity = Number(item.quantity ?? 0);
                                const currentTotal = Number(
                                    item.totalPrice ?? currentUnitPrice * quantity
                                );
                                const priceChanged = Boolean(item.priceModified);
                                const packSize = parseFloat(
                                    item.product?.packageSizePerBox?.toString() || "1"
                                );
                                const multiplier =
                                    isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                                const cartonPrice = currentUnitPrice * multiplier;

                                return (
                                    <div
                                        key={item.id ?? i}
                                        className={`rounded-2xl border transition-all shadow-sm overflow-hidden ${priceChanged
                                            ? "bg-orange-50/30 border-orange-200"
                                            : "bg-white border-gray-100 shadow-gray-200/40"
                                            }`}
                                    >
                                        <div className={`px-4 py-3 border-b ${priceChanged ? "border-orange-100 bg-orange-100/20" : "border-gray-50 bg-gray-50/30"}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-base leading-tight">
                                                        {item.product?.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {item.product?.productCode}
                                                        </span>
                                                        {priceChanged && (
                                                            <Badge className="bg-orange-500 text-white border-none text-[9px] h-4 px-1.5">
                                                                รายการพิเศษ
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tight mb-1">จำนวน</span>
                                                    <p className="font-black text-gray-900 text-lg">
                                                        {item.quantity}
                                                        <span className="ml-1 text-xs font-medium text-gray-400">{item.product?.unit || "-"}</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tight mb-1">บรรจุ</span>
                                                    <p className="font-bold text-gray-900">
                                                        {item.product?.packageSizePerBox || "-"}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tight mb-1">ราคา/หน่วย</span>
                                                    <p className={`font-bold ${priceChanged ? "text-orange-600" : "text-gray-900"}`}>
                                                        ฿{currentUnitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tight">ราคาต่อลัง</span>
                                                    <p className="font-semibold text-gray-600">
                                                        ฿{cartonPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-blue-500 text-[10px] uppercase font-bold tracking-tight">ราคารวมสุทธิ</span>
                                                    <p className={`font-black text-xl ${priceChanged ? "text-orange-700" : "text-blue-600"}`}>
                                                        ฿{currentTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            {Number(item.promotionBudget ?? 0) > 0 && (
                                                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-emerald-600 text-[9px] uppercase font-bold">งบส่งเสริม (฿{Number(item.promotionBudget).toLocaleString()}/ลัง)</span>
                                                        <p className="font-bold text-emerald-700">
                                                            ฿{(Number(item.quantity) * Number(item.promotionBudget)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <Gift className="h-4 w-4 text-emerald-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        {/* Mobile Summary */}
                        <div className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100 p-6 space-y-4 rounded-b-xl">

                            {promotionalBudgetTotal > 0 && (
                                <div className="flex justify-between items-center text-gray-700">
                                    <span className="text-sm font-medium">งบส่งเสริมการขายรวม</span>
                                    <span className="text-base font-semibold">
                                        ฿{Number(promotionalBudgetTotal).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-gray-700">
                                <span className="text-sm font-medium">รวมเป็นเงิน</span>
                                <span className="text-base font-semibold">
                                    ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>

                            {Number(sale.shippingCost) > 0 && (
                                <div className="flex justify-between items-center text-rose-600">
                                    <span className="text-sm font-medium text-gray-600">ส่วนลดค่าขนส่ง</span>
                                    <span className="text-base font-semibold">
                                        -฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            {Number(sale.otherCosts) > 0 && (
                                <div className="flex justify-between items-start text-rose-600">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-600">ส่วนลดหน้าบิล</span>
                                    </div>
                                    <span className="text-base font-semibold">
                                        -฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            {Number(sale.promotionalCreditUsed) > 0 && (
                                <div className="flex justify-between items-center text-rose-600">
                                    <span className="text-sm font-medium text-gray-600">เครดิตส่งเสริมการขาย</span>
                                    <span className="text-base font-semibold">
                                        -฿{Number(sale.promotionalCreditUsed).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-md uppercase tracking-wider text-gray-700 font-bold mb-1">ยอดสุทธิ</span>
                                    </div>
                                    <span className="text-3xl font-black text-blue-600">
                                        ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop/Tablet View with Horizontal Scroll */}
                    <div className="hidden md:block overflow-x-auto">
                        <div className="p-6 min-w-[1100px]">
                            {/* Modern Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 rounded-2xl mb-4 text-[10px] uppercase tracking-[0.15em] font-black text-gray-400 border border-gray-100 shadow-sm">
                                <div className="col-span-3 flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" /> สินค้า
                                </div>
                                <div className="col-span-1 text-center">จำนวน</div>
                                <div className="col-span-1 text-center">หน่วย</div>
                                <div className="col-span-1 text-center">บรรจุ</div>
                                <div className="col-span-1 text-right">ราคา/หน่วย</div>
                                <div className="col-span-1 text-right">ราคา/ลัง</div>
                                <div className="col-span-1 text-right">งบ/ลัง</div>
                                <div className="col-span-2 text-right">ราคารวม</div>
                            </div>

                            {sale.items.map((item: any, i: number) => {
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
                                    item.product?.packageSizePerBox?.toString() || "1"
                                );
                                const multiplier =
                                    isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                                const cartonPrice = item.cartonPrice;

                                return (
                                    <div
                                        key={item.id ?? i}
                                        className={`group relative rounded-2xl border transition-all duration-300 mb-3 hover:translate-y-[-2px] ${priceChanged
                                            ? "bg-orange-50/20 border-orange-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-200/20"
                                            : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-gray-200/40"
                                            }`}
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center p-5">
                                            {/* Product Info */}
                                            <div className="col-span-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-[15px] group-hover:text-blue-600 transition-colors leading-tight">
                                                        {item.product?.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest bg-gray-50 self-start px-1.5 py-0.5 rounded border border-gray-100">
                                                        {item.product?.productCode}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-1 text-center">
                                                <span className="text-gray-900 font-black text-lg bg-gray-50/50 w-11 h-11 inline-flex items-center justify-center rounded-xl border border-gray-100 group-hover:bg-white transition-colors">
                                                    {item.quantity}
                                                </span>
                                            </div>

                                            {/* Unit */}
                                            <div className="col-span-1 text-center">
                                                <span className="text-gray-500 font-bold text-xs uppercase tracking-wide">
                                                    {item.product?.unit || "-"}
                                                </span>
                                            </div>

                                            {/* Package Size */}
                                            <div className="col-span-1 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="px-2 py-0.5 bg-gray-100/50 rounded-lg text-xs font-black text-gray-700 border border-gray-100">
                                                        {item.product?.packageSizePerBox || "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="col-span-1 text-right">
                                                <span className={`font-bold text-sm ${priceChanged ? "text-orange-600" : "text-gray-900"}`}>
                                                    ฿{currentUnitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* Carton Price */}
                                            <div className="col-span-1 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-gray-700 font-black text-sm">
                                                        ฿{cartonPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Promotion Budget Per Unit */}
                                            <div className="col-span-1 text-center">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-sm leading-none">
                                                        {Number(item.promotionBudget ?? 0) > 0
                                                            ? `฿${Number(item.promotionBudget).toLocaleString()}`
                                                            : "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="col-span-2 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-black text-xl ${priceChanged ? "text-orange-700" : "text-blue-600"}`}>
                                                        ฿{currentTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary */}
                            <div className="mt-6 border-t border-gray-200 pt-6 px-4 md:px-0 flex flex-col md:flex-row justify-between items-end">
                                <div className="w-full md:w-1/2 space-y-4">
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                                งบส่งเสริมการขายรวม
                                            </span>
                                            <span className="text-lg font-bold text-emerald-600">
                                                ฿{promotionalBudgetTotal.toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3 mt-6 md:mt-0 space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20">
                                    <div className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>รวมเป็นเงิน</span>
                                        <span>
                                            ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    {Number(sale.shippingCost) > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-rose-500">
                                            <span>ส่วนลดค่าขนส่ง</span>
                                            <span>
                                                -฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {Number(sale.otherCosts) > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-rose-500">
                                            <div className="flex flex-col">
                                                <span>ส่วนลดหน้าบิล</span>
                                            </div>
                                            <span>
                                                -฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {Number(sale.promotionalCreditUsed) > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-rose-500">
                                            <span>เครดิตส่งเสริมการขาย</span>
                                            <span>
                                                -฿{Number(sale.promotionalCreditUsed).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-gray-900">ยอดสุทธิ</span>
                                            <span className="text-2xl font-black text-blue-600">
                                                ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Notes ─────────────────────────────────────────────── */}
                {(sale.notes || (sale as any).approverNotes || (sale as any).managerNotes) && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="หมายเหตุ"
                            variant="dark"
                        />
                        <div className="p-6 space-y-4">
                            {sale.notes && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">หมายเหตุ (คนสร้าง)</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {sale.notes}
                                    </p>
                                </div>
                            )}
                            {(sale as any).approverNotes && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">หมายเหตุ (คนอนุมัติ)</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {(sale as any).approverNotes}
                                    </p>
                                </div>
                            )}
                            {(sale as any).managerNotes && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">หมายเหตุ (คนจัดการคำสั่งขาย)</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {(sale as any).managerNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {sale.otherCostsDescription && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<FileText className="h-6 w-6" />}
                            title="รายละเอียดส่วนลดหน้าบิล"
                        />
                        <div className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {sale.otherCostsDescription}
                            </p>
                        </div>
                    </div>

                )}

                {/* ── Action Buttons ─────────────────────────────────────────────── */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto h-11 border-gray-200 text-gray-700 font-medium px-6 hover:bg-gray-50"
                        asChild
                    >
                        <Link href="/sales">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            กลับหน้าข้อมูลการขาย
                        </Link>
                    </Button>
                    {canViewPdf && (
                        <>
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium px-6 shadow-md shadow-blue-500/20"
                            >
                                <Link href={`/sales/${sale.id}/detail`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสาร PDF
                                    <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-11 font-medium px-6 shadow-md shadow-amber-500/20"
                            >
                                <Link href={`/sales/${sale.id}/special-detail`} target="_blank">
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสารพิเศษ PDF
                                    <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
                <br></br>
                <br></br>
                <br></br>
            </div>
        </div>
    );
}
