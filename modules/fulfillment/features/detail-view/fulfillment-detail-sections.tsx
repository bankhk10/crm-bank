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
    Gift,
    TrendingDown,
    Info,
    MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/address-utils";
import {
    PaymentTermLabels,
    SaleStatusLabels,
    getSaleStatusColor,
} from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";
import { DetailHero } from "@/components/custom/detail-hero";
import { DetailItem } from "@/components/custom/detail-item";
import { SectionHeader } from "@/components/custom/section-header";

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
            <div className="p-2.5 bg-linear-to-br from-red-500 to-rose-600 rounded-xl text-white shadow-lg shadow-red-500/20">
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
                backLabel="หน้ารายการการจัดการคำสั่งขาย"
                title="จัดการข้อมูลคำสั่งขาย"
                icon={<Truck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />}
                accentColor="#B91C1C"
                badges={heroBadges}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm lg:col-span-1">
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

            {sale.notes && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<FileText className="h-6 w-6" />}
                        title="หมายเหตุ"
                        variant="dark"
                    />
                    <div className="p-6">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {sale.notes}
                        </p>
                    </div>
                </div>
            )}

            {sale.otherCostsDescription && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <SectionHeader
                        icon={<Info className="h-6 w-6" />}
                        title="รายละเอียดส่วนลดหน้าบิล"
                        variant="dark"
                    />
                    <div className="p-6">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {sale.otherCostsDescription}
                        </p>
                    </div>
                </div>
            )}
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

export function DeliveryInfoCard({ sale }: { sale: Sale }) {
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

    const latestShipment = sale.shipments?.[0];
    const displayDeliveryDate = latestShipment?.scheduledDate ?? sale.deliveryDate;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
    );
}

