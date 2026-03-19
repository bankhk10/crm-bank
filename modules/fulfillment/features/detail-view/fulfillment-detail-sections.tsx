"use client";

import React from "react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CreditCard,
    FileText,
    Package,
    TrendingDown,
    Truck,
    User,
    CreditCard as CreditCardIcon,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    PaymentTermLabels,
    SaleStatusLabels,
    getSaleStatusColor,
} from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";

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

export function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl animate-pulse"></div>
                </div>
                <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
        </div>
    );
}

export function PermissionDenied() {
    return (
        <div className="container mx-auto py-8 px-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-red-800 font-medium">
                    คุณไม่มีสิทธิ์เข้าถึงหน้านี้
                </AlertDescription>
            </Alert>
        </div>
    );
}

export function SaleSummaryCard({
    sale,
    onBack,
}: {
    sale: Sale;
    onBack: () => void;
}) {
    const requestedDateLabel =
        sale.deliveryMethod === "CUSTOMER_PICKUP"
            ? "วันที่มารับสินค้า"
            : sale.deliveryMethod === "SALES_DELIVERY"
                ? "วันที่ต้องการให้ส่งของ"
                : "วันที่ต้องการของ";

    const requestedDate = sale.requestedDeliveryDate
        ? (() => {
            const date = new Date(sale.requestedDeliveryDate);
            const year = date.getFullYear() + 543;
            return format(date, `d MMM ${year}`, { locale: th });
        })()
        : "-";

    return (
        <Card className="py-0! rounded-3xl shadow-2xl bg-white border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8 rounded-t-3xl">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="inline-flex items-center text-blue-100 hover:text-white transition-colors group hover:bg-white/10 w-fit"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    กลับไปหน้ารายการขาย
                </Button>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                            <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                                จัดการสถานะการขาย
                            </h1>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
                                <span className="font-mono font-bold text-blue-100 bg-white/10 px-3 py-1 rounded-lg w-fit">
                                    {sale.saleNumber}
                                </span>
                                <span className="text-blue-100 hidden sm:inline">•</span>
                                <span className="text-blue-50 font-medium truncate">
                                    {sale.customer.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    {sale.saleOrderRef && (
                        <div className="flex flex-col sm:items-end gap-1 animate-in fade-in slide-in-from-right-4 duration-500">
                            <span className="text-[10px] sm:text-sm font-bold text-blue-100/80 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText className="h-3 w-3 sm:h-5 sm:w-5" />
                                เลขที่คำสั่งขาย
                            </span>
                            <Badge
                                variant="outline"
                                className="text-lg sm:text-xl font-mono font-bold border-2 border-white/20 text-white bg-white/10 px-4 py-1.5 rounded-xl shadow-lg backdrop-blur-md"
                            >
                                {sale.saleOrderRef}
                            </Badge>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    {/* ข้อมูลชื่อลูกค้า */}
                    <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-blue-700 font-bold uppercase tracking-wide">
                                ข้อมูลชื่อลูกค้า
                            </span>
                        </div>
                        <p
                            className="font-bold text-gray-900 text-base sm:text-lg wrap-break-word"
                            title={sale.customer.name}
                        >
                            {sale.customer.name}
                        </p>
                    </div>

                    {/* ชื่อพนักงานขาย */}
                    <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-indigo-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-indigo-700 font-bold uppercase tracking-wide">
                                ชื่อพนักงานขาย
                            </span>
                        </div>
                        <p
                            className="font-bold text-gray-900 text-base sm:text-lg wrap-break-word"
                            title={sale.employee.name}
                        >
                            {sale.employee.name}
                        </p>
                    </div>

                    {/* วันที่รับ/ส่งสินค้า */}
                    <div className="group bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-5 border border-pink-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-pink-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-pink-700 font-bold uppercase tracking-wide">
                                {requestedDateLabel}
                            </span>
                        </div>
                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                            {requestedDate}
                        </p>
                    </div>

                    {/* เงื่อนไขชำระ */}
                    <div className="group bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                                <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-green-700 font-bold uppercase tracking-wide">
                                เงื่อนไขชำระ
                            </span>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-sm font-bold px-3 py-1.5 bg-white border-green-300 text-green-700 max-w-full"
                            title={PaymentTermLabels[sale.paymentTerm]}
                        >
                            <span className="truncate block">
                                {PaymentTermLabels[sale.paymentTerm]}
                            </span>
                        </Badge>
                    </div>

                    {/* สถานะปัจจุบัน */}
                    <div className="group bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-orange-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm text-orange-700 font-bold uppercase tracking-wide">
                                สถานะปัจจุบัน
                            </span>
                        </div>
                        <Badge
                            variant="secondary"
                            className={cn(
                                "font-bold px-3 py-1.5",
                                getSaleStatusColor(sale.status),
                            )}
                        >
                            {SaleStatusLabels[sale.status]}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function PriceWarningsCard({
    priceWarnings,
}: {
    priceWarnings: NonNullable<SaleDetailResponse["priceWarnings"]>;
}) {
    return (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-lg">
            <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-lg text-orange-900">
                    <div className="p-2 bg-orange-100 rounded-xl">
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                    </div>
                    พบการเปลี่ยนแปลงราคา
                </CardTitle>
                <p className="text-sm text-orange-800">
                    กรุณาตรวจสอบรายการด้านล่าง
                    ระบบตรวจพบการแก้ไขราคาจากค่ามาตรฐาน
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {priceWarnings.map((w, i) => {
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
                                        ฿{formatBaht(original)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-orange-50 p-3 border border-orange-100">
                                    <span className="text-gray-500 text-xs">ราคาปัจจุบัน</span>
                                    <p className="text-orange-700 font-bold">
                                        ฿{formatBaht(modified)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-3 border border-orange-100">
                                    <span className="text-gray-500 text-xs">ส่วนต่าง</span>
                                    <p
                                        className={`font-bold ${diffPositive ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {diffPositive ? "+" : ""}
                                        {formatBaht(diff)} บาท
                                        <span className="text-xs block text-gray-500">
                                            ({diffPercent.toFixed(2)}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export function StockWarningAlert({
    stockWarnings,
}: {
    stockWarnings: StockWarning[];
}) {
    return (
        <Alert className="border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 text-sm p-4 leading-relaxed block shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span className="font-semibold text-amber-800 text-base">
                    ⚠️ สต็อกสินค้าไม่เพียงพอ - ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งได้
                </span>
            </div>
            <div className="space-y-1 ml-7">
                {stockWarnings.map((w, i) => (
                    <div
                        key={i}
                        className="flex flex-wrap items-center gap-x-1 text-amber-700"
                    >
                        <span>•</span>
                        <span className="font-medium">
                            {w.productName} - {w.productCode}
                        </span>
                        <span>- ต้องการ:</span>
                        <span className="font-semibold text-red-600">{w.requested}</span>
                        <span>| คงเหลือ:</span>
                        <span className="font-semibold text-red-600">{w.available}</span>
                    </div>
                ))}
            </div>
        </Alert>
    );
}

export function CreditInfoCard({
    creditInfo,
}: {
    creditInfo: NonNullable<SaleDetailResponse["creditInfo"]>;
}) {
    return (
        <Card
            className={`backdrop-blur-lg rounded-2xl p-6 shadow-sm border-2 ${creditInfo.willExceedLimit
                ? "border-red-300 bg-red-50/60"
                : "border-green-300 bg-green-50/60"
                }`}
        >
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <CreditCardIcon className="text-blue-600" /> ข้อมูลวงเงินเครดิต
                {creditInfo.willExceedLimit && (
                    <Badge variant="destructive" className="ml-2 text-xs px-2 py-1">
                        เกินวงเงิน
                    </Badge>
                )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <span className="text-sm text-gray-600">วงเงิน</span>
                    <p className="font-bold text-xl text-gray-900 mt-1 wrap-break-word">
                        ฿{creditInfo.creditLimit.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <span className="text-sm text-gray-600">คงเหลือ</span>
                    <p
                        className={`font-bold text-xl mt-1 wrap-break-word ${creditInfo.willExceedLimit ? "text-red-600" : "text-green-600"}`}
                    >
                        ฿{creditInfo.availableCredit.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <span className="text-sm text-gray-600">ยอดขายนี้</span>
                    <p className="font-bold text-xl text-purple-600 mt-1 wrap-break-word">
                        ฿{creditInfo.currentSaleAmount.toLocaleString()}
                    </p>
                </div>
            </div>
        </Card>
    );
}

export function ItemsCard({ sale }: { sale: Sale }) {
    return (
        <Card className="!py-0 rounded-3xl shadow-xl border-2 border-blue-100 overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="p-6 border-b-2 border-blue-100 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-3xl">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    รายการสินค้า
                </CardTitle>
            </CardHeader>

            {/* 📱 Mobile Card View */}
            <div className="block lg:hidden">
                <div className="p-4 space-y-3">
                    {sale.items.map((item, i) => {
                        const originalUnitPrice = Number(
                            item.originalPrice ?? item.unitPrice ?? 0,
                        );
                        const currentUnitPrice = Number(item.unitPrice ?? 0);
                        const quantity = Number(item.quantity ?? 0);
                        const currentTotal = Number(
                            item.totalPrice ?? currentUnitPrice * quantity,
                        );
                        const priceChanged = Boolean(item.priceModified);
                        const cartonPrice = getCartonPrice(
                            currentUnitPrice,
                            item.product.packageSizePerBox,
                        );

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
                                            className={`font-bold ${priceChanged ? "text-orange-700" : "text-gray-900"}`}
                                        >
                                            {formatBaht(currentUnitPrice)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <span className="text-gray-500 text-xs block mb-1">
                                            ราคา/ลัง
                                        </span>
                                        <p className="font-bold text-gray-900">
                                            {formatBaht(cartonPrice)}
                                        </p>
                                    </div>

                                    {/* Row 3: Total */}
                                    <div className="col-span-2 bg-blue-50/50 rounded-lg p-3 text-right">
                                        <span className="text-gray-500 text-xs block mb-1">
                                            ราคารวม
                                        </span>
                                        <p
                                            className={`font-bold text-lg ${priceChanged ? "text-orange-700" : "text-blue-600"}`}
                                        >
                                            {formatBaht(currentTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-5 space-y-3">
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-700">
                            รวมเป็นเงิน
                        </span>
                        <span className="text-base font-bold text-gray-900">
                            {formatBaht(Number(sale.subtotalAmount))}
                        </span>
                    </div>

                    {Number(sale.shippingCost) > 0 && (
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
                            <span className="text-base font-semibold text-red-600">
                                -{formatBaht(Number(sale.shippingCost))}
                            </span>
                        </div>
                    )}

                    {Number(sale.otherCosts) > 0 && (
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                            <span className="text-base font-semibold text-red-600">
                                -{formatBaht(Number(sale.otherCosts))}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
                        <span className="text-lg font-bold text-gray-900">ยอดสุทธิ</span>
                        <span className="text-2xl font-bold text-blue-700">
                            {formatBaht(Number(sale.totalAmount))}
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
                    {sale.items.map((item, i) => {
                        const originalUnitPrice = Number(
                            item.originalPrice ?? item.unitPrice ?? 0,
                        );
                        const currentUnitPrice = Number(item.unitPrice ?? 0);
                        const quantity = Number(item.quantity ?? 0);
                        const currentTotal = Number(
                            item.totalPrice ?? currentUnitPrice * quantity,
                        );
                        const originalTotal = originalUnitPrice * quantity;
                        const priceChanged = Boolean(item.priceModified);
                        const cartonPrice = getCartonPrice(
                            currentUnitPrice,
                            item.product.packageSizePerBox,
                        );

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
                                        <p className="font-bold text-gray-900 text-sm md:text-base">
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
                                            className={`font-bold text-sm md:text-base ${priceChanged ? "text-orange-700" : "text-gray-900"}`}
                                        >
                                            {formatBaht(currentUnitPrice)}
                                        </p>
                                        {priceChanged && (
                                            <p className="text-xs text-gray-500 line-through mt-0.5">
                                                {formatBaht(originalUnitPrice)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Carton Price */}
                                    <div className="col-span-1 text-right">
                                        <p className="font-bold text-gray-900 text-sm md:text-base">
                                            {formatBaht(cartonPrice)}
                                        </p>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-2 text-right">
                                        <p
                                            className={`font-bold text-sm md:text-lg ${priceChanged ? "text-orange-700" : "text-blue-600"}`}
                                        >
                                            {formatBaht(currentTotal)}
                                        </p>
                                        {priceChanged && (
                                            <p className="text-xs text-gray-500 line-through mt-0.5">
                                                {formatBaht(originalTotal)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-6">
                    <div className="max-w-md ml-auto">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                                รวมเป็นเงิน
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatBaht(Number(sale.subtotalAmount))}
                            </span>
                        </div>

                        {Number(sale.shippingCost) > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
                                <span className="text-lg font-semibold text-red-600">
                                    -{formatBaht(Number(sale.shippingCost))}
                                </span>
                            </div>
                        )}

                        {Number(sale.otherCosts) > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                                <span className="text-lg font-semibold text-red-600">
                                    -{formatBaht(Number(sale.otherCosts))}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t-2 border-blue-300">
                            <span className="text-xl font-bold text-gray-900">
                                ยอดสุทธิ
                            </span>
                            <span className="text-3xl font-bold text-blue-700">
                                {formatBaht(Number(sale.totalAmount))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
