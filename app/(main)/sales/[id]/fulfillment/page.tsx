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
} from "@/types/sales";
import type { SaleDetailResponse, StockWarning } from "@/types/sales";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { LotSelector } from "@/features/fulfillment";

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

export default function FulfillmentPage({
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
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

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
          `กรุณาระบุวันที่จัดส่งของเมื่อสถานะเป็น '${status === "DELIVERED" ? "จัดส่งแล้ว" : "ส่งเสร็จแล้ว"
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

      const res = await fetch(`/api/sales/${id}/fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          deliveryDate,
          creditDueDate: dueDate,
          paymentDate,
          notes,
          // Only include LOT allocations if valid and not locked
          lotAllocations:
            lotAllocationsValid && !isLotLocked ? lotAllocations : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update fulfillment");
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
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* ยอดรวมสุทธิ */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-purple-700 font-bold uppercase tracking-wide">
                  ยอดรวมสุทธิ
                </span>
              </div>
              <p className="font-bold text-gray-900 text-base sm:text-lg">
                ฿{Number(sale.totalAmount).toLocaleString()}
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

      {/* Stock Warning Alert */}
      {stockWarnings.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50 shadow-md animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="text-amber-800 font-semibold">
                ⚠️ สต็อกสินค้าไม่เพียงพอ - ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งได้
              </p>
              <ul className="text-amber-700 text-sm space-y-1">
                {stockWarnings.map((warning) => (
                  <li
                    key={warning.productId}
                    className="flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span className="font-medium">
                      {warning.productName} - {warning.productCode}
                    </span>
                    <span>
                      - ต้องการ: {warning.requested} | คงเหลือ:{" "}
                      {warning.available}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Card with Modern Design */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
          <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50 pt-6 pb-5">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                ข้อมูลสถานะการขาย
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* 1. Payment Status */}
              <div className="space-y-3 group/field">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                    1
                  </span>
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
                  {stockWarnings.length > 0 && (
                    <span className="text-amber-600 font-medium ml-2">
                      (สถานะจัดส่งถูกปิดเนื่องจากสต็อกไม่เพียงพอ)
                    </span>
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3 group/field">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                      2
                    </span>
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
                        จำเป็นต้องระบุวันที่จัดส่งของเมื่อสถานะเป็น &ldquo;
                        {status === "COMPLETED"
                          ? "เสร็จสิ้น"
                          : status === "DELIVERED"
                            ? "จัดส่งแล้ว"
                            : "ส่งเสร็จแล้ว"}
                        &rdquo;
                      </p>
                    )}
                </div>

                {/* 3. Due Date */}
                <div className="space-y-3 group/field">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                      3
                    </span>
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
                    คำนวณอัตโนมัติจาก วันที่จัดส่ง + {sale.creditDays || 0} วัน
                  </p>
                </div>

                {/* 4. Payment Date */}
                <div className="space-y-3 group/field md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                      4
                    </span>
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    วันที่ชำระเงิน
                    {status === "COMPLETED" && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative max-w-md">
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
                      จำเป็นต้องระบุวันที่ชำระเงินเมื่อสถานะเป็น
                      &ldquo;เสร็จสิ้น&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Notes */}
              <div className="space-y-3 group/field">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    5
                  </span>
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

              {/* 6. LOT Selection - Always show for selecting stock lots */}
              <div className="space-y-3 group/field pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                    6
                  </span>
                  <Package className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    เลือก LOT สินค้า
                  </span>
                </div>
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