export function ItemsCard({ sale }: { sale: Sale }) {
    const promotionalBudgetTotal = sale.items.reduce((sum, item: any) => {
        return sum + (Number(item.quantity) * Number(item.promotionBudget ?? 0));
    }, 0);

    return (
        <div className="space-y-6">
            {/* รายการของแถม */}
            {sale.items.some((item) => (item.product.freeItems?.length ?? 0) > 0) && (
                <AppCard>
                    <AppSectionHeader title="รายการของแถม" icon={Gift} />

                    <div className="space-y-4">
                        {sale.items.map((saleItem, itemIdx) => {
                            if (!saleItem.product.freeItems?.length) return null;

                            return (
                                <div key={itemIdx} className="space-y-2">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {saleItem.product.name}
                                    </p>

                                    <div className="space-y-2">
                                        {saleItem.product.freeItems.map((freeItem, index) => (
                                            <div
                                                key={index}
                                                className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span>ซื้อ {freeItem.purchaseQty}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="font-medium text-green-700">
                                                        แถม {freeItem.freeQty}
                                                    </span>

                                                    {freeItem.netPrice != null && freeItem.netPrice !== 0 && (
                                                        <span className="text-gray-500">
                                                            | ราคาสุทธิ ฿
                                                            {Number(freeItem.netPrice).toLocaleString("th-TH", {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    )}

                                                    {freeItem.notes && (
                                                        <span className="text-gray-500">
                                                            | {freeItem.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AppCard>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <SectionHeader
                    icon={<Package className="h-6 w-6" />}
                    title="รายการสินค้า"
                />

                {/* Mobile Card View */}
                <div className="block md:hidden">
                    <div className="p-4 space-y-3">
                        {sale.items.map((item: any, i: number) => {
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
                                            {item.lotAllocations && item.lotAllocations.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {item.lotAllocations.map((alloc: any, idx: number) => (
                                                        <div key={idx} className="text-[10px] text-gray-600 bg-purple-50 px-2 py-1 rounded-md inline-flex items-center gap-1 border border-purple-100">
                                                            <span className="font-bold text-purple-700">LOT: {alloc.lot?.lotNumber || "-"}</span>
                                                            <span className="text-purple-300">|</span>
                                                            <span>จำนวน: {alloc.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
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
                                        {Number(item.promotionBudget ?? 0) > 0 && (
                                            <div className="col-span-2 bg-emerald-50/50 rounded-lg p-3 text-right border border-emerald-100 mt-1">
                                                <span className="text-emerald-500 text-xs block mb-1">
                                                    งบส่งเสริม (฿{Number(item.promotionBudget).toLocaleString()}/ลัง)
                                                </span>
                                                <p className="font-bold text-emerald-600">
                                                    ฿{(Number(item.quantity) * Number(item.promotionBudget)).toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Summary */}
                    <div className="bg-linear-to-br from-gray-50 to-white border-t border-gray-100 p-6 space-y-4 rounded-b-xl">

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
                            <div className="flex justify-between items-center text-rose-600">
                                <span className="text-sm font-medium text-gray-600">ส่วนลดหน้าบิล</span>
                                <span className="text-base font-semibold">
                                    -฿{Number(sale.otherCosts).toLocaleString("th-TH", {
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
                                <span className="text-3xl font-black text-[#28a717]">
                                    ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="p-6">
                        {/* Modern Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 rounded-xl mb-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 border border-gray-100 shadow-sm">
                            <div className="col-span-5 flex items-center gap-2">
                                <Package className="h-3 w-3" /> สินค้า
                            </div>
                            <div className="col-span-1 text-center">จำนวน</div>
                            <div className="col-span-1 text-center">หน่วย</div>
                            <div className="col-span-1 text-center">บรรจุ</div>
                            <div className="col-span-1 text-right">ราคา/หน่วย</div>
                            <div className="col-span-1 text-right">ราคา/ลัง</div>
                            <div className="col-span-1 text-center">งบ/ลัง</div>
                            <div className="col-span-1 text-right">ราคารวม</div>
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
                                item.product.packageSizePerBox?.toString() || "1"
                            );
                            const multiplier =
                                isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                            const cartonPrice = currentUnitPrice * multiplier;

                            return (
                                <div
                                    key={item.id ?? i}
                                    className={`group relative rounded-2xl border transition-all duration-300 mb-3 hover:translate-x-1 ${priceChanged
                                        ? "bg-orange-50/40 border-orange-200 hover:border-orange-300 hover:shadow-orange-100 shadow-sm"
                                        : "bg-white border-gray-100 hover:border-[#1c6bb9]/30 hover:shadow-xl hover:shadow-gray-200/50"
                                        }`}
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center p-4 md:p-5">
                                        {/* Product Info */}
                                        <div className="col-span-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 text-base group-hover:text-[#1c6bb9] transition-colors leading-tight">
                                                    {item.product.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tighter">
                                                    {item.product.productCode}
                                                </span>
                                                {priceChanged && (
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold border border-orange-200">
                                                            <TrendingDown className="h-2.5 w-2.5" /> รายการพิเศษ
                                                        </span>
                                                    </div>
                                                )}
                                                {item.lotAllocations && item.lotAllocations.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {item.lotAllocations.map((alloc: any, idx: number) => (
                                                            <div key={idx} className="text-[10px] text-gray-600 bg-purple-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 border border-purple-100">
                                                                <span className="font-bold text-purple-700">LOT: {alloc.lot?.lotNumber || "-"}</span>
                                                                <span className="text-purple-300">|</span>
                                                                <span>จำนวน: {alloc.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-1 text-center">
                                            <span className="text-gray-900 font-bold text-lg bg-gray-50 w-10 h-10 inline-flex items-center justify-center rounded-xl border border-gray-100 group-hover:bg-white transition-colors">
                                                {item.quantity}
                                            </span>
                                        </div>

                                        {/* Unit */}
                                        <div className="col-span-1 text-center">
                                            <span className="text-gray-500 font-medium text-sm">
                                                {item.product.unit || "-"}
                                            </span>
                                        </div>

                                        {/* Package Size */}
                                        <div className="col-span-1 text-center">
                                            <span className="px-2 py-1 bg-gray-100/50 rounded-md text-xs font-bold text-gray-600 border border-gray-100">
                                                {item.product.packageSizePerBox || "-"}
                                            </span>
                                        </div>

                                        {/* Unit Price */}
                                        <div className="col-span-1 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold text-base ${priceChanged ? "text-orange-700" : "text-gray-900"}`}>
                                                    ฿{currentUnitPrice.toLocaleString("th-TH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                {priceChanged && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        ฿{originalUnitPrice.toLocaleString("th-TH", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Carton Price */}
                                        <div className="col-span-1 text-right">
                                            <span className="text-gray-500 font-semibold text-sm">
                                                ฿{cartonPrice.toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>

                                        {/* Promotion Budget Per Unit */}
                                        <div className="col-span-1 text-center">
                                            <div className={`inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl border transition-all ${Number(item.promotionBudget ?? 0) > 0
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm"
                                                : "bg-gray-50 border-gray-100 text-gray-300"
                                                }`}>
                                                <span className="text-xs font-black">
                                                    ฿{Number(item.promotionBudget ?? 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="col-span-1 text-right">
                                            <span className={`font-bold text-base ${priceChanged ? "text-orange-700" : "text-blue-600"}`}>
                                                ฿{currentTotal.toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Desktop Summary Section */}
                        <div className="mt-8 bg-linear-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Budget Info */}
                                <div className="space-y-4">
                                    {promotionalBudgetTotal > 0 && (
                                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-emerald-100 rounded-lg">
                                                    <Gift className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider">งบส่งเสริมการขาย</span>
                                            </div>
                                            <p className="text-2xl font-black text-emerald-600">
                                                ฿{Number(promotionalBudgetTotal).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="text-[10px] text-emerald-500 mt-1 font-medium italic">
                                                * งบส่งเสริมการขายทั้งหมดในใบคำสั่งขาย
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Monetization */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-500 px-2">
                                        <span className="text-sm font-medium">รวมเป็นเงิน</span>
                                        <span className="text-lg font-bold text-gray-700">
                                            ฿{Number(sale.subtotalAmount).toLocaleString("th-TH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    {Number(sale.shippingCost) > 0 && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-medium text-gray-500">ส่วนลดค่าขนส่ง</span>
                                            <span className="text-lg font-bold text-rose-500">
                                                - ฿{Number(sale.shippingCost).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    {Number(sale.otherCosts) > 0 && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-medium text-gray-500">ส่วนลดหน้าบิล</span>
                                            <span className="text-lg font-bold text-rose-500">
                                                - ฿{Number(sale.otherCosts).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="flex justify-between items-end bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-xl uppercase text-gray-600 font-black mb-1">ยอดสุทธิ</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-black text-[#28a717]">
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
                </div>
            </div>
        </div>
    );
}
