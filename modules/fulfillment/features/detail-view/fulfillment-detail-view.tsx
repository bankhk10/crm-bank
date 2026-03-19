"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import {
    AlertCircle,
    Calendar,
    ClipboardCheck,
    CreditCard,
    FileText,
    Loader2,
    Save,
    Truck,
    X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/custom/DatePicker";
import { usePermission } from "@/hooks/use-permission";
import { SaleStatusLabels } from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";

import { LotSelector } from "../../features/form/lot-selector";
import { updateFulfillmentAction } from "../../server/actions";
import {
    CreditInfoCard,
    ItemsCard,
    LoadingScreen,
    PermissionDenied,
    PriceWarningsCard,
    SaleSummaryCard,
    StockWarningAlert,
} from "./fulfillment-detail-sections";

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

const DELIVERY_STATUSES = [
    "AWAITING_DELIVERY",
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
];

const DELIVERY_DATE_REQUIRED_STATUSES = [
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
];

const LOT_LOCKED_STATUSES = ["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"];

const DELIVERY_STATUS_LABELS: Record<string, string> = {
    DELIVERED: "ระหว่างขนส่ง",
    DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
    COMPLETED: "เสร็จสิ้น",
};

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

interface LotAllocation {
    saleItemId: string;
    lotId: string;
    quantity: number;
}

const toInputDate = (value?: string | Date | null) =>
    value ? new Date(value).toISOString().split("T")[0] : "";

const getDeliveryStatusLabel = (value: string) =>
    DELIVERY_STATUS_LABELS[value] || value;

const getValidationError = (params: {
    status: string;
    paymentDate: string;
    deliveryDate: string;
    notes: string;
    stockWarnings: StockWarning[];
    lotAllocations: LotAllocation[];
    lotAllocationsValid: boolean;
}) => {
    const {
        status,
        paymentDate,
        deliveryDate,
        notes,
        stockWarnings,
        lotAllocations,
        lotAllocationsValid,
    } = params;

    if (status === "COMPLETED") {
        if (!paymentDate) {
            return "กรุณาระบุวันที่ชำระเงินเมื่อสถานะเป็น 'เสร็จสิ้น'";
        }
        if (!deliveryDate) {
            return "กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น 'เสร็จสิ้น'";
        }
    }

    if (
        (status === "DELIVERED" || status === "DELIVERY_COMPLETED") &&
        !deliveryDate
    ) {
        return `กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น '${getDeliveryStatusLabel(status)}'`;
    }

    if (status === "CANCELLED" && !notes.trim()) {
        return "กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย";
    }

    if (stockWarnings.length > 0 && DELIVERY_STATUSES.includes(status)) {
        const productNames = stockWarnings.map((w) => w.productName).join(", ");
        return `ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งหรือเสร็จสิ้นได้ เนื่องจากสินค้าสต็อกไม่เพียงพอ: ${productNames}`;
    }

    if (
        lotAllocations.length > 0 &&
        !lotAllocationsValid &&
        status !== "WAITING_FOR_CORRECTION"
    ) {
        return "กรุณาระบุ LOT สินค้าให้ครบตามจำนวนที่ต้องการ";
    }

    return null;
};

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

    const [shippingCompanies, setShippingCompanies] = useState<
        ShippingCompanyOption[]
    >([]);

    const [lotAllocations, setLotAllocations] = useState<LotAllocation[]>([]);
    const [lotAllocationsValid, setLotAllocationsValid] = useState(false);

    const handleLotAllocationsChange = useCallback(
        (allocations: LotAllocation[], isValid: boolean) => {
            setLotAllocations(allocations);
            setLotAllocationsValid(isValid);
        },
        [],
    );

    useEffect(() => {
        let isActive = true;

        const loadSale = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/sales/${id}`);
                if (!res.ok) throw new Error("Failed to fetch sale");

                const data = (await res.json()) as SaleDetailResponse;
                if (!isActive) return;

                setSaleData(data);
                setStockWarnings(data.stockWarnings || []);
                setStatus(data.sale.status);
                setDeliveryDate(toInputDate(data.sale.deliveryDate));
                setDueDate(toInputDate(data.sale.creditDueDate));
                setPaymentDate(toInputDate(data.sale.paymentDate));
                setNotes(data.sale.notes || "");
                setShippingCompanyId(
                    data.sale.saleAddress?.shippingCompanyAddressId || "",
                );
                setSaleOrderRef(data.sale.saleOrderRef || "");
            } catch (err) {
                if (!isActive) return;
                setError(err instanceof Error ? err.message : "Failed to fetch sale");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        loadSale();

        return () => {
            isActive = false;
        };
    }, [id]);

    useEffect(() => {
        let isActive = true;

        const loadShippingCompanies = async () => {
            try {
                const res = await fetch("/api/shipping-companies?perPage=100");
                if (!res.ok) return;

                const data = await res.json();
                if (!isActive) return;

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
                            })),
                    );
                }
            } catch {
                // ignore
            }
        };

        loadShippingCompanies();

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!saleData) return;

        if (!deliveryDate) {
            setDueDate("");
            return;
        }

        const creditDays = saleData.sale.creditDays || 0;
        const delivery = new Date(deliveryDate);
        const due = addDays(delivery, creditDays);
        setDueDate(due.toISOString().split("T")[0]);
    }, [deliveryDate, saleData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const validationError = getValidationError({
            status,
            paymentDate,
            deliveryDate,
            notes,
            stockWarnings,
            lotAllocations,
            lotAllocationsValid,
        });

        if (validationError) {
            setError(validationError);
            setSubmitting(false);
            return;
        }

        try {
            const isLotLocked =
                saleData && LOT_LOCKED_STATUSES.includes(saleData.sale.status);

            const result = await updateFulfillmentAction(id, {
                status,
                deliveryDate,
                creditDueDate: dueDate,
                paymentDate,
                notes,
                shippingCompanyId: shippingCompanyId || null,
                saleOrderRef: saleOrderRef || null,
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
        return <LoadingScreen />;
    }

    if (!allowed) {
        return <PermissionDenied />;
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

            <SaleSummaryCard sale={sale} onBack={() => router.back()} />

            {saleData.priceWarnings && saleData.priceWarnings.length > 0 && (
                <PriceWarningsCard priceWarnings={saleData.priceWarnings} />
            )}

            {stockWarnings.length > 0 && (
                <StockWarningAlert stockWarnings={stockWarnings} />
            )}

            {sale.paymentTerm !== "PREPAID" && saleData.creditInfo && (
                <CreditInfoCard creditInfo={saleData.creditInfo} />
            )}

            <ItemsCard sale={sale} />

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
                                                const isDeliveryStatus =
                                                    DELIVERY_STATUSES.includes(st);
                                                const isDisabled =
                                                    isDeliveryStatus &&
                                                    stockWarnings.length > 0;

                                                return (
                                                    <SelectItem
                                                        key={st}
                                                        value={st}
                                                        className={`rounded-lg ${isDisabled ? "opacity-50" : ""}`}
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
                                        {DELIVERY_DATE_REQUIRED_STATUSES.includes(status) && (
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
                                    {DELIVERY_DATE_REQUIRED_STATUSES.includes(status) &&
                                        !deliveryDate && (
                                            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                                                ระบุวันที่จัดส่งเมื่อสถานะเป็น &ldquo;
                                                {getDeliveryStatusLabel(status)}&rdquo;
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
                                            LOT_LOCKED_STATUSES.includes(
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
