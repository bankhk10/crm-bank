"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { addDays } from "date-fns";
import {
    AlertTriangle,
    Calendar,
    ClipboardCheck,
    CreditCard,
    FileText,
    Loader2,
    Package,
    Save,
    Truck,
    X,
    SplitSquareVertical,
    ArrowRightLeft,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/custom/DatePicker";
import { SectionHeader } from "@/components/custom/section-header";
import { usePermission } from "@/hooks/use-permission";
import { SaleStatusLabels } from "@/modules/sales/types";
import type { SaleDetailResponse, StockWarning } from "@/modules/sales/types";

import { LotSelector } from "../../features/form/lot-selector";
import { updateFulfillmentAction, getShipmentsAction } from "../../server/actions";
import {
    CreditInfoCard,
    ItemsCard,
    LoadingScreen,
    PermissionDenied,
    SaleSummaryCard,
    StockWarningAlert,
    DeliveryInfoCard,
} from "./fulfillment-detail-sections";
import { ShipmentListSection } from "./shipment-list-section";
import { CreateShipmentDialog } from "./create-shipment-dialog";
import type { ShipmentRecord, RemainingByItem } from "../../types/types";


const FULFILLMENT_STATUSES = [
    "APPROVED",
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
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
];

const DELIVERY_DATE_REQUIRED_STATUSES: string[] = [
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
];

const LOT_LOCKED_STATUSES = ["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"];
const BLOCKED_WHEN_IN_TRANSIT = [
    "APPROVED",
    "WAITING_FOR_CORRECTION",
    "AWAITING_PAYMENT",
    "PAID",
    "AWAITING_DELIVERY",
];

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
    currentStatus?: string;
    paymentDate: string;
    deliveryDate: string;
    notes: string;
    stockWarnings: StockWarning[];
    lotAllocations: LotAllocation[];
    lotAllocationsValid: boolean;
}) => {
    const {
        status,
        currentStatus,
        paymentDate,
        deliveryDate,
        notes,
        stockWarnings,
        lotAllocations,
        lotAllocationsValid,
    } = params;

    /*
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
    */

    if (status === "COMPLETED" && !paymentDate) {
        return "กรุณาระบุวันที่ชำระเงินเมื่อสถานะเป็น 'เสร็จสิ้น'";
    }

    if (
        ["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"].includes(status) &&
        !deliveryDate
    ) {
        return `กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น '${getDeliveryStatusLabel(status)}'`;
    }

    if (status === "CANCELLED" && !notes.trim()) {
        return "กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย";
    }

    const skipStockCheck =
        !!currentStatus && DELIVERY_STATUSES.includes(currentStatus);

    if (
        stockWarnings.length > 0 &&
        DELIVERY_STATUSES.includes(status) &&
        !skipStockCheck
    ) {
        const productNames = stockWarnings.map((w) => w.productName).join(", ");
        return `ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งหรือเสร็จสิ้นได้ เนื่องจากสินค้าสต็อกไม่เพียงพอ: ${productNames}`;
    }

    if (
        lotAllocations.length > 0 &&
        !lotAllocationsValid &&
        !["WAITING_FOR_CORRECTION", "AWAITING_DELIVERY", "AWAITING_PAYMENT", "PAID", "CANCELLED"].includes(status)
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

    // Shipment mode: "normal" | "split"
    const [shipmentMode, setShipmentMode] = useState<"normal" | "split">("normal");

    // Split Shipment state
    const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
    const [remainingByItem, setRemainingByItem] = useState<RemainingByItem[]>([]);

    const loadShipments = useCallback(async () => {
        if (!id) return;
        const result = await getShipmentsAction(id);
        if (result.success && result.data) {
            setShipments(result.data.shipments || []);
            setRemainingByItem(result.data.remainingByItem || []);
        }
    }, [id]);


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
                // Auto-set mode based on hasPartialDelivery flag
                setShipmentMode(data.sale.hasPartialDelivery ? "split" : "normal");
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

    // Load shipments when saleData loads
    useEffect(() => {
        if (saleData) {
            loadShipments();
        }
    }, [saleData, loadShipments]);


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
            currentStatus: saleData?.sale.status,
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
                hasPartialDelivery: isSplitMode,
            });

            if (!result.success) {
                throw new Error(result.error || "Failed to update fulfillment");
            }

            toast.success("บันทึกข้อมูลสำเร็จ");
            setSubmitting(false);

            // Refresh data from server to show latest status
            const res = await fetch(`/api/sales/${id}`);
            if (res.ok) {
                const data = (await res.json()) as SaleDetailResponse;
                setSaleData(data);
                setStockWarnings(data.stockWarnings || []);
                setStatus(data.sale.status);
                setDeliveryDate(toInputDate(data.sale.deliveryDate));
                setDueDate(toInputDate(data.sale.creditDueDate));
                setPaymentDate(toInputDate(data.sale.paymentDate));
                setNotes(data.sale.notes || "");
                setShippingCompanyId(data.sale.saleAddress?.shippingCompanyAddressId || "");
                setSaleOrderRef(data.sale.saleOrderRef || "");
                setShipmentMode(data.sale.hasPartialDelivery ? "split" : "normal");
            }
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

    const skipStockCheck =
        !!saleData?.sale.status &&
        DELIVERY_STATUSES.includes(saleData.sale.status);
    const isInTransit = saleData?.sale.status === "DELIVERED" || sale.status === "DELIVERY_COMPLETED" || sale.status === "COMPLETED";
    const isSplitMode = shipmentMode === "split";

    return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {error && (
                <Alert variant="destructive" className="shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>ข้อผิดพลาด</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <SaleSummaryCard sale={sale} backUrl="/fulfillment" />

            {sale.paymentTerm !== "PREPAID" && saleData.creditInfo && (
                <CreditInfoCard creditInfo={saleData.creditInfo} />
            )}

            {stockWarnings.length > 0 && !skipStockCheck && !isSplitMode && (
                <StockWarningAlert stockWarnings={stockWarnings} />
            )}

            <DeliveryInfoCard sale={sale} />

            <ItemsCard sale={sale} />

            {/* ===== ตัวเลือกรูปแบบการจัดส่ง ===== */}
            {["APPROVED", "AWAITING_PAYMENT", "PAID", "AWAITING_DELIVERY", "DELIVERED", "DELIVERY_COMPLETED", "PARTIALLY_DELIVERED"].includes(sale.status) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="h-5 w-5 text-gray-600" />
                            <h2 className="text-base font-semibold text-gray-800">รูปแบบการจัดส่ง</h2>
                        </div>
                        <p className="text-xs text-gray-500">เลือกวิธีการจัดส่งสินค้าในคำสั่งขายนี้</p>
                    </div>
                    <div className="p-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShipmentMode("normal")}
                            disabled={(sale.hasPartialDelivery && shipments.length > 0) || !!deliveryDate}
                            className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-all ${!isSplitMode
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Truck className={`h-6 w-6 ${!isSplitMode ? "text-blue-600" : "text-gray-400"}`} />
                            <div className="text-center">
                                <p className="text-sm font-semibold">จัดส่งปกติ</p>
                                <p className="text-xs mt-0.5 opacity-75">จัดส่งครั้งเดียวทั้งหมด</p>
                            </div>
                            {!isSplitMode && (
                                <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">เลือกอยู่</span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShipmentMode("split")}
                            disabled={!!deliveryDate}
                            className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-all ${isSplitMode
                                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <SplitSquareVertical className={`h-6 w-6 ${isSplitMode ? "text-purple-600" : "text-gray-400"}`} />
                            <div className="text-center">
                                <p className="text-sm font-semibold">Split Shipment</p>
                                <p className="text-xs mt-0.5 opacity-75">จัดส่งแบบแบ่งงวด</p>
                            </div>
                            {isSplitMode && (
                                <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">เลือกอยู่</span>
                            )}
                        </button>
                    </div>
                    {sale.hasPartialDelivery && shipments.length > 0 && !isSplitMode && (
                        <p className="px-6 pb-4 text-xs text-amber-600">
                            * มีการสร้าง Shipment แล้ว ไม่สามารถเปลี่ยนกลับเป็นจัดส่งปกติได้
                        </p>
                    )}
                </div>
            )}

            {/* Split Shipment Section */}
            {isSplitMode && (
                <div className="bg-white rounded-xl border border-purple-200 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-purple-50/50">
                        <div className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-purple-600" />
                            <h2 className="text-base font-semibold text-purple-800">ประวัติการจัดส่ง (Split Shipment)</h2>
                        </div>
                        <CreateShipmentDialog
                            saleId={id}
                            remainingByItem={remainingByItem.length > 0 ? remainingByItem : sale.items.map((item: any) => ({
                                saleItemId: item.id,
                                productCode: item.productCode || item.product?.productCode || "",
                                productName: item.name || item.product?.name || "",
                                unit: item.unit || item.product?.unit || "",
                                totalQuantity: item.quantity,
                                allocatedQuantity: 0,
                                remainingQuantity: item.quantity,
                            }))}
                            shippingCompanies={shippingCompanies.map(sc => ({ id: sc.id, name: sc.name }))}
                            onCreated={async () => {
                                await loadShipments();
                                const res = await fetch(`/api/sales/${id}`);
                                if (res.ok) {
                                    const data = await res.json();
                                    setSaleData(data);
                                    setStatus(data.sale.status);
                                }
                            }}
                            disabled={["COMPLETED", "CANCELLED", "DELIVERY_COMPLETED"].includes(sale.status)}
                            creditDays={sale.creditDays || 0}
                        />
                    </div>
                    <div className="p-6">
                        <ShipmentListSection
                            saleId={id}
                            shipments={shipments}
                            remainingByItem={remainingByItem}
                            shippingCompanies={shippingCompanies.map(sc => ({ id: sc.id, name: sc.name }))}
                            creditDays={sale.creditDays || 0}
                            onShipmentUpdated={async () => {
                                await loadShipments();
                                const res = await fetch(`/api/sales/${id}`);
                                if (res.ok) {
                                    const data = await res.json();
                                    setSaleData(data);
                                    setStatus(data.sale.status);
                                }
                            }}
                        />
                    </div>
                </div>
            )}


            {/* Normal mode form — ซ่อนเมื่อเลือก Split Shipment */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isSplitMode && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader icon={<FileText className="h-6 w-6" />} title="ข้อมูลการขาย" />
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* 5. เลขที่คำสั่งขาย (Ref จากระบบอื่น) */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-[#B91C1C]" />
                                        เลขที่คำสั่งขาย
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all hover:border-[#B91C1C]/40 focus:border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/15 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="กรอกเลขที่คำสั่งขาย"
                                        value={saleOrderRef}
                                        onChange={(e) => setSaleOrderRef(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-gray-400 inline-block"></span>
                                        เลขที่อ้างอิงคำสั่งขายจากระบบภายนอก
                                    </p>
                                </div>
                                {/* 1. Payment Status */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-[#B91C1C]" />
                                        สถานะ
                                    </label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="w-full h-12 border border-gray-200 hover:border-[#B91C1C]/40 focus:border-[#B91C1C] transition-colors rounded-lg shadow-sm">
                                            <SelectValue placeholder="เลือกสถานะ" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {FULFILLMENT_STATUSES.map((st) => {
                                                const isDeliveryStatus =
                                                    DELIVERY_STATUSES.includes(st);
                                                const isDisabledDueToStock =
                                                    isDeliveryStatus &&
                                                    stockWarnings.length > 0 &&
                                                    !skipStockCheck;
                                                const isDisabledDueToTransit =
                                                    isInTransit &&
                                                    BLOCKED_WHEN_IN_TRANSIT.includes(st);
                                                const isDisabledDueToDeliveryDate =
                                                    !!deliveryDate &&
                                                    (st === "WAITING_FOR_CORRECTION" ||
                                                        st === "APPROVED");
                                                const isDisabled =
                                                    isDisabledDueToStock ||
                                                    isDisabledDueToTransit ||
                                                    isDisabledDueToDeliveryDate;

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
                                                        {isDisabledDueToStock &&
                                                            " (สต็อกไม่พอ)"}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-gray-400 inline-block"></span>
                                        เลือกสถานะปัจจุบันของรายการขาย
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* 2. Delivery Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-[#B91C1C]" />
                                        วันที่จัดส่งของ
                                        {DELIVERY_DATE_REQUIRED_STATUSES.includes(status) && (
                                            <span className="text-rose-600 ml-1">*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            value={deliveryDate}
                                            onChange={(val) => {
                                                setDeliveryDate(val || "");
                                            }}
                                            label=""
                                            placeholder="เลือกวันที่จัดส่ง"
                                            disabled={
                                                !["AWAITING_DELIVERY", "DELIVERED", "DELIVERY_COMPLETED", "COMPLETED"].includes(status)
                                            }
                                        />
                                    </div>
                                    {DELIVERY_DATE_REQUIRED_STATUSES.includes(status) &&
                                        !deliveryDate && (
                                            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-lg">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>
                                                ระบุวันที่จัดส่งเมื่อสถานะเป็น &ldquo;
                                                {getDeliveryStatusLabel(status)}&rdquo;
                                            </p>
                                        )}
                                </div>

                                {/* 3. Due Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-[#B91C1C]" />
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
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block"></span>
                                        คำนวณจาก วันส่ง + {sale.creditDays || 0} วัน
                                    </p>
                                </div>
                            </div>

                            {/* 6. Notes */}
                            <div className="space-y-3 group/field">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 px-2">
                                    หมายเหตุ
                                    {status === "CANCELLED" && (
                                        <span className="text-rose-600 ml-1">*</span>
                                    )}
                                </label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all hover:border-[#B91C1C]/40 focus:border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/15 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                {status === "CANCELLED" && !notes.trim() && (
                                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-lg mt-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>
                                        จำเป็นต้องระบุหมายเหตุเมื่อยกเลิกรายการขาย
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )} {/* end !isSplitMode — ข้อมูลการขาย */}

                {!isSplitMode && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader
                            icon={<CreditCard className="h-6 w-6" />}
                            title="ข้อมูลการชำระเงิน"
                            variant="dark"
                        />
                        <div className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* 4. Payment Date */}
                                <div className="space-y-3 group/field">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-[#B91C1C]" />
                                        วันที่ชำระเงิน
                                        {status === "COMPLETED" && (
                                            <span className="text-rose-600 ml-1">*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <DatePicker
                                            value={paymentDate}
                                            onChange={(val) => {
                                                setPaymentDate(val || "");
                                                if (val) {
                                                    setStatus("COMPLETED");
                                                }
                                            }}
                                            label=""
                                            placeholder="เลือกวันที่ชำระเงิน"
                                            disabled={status === "WAITING_FOR_CORRECTION"}
                                        />
                                    </div>
                                    {status === "COMPLETED" && !paymentDate && (
                                        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-lg">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>
                                            จำเป็นต้องระบุเมื่อสถานะเป็น &ldquo;เสร็จสิ้น&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )} {/* end !isSplitMode — ข้อมูลการชำระเงิน */}

                {!isSplitMode && !["DELIVERED", "DELIVERY_COMPLETED", "COMPLETED", "CANCELLED"].includes(status) && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <SectionHeader icon={<Package className="h-6 w-6" />} title="ข้อมูลสต็อกสินค้า" />
                        <div className="p-6 space-y-3">
                            {/* 8. LOT Selection - Always show for selecting stock lots */}
                            <div className="space-y-3 group/field">
                                <LotSelector
                                    saleId={id}
                                    onAllocationsChange={handleLotAllocationsChange}
                                    disabled={
                                        submitting ||
                                        status === "CANCELLED" ||
                                        (saleData &&
                                            LOT_LOCKED_STATUSES.includes(
                                                saleData.sale.status,
                                            ))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )} {/* end !isSplitMode — ข้อมูลสต็อกสินค้า */}

                {!isSplitMode && (
                    <div className="pt-2 space-y-4">
                        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium px-6 shadow-md shadow-blue-500/20 rounded-xl"
                            >
                                <Link href={`/sales/${sale.id}/detail`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสาร PDF
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-10 font-medium px-6 shadow-md shadow-amber-500/20 rounded-xl"
                            >
                                <Link href={`/sales/${sale.id}/special-detail`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสารพิเศษ PDF
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                onClick={() => router.back()}
                                className="w-32 h-10 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-sm transition-all"
                                disabled={submitting}
                            >
                                <X className="h-4 w-4" />
                                ย้อนกลับ
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-32 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm transition-all"
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
                )} {/* end !isSplitMode — action buttons */}

                {/* Split mode: แสดงเฉพาะปุ่ม PDF และ Back */}
                {isSplitMode && (
                    <div className="pt-2 space-y-4">
                        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium px-6 shadow-md shadow-blue-500/20 rounded-xl"
                            >
                                <Link href={`/sales/${sale.id}/detail`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสาร PDF
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-10 font-medium px-6 shadow-md shadow-amber-500/20 rounded-xl"
                            >
                                <Link href={`/sales/${sale.id}/special-detail`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    ดูเอกสารพิเศษ PDF
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                onClick={() => router.back()}
                                className="w-32 h-10 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-sm transition-all"
                            >
                                <X className="h-4 w-4" />
                                กลับ
                            </Button>
                        </div>
                        <div className="w-full h-12 sm:hidden"></div>
                    </div>
                )} {/* end isSplitMode — split action buttons */}
            </form>
        </div>
    );
}
