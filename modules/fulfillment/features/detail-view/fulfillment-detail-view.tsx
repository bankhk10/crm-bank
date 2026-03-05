"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    Truck,
    Save,
    AlertCircle,
    Loader2,
    ClipboardCheck,
    X,
    Package,
    Building2,
    FileText,
    TrendingDown,
    CreditCard as CreditCardIcon,
    User,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/custom/DatePicker";
import { usePermission } from "@/hooks/use-permission";
import {
    PaymentTermLabels,
    SaleStatusLabels,
    getSaleStatusColor,
} from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { LotSelector } from "../../features/form/lot-selector";
import { updateFulfillmentAction } from "../../server/actions";

const FULFILLMENT_STATUSES = [
    "WAITING_FOR_CORRECTION",
    "AWAITING_PAYMENT",
    "PAID",
    "AWAITING_DELIVERY",
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
    "CANCELLED",
];

export default function FulfillmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    // Use existing "sale.edit" permission as fallback to avoid seed issues
    const { allowed, isLoading: permissionLoading } = usePermission("sale.edit");

    const [saleData, setSaleData] = useState<SaleDetailResponse | null>(null);
    const [stockWarnings, setStockWarnings] = useState<StockWarning[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [status, setStatus] = useState<string>("");
    const [deliveryDate, setDeliveryDate] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [shippingCompanyId, setShippingCompanyId] = useState<string>("");
    const [saleOrderRef, setSaleOrderRef] = useState<string>("");

    // Shipping companies list
    interface ShippingCompanyOption {
        id: string;
        name: string;
        address?: string;
        addressLine?: string;
        province?: string;
        district?: string;
        subdistrict?: string;
        postalCode?: string;
        phone?: string;
    }
    const [shippingCompanies, setShippingCompanies] = useState<ShippingCompanyOption[]>([]);

    // LOT allocation states
    interface LotAllocation {
        saleItemId: string;
        lotId: string;
        quantity: number;
    }
    const [lotAllocations, setLotAllocations] = useState<LotAllocation[]>([]);
    const [lotAllocationsValid, setLotAllocationsValid] = useState(false);

    // Handler for LOT allocations change from LotSelector
    const handleLotAllocationsChange = useCallback(
        (allocations: LotAllocation[], isValid: boolean) => {
            setLotAllocations(allocations);
            setLotAllocationsValid(isValid);
        },
        [],
    );

    useEffect(() => {
        fetch(`/api/sales/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch sale");
                return res.json();
            })
            .then((data: SaleDetailResponse) => {
                setSaleData(data);
                setStockWarnings(data.stockWarnings || []);
                setStatus(data.sale.status);
                if (data.sale.deliveryDate) {
                    setDeliveryDate(
                        new Date(data.sale.deliveryDate).toISOString().split("T")[0],
                    );
                }
                if (data.sale.creditDueDate) {
                    setDueDate(
                        new Date(data.sale.creditDueDate).toISOString().split("T")[0],
                    );
                }
                if (data.sale.paymentDate) {
                    setPaymentDate(
                        new Date(data.sale.paymentDate).toISOString().split("T")[0],
                    );
                }
                if (data.sale.notes) {
                    setNotes(data.sale.notes);
                }
                if (data.sale.saleAddress?.shippingCompanyAddressId) {
                    setShippingCompanyId(data.sale.saleAddress.shippingCompanyAddressId);
                }
                if (data.sale.saleOrderRef) {
                    setSaleOrderRef(data.sale.saleOrderRef);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    // Fetch shipping companies
    useEffect(() => {
        fetch("/api/shipping-companies?perPage=100")
            .then((res) => res.json())
            .then((data) => {
                if (data.shippingCompanies) {
                    setShippingCompanies(
                        data.shippingCompanies
                            .filter((sc: any) => sc.status === "ACTIVE")
                            .map((sc: any) => ({
                                id: sc.id,
                                name: sc.name,
                                address: sc.address,
                                addressLine: sc.addressLine,
                                province: sc.province,
                                district: sc.district,
                                subdistrict: sc.subdistrict,
                                postalCode: sc.postalCode,
                                phone: sc.phone,
                            }))
                    );
                }
            })
            .catch(() => { });
    }, []);

    // Auto-calculate Due Date from Delivery Date
    useEffect(() => {
        if (!saleData) return;

        // If deliveryDate is not set, clear dueDate
        if (!deliveryDate) {
            setDueDate("");
            return;
        }

        const creditDays = saleData.sale.creditDays || 0;
        // Calculate due date regardless of term, user can edit if needed.
        // Logic: Due Date = Delivery Date + Credit Days
        const delivery = new Date(deliveryDate);
        const due = addDays(delivery, creditDays);
        setDueDate(due.toISOString().split("T")[0]);
    }, [deliveryDate, saleData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validate: If status is COMPLETED, payment date and delivery date are required
        if (status === "COMPLETED") {
            if (!paymentDate) {
                setError("กรุณาระบุวันที่ชำระเงินเมื่อสถานะเป็น 'เสร็จสิ้น'");
                setSubmitting(false);
                return;
            }
            if (!deliveryDate) {
                setError("กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น 'เสร็จสิ้น'");
                setSubmitting(false);
                return;
            }
        }

        // Validate: If status is DELIVERED or DELIVERY_COMPLETED, delivery date is required
        if (status === "DELIVERED" || status === "DELIVERY_COMPLETED") {
            if (!deliveryDate) {
                setError(
                    `กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น '${status === "DELIVERED" ? "ระหว่างขนส่ง" : "ส่งเสร็จแล้ว"
                    }'`,
                );
                setSubmitting(false);
                return;
            }
        }

        // Validate: If status is CANCELLED, notes is required
        if (status === "CANCELLED" && !notes.trim()) {
            setError("กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย");
            setSubmitting(false);
            return;
        }

        // Validate: If stock is insufficient, prevent delivery status
        const deliveryStatuses = [
            "AWAITING_DELIVERY",
            "DELIVERED",
            "DELIVERY_COMPLETED",
            "COMPLETED",
        ];
        if (stockWarnings.length > 0 && deliveryStatuses.includes(status)) {
            const productNames = stockWarnings.map((w) => w.productName).join(", ");
            setError(
                `ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งหรือเสร็จสิ้นได้ เนื่องจากสินค้าสต็อกไม่เพียงพอ: ${productNames}`,
            );
            setSubmitting(false);
            return;
        }

        // Validate: If LOT allocations have been started but not complete
        if (
            lotAllocations.length > 0 &&
            !lotAllocationsValid &&
            status !== "WAITING_FOR_CORRECTION"
        ) {
            setError("กรุณาระบุ LOT สินค้าให้ครบตามจำนวนที่ต้องการ");
            setSubmitting(false);
            return;
        }

        try {
            // Determine if LOTs are locked (already delivered)
            const isLotLocked =
                saleData &&
                ["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"].includes(
                    saleData.sale.status,
                );

            const result = await updateFulfillmentAction(id, {
                status,
                deliveryDate,
                creditDueDate: dueDate,
                paymentDate,
                notes,
                shippingCompanyId: shippingCompanyId || null,
                saleOrderRef: saleOrderRef || null,
                // Only include LOT allocations if valid and not locked
                lotAllocations:
                    lotAllocationsValid && !isLotLocked ? lotAllocations : undefined,
            });

            if (!result.success) {
                throw new Error(result.error || "Failed to update fulfillment");
            }

            setTimeout(() => {
                router.push("/fulfillment");
            }, 500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            setSubmitting(false);
        }
    };

    if (permissionLoading || loading) {
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

    if (!allowed) {
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

    if (!saleData) return null;
    const { sale } = saleData;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
            {error && (
                <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50 shadow-md animate-in slide-in-from-top-2"
                >
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="ml-2 text-red-800 font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Sale Summary Card */}
            <Card className="py-0! rounded-3xl shadow-2xl bg-white border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8 rounded-t-3xl">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
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
                            <p className="font-bold text-gray-900 text-base sm:text-lg wrap-break-word" title={sale.customer.name}>
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
                            <p className="font-bold text-gray-900 text-base sm:text-lg wrap-break-word" title={sale.employee.name}>
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
                                    {sale.deliveryMethod === "CUSTOMER_PICKUP"
                                        ? "วันที่มารับสินค้า"
                                        : sale.deliveryMethod === "SALES_DELIVERY"
                                            ? "วันที่ต้องการให้ส่งของ"
                                            : "วันที่ต้องการของ"}
                                </span>
                            </div>
                            <p className="font-bold text-gray-900 text-base sm:text-lg">
                                {sale.requestedDeliveryDate
                                    ? (() => {
                                        const date = new Date(sale.requestedDeliveryDate);
                                        const year = date.getFullYear() + 543;
                                        return format(date, `d MMM ${year}`, { locale: th });
                                    })()
                                    : "-"}
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

            {/* Price Change Warning */}
            {saleData.priceWarnings && saleData.priceWarnings.length > 0 && (
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
                        {saleData.priceWarnings.map((w, i) => {
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
                    </CardContent>
                </Card>
            )}

            {/* Stock Warning */}
            {stockWarnings.length > 0 && (
                <Alert className="border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 text-sm p-4 leading-relaxed block shadow-md animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <span className="font-semibold text-amber-800 text-base">⚠️ สต็อกสินค้าไม่เพียงพอ - ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งได้</span>
                    </div>
                    <div className="space-y-1 ml-7">
                        {stockWarnings.map((w, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-x-1 text-amber-700">
                                <span>•</span>
                                <span className="font-medium">{w.productName} - {w.productCode}</span>
                                <span>- ต้องการ:</span>
                                <span className="font-semibold text-red-600">
                                    {w.requested}
                                </span>
                                <span>| คงเหลือ:</span>
                                <span className="font-semibold text-red-600">
                                    {w.available}
                                </span>
                            </div>
                        ))}
                    </div>
                </Alert>
            )}

            {/* 💳 Credit Information — Glass Premium UI */}
            {sale.paymentTerm !== "PREPAID" && saleData.creditInfo && (
                <Card
                    className={`backdrop-blur-lg rounded-2xl p-6 shadow-sm border-2 ${saleData.creditInfo.willExceedLimit
                        ? "border-red-300 bg-red-50/60"
                        : "border-green-300 bg-green-50/60"
                        }`}
                >
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <CreditCardIcon className="text-blue-600" /> ข้อมูลวงเงินเครดิต
                        {saleData.creditInfo.willExceedLimit && (
                            <Badge variant="destructive" className="ml-2 text-xs px-2 py-1">
                                เกินวงเงิน
                            </Badge>
                        )}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <span className="text-sm text-gray-600">วงเงิน</span>
                            <p className="font-bold text-xl text-gray-900 mt-1 wrap-break-word">
                                ฿{saleData.creditInfo.creditLimit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <span className="text-sm text-gray-600">คงเหลือ</span>
                            <p
                                className={`font-bold text-xl mt-1 wrap-break-word ${saleData.creditInfo.willExceedLimit ? "text-red-600" : "text-green-600"
                                    }`}
                            >
                                ฿{saleData.creditInfo.availableCredit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <span className="text-sm text-gray-600">ยอดขายนี้</span>
                            <p className="font-bold text-xl text-purple-600 mt-1 wrap-break-word">
                                ฿{saleData.creditInfo.currentSaleAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* ========================== 📦 รายการสินค้า ========================== */}
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
                            const currentUnitPrice = Number(item.unitPrice ?? 0);
                            const quantity = Number(item.quantity ?? 0);
                            const currentTotal = Number(
                                item.totalPrice ?? currentUnitPrice * quantity,
                            );
                            const priceChanged = Boolean(item.priceModified);

                            const packSize = parseFloat(item.product.packageSizePerBox || "1");
                            const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-5 space-y-3">
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

                        <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
                            <span className="text-lg font-bold text-gray-900">ยอดสุทธิ</span>
                            <span className="text-2xl font-bold text-blue-700">
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
                        {sale.items.map((item, i) => {
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

                            const packSize = parseFloat(item.product.packageSizePerBox || "1");
                            const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
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
                                                className={`font-bold text-sm md:text-base ${priceChanged ? "text-orange-700" : "text-gray-900"
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
                                            <p className="font-bold text-gray-900 text-sm md:text-base">
                                                {cartonPrice.toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>

                                        {/* Total */}
                                        <div className="col-span-2 text-right">
                                            <p
                                                className={`font-bold text-sm md:text-lg ${priceChanged ? "text-orange-700" : "text-blue-600"
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-t-2 border-blue-200 p-6">
                        <div className="max-w-md ml-auto">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
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
                                    <span className="text-sm text-gray-600">ส่วนค่าขนส่ง</span>
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
                                    <span className="text-sm text-gray-600">ส่วนลดหน้าบิล</span>
                                    <span className="text-lg font-semibold text-red-600">
                                        -
                                        {Number(sale.otherCosts).toLocaleString("th-TH", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t-2 border-blue-300">
                                <span className="text-xl font-bold text-gray-900">
                                    ยอดสุทธิ
                                </span>
                                <span className="text-3xl font-bold text-blue-700">
                                    {Number(sale.totalAmount).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Card with Modern Design */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                    <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50 pt-6 pb-5">
                            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                                ข้อมูลการขาย
                            </h3>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
                                {/* 5. เลขที่คำสั่งขาย (Ref จากระบบอื่น) */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-teal-600" />
                                        เลขที่คำสั่งขาย
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all hover:border-teal-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="กรอกเลขที่คำสั่งขาย"
                                        value={saleOrderRef}
                                        onChange={(e) => setSaleOrderRef(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-slate-400 inline-block"></span>
                                        เลขที่อ้างอิงคำสั่งขายจากระบบภายนอก
                                    </p>
                                </div>
                                {/* 1. Payment Status */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                        สถานะ
                                    </label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="w-full h-12 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl shadow-sm">
                                            <SelectValue placeholder="เลือกสถานะ" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {FULFILLMENT_STATUSES.map((st) => {
                                                // Disable delivery-related statuses if stock is insufficient
                                                const deliveryStatuses = [
                                                    "AWAITING_DELIVERY",
                                                    "DELIVERED",
                                                    "DELIVERY_COMPLETED",
                                                    "COMPLETED",
                                                ];
                                                const isDeliveryStatus = deliveryStatuses.includes(st);
                                                const isDisabled =
                                                    isDeliveryStatus && stockWarnings.length > 0;

                                                return (
                                                    <SelectItem
                                                        key={st}
                                                        value={st}
                                                        className={`rounded-lg ${isDisabled ? "opacity-50" : ""
                                                            }`}
                                                        disabled={isDisabled}
                                                    >
                                                        {SaleStatusLabels[
                                                            st as keyof typeof SaleStatusLabels
                                                        ] || st}
                                                        {isDisabled && " (สต็อกไม่พอ)"}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-slate-400 inline-block"></span>
                                        เลือกสถานะปัจจุบันของรายการขาย
                                    </p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">

                                {/* 2. Delivery Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-emerald-600" />
                                        วันที่จัดส่งของ
                                        {(status === "COMPLETED" ||
                                            status === "DELIVERED" ||
                                            status === "DELIVERY_COMPLETED") && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            value={deliveryDate}
                                            onChange={(val) => setDeliveryDate(val || "")}
                                            label=""
                                            placeholder="เลือกวันที่จัดส่ง"
                                            disabled={status === "WAITING_FOR_CORRECTION"}
                                        />
                                    </div>
                                    {(status === "COMPLETED" ||
                                        status === "DELIVERED" ||
                                        status === "DELIVERY_COMPLETED") &&
                                        !deliveryDate && (
                                            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                                                ระบุวันที่จัดส่งเมื่อสถานะเป็น &ldquo;
                                                {status === "COMPLETED"
                                                    ? "เสร็จสิ้น"
                                                    : status === "DELIVERED"
                                                        ? "ระหว่างขนส่ง"
                                                        : "ส่งเสร็จแล้ว"}
                                                &rdquo;
                                            </p>
                                        )}
                                </div>

                                {/* 3. Due Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-amber-600" />
                                        วันครบกำหนดชำระ
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            value={dueDate}
                                            onChange={(val) => setDueDate(val || "")}
                                            label=""
                                            placeholder="เลือกวันครบกำหนด"
                                            disabled={status === "WAITING_FOR_CORRECTION"}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>
                                        คำนวณจาก วันส่ง + {sale.creditDays || 0} วัน
                                    </p>
                                </div>
                            </div>


                            {/* 6. Notes */}
                            <div className="space-y-3 group/field">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 px-2">
                                    หมายเหตุ
                                    {status === "CANCELLED" && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                </label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                {status === "CANCELLED" && !notes.trim() && (
                                    <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg mt-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                                        จำเป็นต้องระบุหมายเหตุเมื่อยกเลิกรายการขาย
                                    </p>
                                )}
                            </div>

                            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                                ข้อมูลการชำระเงิน
                            </h3>

                            <div className="grid md:grid-cols-2 gap-8 mt-6 px-4">
                                {/* 4. Payment Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-purple-600" />
                                        วันที่ชำระเงิน
                                        {status === "COMPLETED" && (
                                            <span className="text-red-500 ml-1">*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            value={paymentDate}
                                            onChange={(val) => setPaymentDate(val || "")}
                                            label=""
                                            placeholder="เลือกวันที่ชำระเงิน"
                                            disabled={status === "WAITING_FOR_CORRECTION"}
                                        />
                                    </div>
                                    {status === "COMPLETED" && !paymentDate && (
                                        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                                            จำเป็นต้องระบุเมื่อสถานะเป็น &ldquo;เสร็จสิ้น&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                                ข้อมูลสต็อกสินค้า
                            </h3>

                            {/* 8. LOT Selection - Always show for selecting stock lots */}
                            <div className="space-y-3 group/field pt-4  border-slate-200 px-4">
                                <LotSelector
                                    saleId={id}
                                    onAllocationsChange={handleLotAllocationsChange}
                                    disabled={
                                        submitting ||
                                        status === "WAITING_FOR_CORRECTION" ||
                                        (saleData &&
                                            ["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"].includes(
                                                saleData.sale.status,
                                            ))
                                    }
                                />
                                {lotAllocations.length > 0 && !lotAllocationsValid && (
                                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                                        กรุณาระบุ LOT สินค้าให้ครบตามจำนวนที่ต้องการส่ง
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        {/* Action Buttons */}
                        <div className="sm:pt-2 mt-6 sm:mt-8 space-y-6">
                            <div className="flex justify-center sm:flex-col-reverse sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
                                <Button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="w-32 sm:w-32 h-10 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                    disabled={submitting}
                                >
                                    <X className=" h-4 w-4" />
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-32 sm:w-32 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            บันทึก
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="w-full h-12 sm:hidden"></div>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
}
