"use client";

import React from "react";
import {
    AlertTriangle,
    BadgeCheck,
    Building2,
    Calendar,
    CheckCircle2,
    FileText,
    Package,
    Truck,
    User,
    CreditCard as CreditCardIcon,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    PaymentTermLabels,
    SaleStatusLabels,
    getSaleStatusColor,
} from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";
import { DetailHero } from "@/components/custom/detail-hero";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";

const formatBaht = (value: number) =>
    value.toLocaleString("th-TH", { minimumFractionDigits: 2 });

const getCartonPrice = (
    unitPrice: number,
    packageSize?: string | number | null,
) => {
    const packSize = parseFloat(packageSize?.toString() || "1");
    const multiplier = Number.isFinite(packSize) && packSize > 0 ? packSize : 1;
    return unitPrice * multiplier;
};

type Sale = SaleDetailResponse["sale"];

const formatThaiDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const year = date.getFullYear() + 543;
    return format(date, `d MMM ${year}`, { locale: th });
};

export function LoadingScreen() {
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

export function PermissionDenied() {
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

export function SaleSummaryCard({
    sale,
    backUrl,
}: {
    sale: Sale;
    backUrl: string;
}) {
    const heroBadges = (
        <>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                <BadgeCheck className="h-3.5 w-3.5 text-[#FCA5A5]" />
                {sale.saleNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-white/80 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <User className="h-3.5 w-3.5 text-white/60" />
                {sale.customer.name}
            </span>
            {sale.saleOrderRef && (
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-white/80 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    <FileText className="h-3.5 w-3.5 text-white/60" />
                    {sale.saleOrderRef}
                </span>
            )}
        </>
    );

    return (
        <div className="space-y-5">
            <DetailHero
                backUrl={backUrl}
                backLabel="หน้ารายการการส่งสินค้า"
                title={sale.saleNumber}
                icon={<Truck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
                accentColor="#B91C1C"
                badges={heroBadges}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-2">
                    <SectionHeader
                        icon={<FileText className="h-6 w-6" />}
                        title="ข้อมูลการขาย"
                    />
                    <div className="p-6 space-y-1 divide-y divide-gray-50">
                        <DetailItem
                            icon={<User className="h-4 w-4 text-gray-400" />}
                            label="ลูกค้า"
                            value={sale.customer.name}
                        />
                        <DetailItem
                            icon={<Building2 className="h-4 w-4 text-gray-400" />}
                            label="พนักงานขาย"
                            value={sale.employee.name}
                        />
                        <DetailItem
                            icon={<FileText className="h-4 w-4 text-gray-400" />}
                            label="เลขที่คำสั่งขาย"
                            value={sale.saleOrderRef || "-"}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<Calendar className="h-6 w-6" />}
                        title="เงื่อนไขการขาย"
                        variant="dark"
                    />
                    <div className="p-6 space-y-1 divide-y divide-gray-50">
                        <DetailItem
                            icon={<Calendar className="h-4 w-4 text-gray-400" />}
                            label="วันที่ต้องการรับสินค้า"
                            value={formatThaiDate(sale.requestedDeliveryDate)}
                        />
                        <DetailItem
                            icon={<CreditCardIcon className="h-4 w-4 text-gray-400" />}
                            label="เงื่อนไขชำระ"
                            value={PaymentTermLabels[sale.paymentTerm]}
                        />
                        <DetailItem
                            icon={<CheckCircle2 className="h-4 w-4 text-gray-400" />}
                            label="สถานะปัจจุบัน"
                            value={
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                        getSaleStatusColor(sale.status),
                                    )}
                                >
                                    {SaleStatusLabels[sale.status]}
                                </span>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


export function StockWarningAlert({
    stockWarnings,
}: {
    stockWarnings: StockWarning[];
}) {
    return (
        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden shadow-sm">
            <SectionHeader
                icon={<Package className="h-6 w-6" />}
                title="สินค้าบางรายการสต็อกไม่พอ"
            />
            <div className="p-6 space-y-3">
                {stockWarnings.map((w, i) => (
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
    );
}

export function CreditInfoCard({
    creditInfo,
}: {
    creditInfo: NonNullable<SaleDetailResponse["creditInfo"]>;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <SectionHeader
                icon={<CreditCardIcon className="h-6 w-6" />}
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
    );
}

export function ItemsCard({ sale }: { sale: Sale }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <SectionHeader
                icon={<Package className="h-6 w-6" />}
                title="รายการสินค้า"
            />

            {/* 📱 Mobile Card View */}
            <div className="block lg:hidden">
                <div className="p-4 space-y-3">
                    {sale.items.map((item, i) => {
                        const currentUnitPrice = Number(item.unitPrice ?? 0);
                        const quantity = Number(item.quantity ?? 0);
                        const currentTotal = Number(
                            item.totalPrice ?? currentUnitPrice * quantity,
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
                    <div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-5 py-2 text-base md:text-base text-gray-800 font-semibold border-b border-gray-100">
                        <div className="col-span-4">สินค้า</div>
                        <div className="col-span-1 text-center">จำนวน</div>
                        <div className="col-span-1 text-center">หน่วย</div>
                        <div className="col-span-1 text-center">บรรจุ</div>
                        <div className="col-span-2 text-center">ราคา/หน่วย</div>
                        <div className="col-span-1 text-center">ราคา/ลัง</div>
                        <div className="col-span-2 text-center">รวม</div>
                    </div>
                    {sale.items.map((item, i) => {
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
                                className={`rounded-2xl border-2 p-3 md:p-4 transition-all shadow-sm ${priceChanged
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
                                    <div className="col-span-1 text-center">{item.quantity}</div>

                                    {/* Unit */}
                                    <div className="col-span-1 text-center">
                                        {item.product.unit || "-"}
                                    </div>

                                    {/* Package Size */}
                                    <div className="col-span-1 text-center">
                                        {item.product.packageSizePerBox || "-"}
                                    </div>

                                    {/* Unit Price */}
                                    <div className="col-span-2 text-center">
                                        <p
                                            className={`${priceChanged ? "text-orange-700" : "text-gray-900"
                                                }`}
                                        >
                                            {currentUnitPrice.toLocaleString("th-TH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>

                                    {/* Carton Price */}
                                    <div className="col-span-1 text-center">
                                        {cartonPrice.toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
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
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Summary */}
                <div className="bg-gray-50 border-t-2 border-gray-100 p-6">
                    <div className="max-w-md ml-auto">
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

                        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
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
    );
}
