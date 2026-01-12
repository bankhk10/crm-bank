"use client";

import React, { use, useEffect, useState } from "react";
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
import DatePicker from "@/components/custom/DatePicker";
import { usePermission } from "@/hooks/use-permission";
import { PaymentTermLabels, SaleStatusLabels } from "@/types/sales";
import type { SaleDetailResponse } from "@/types/sales";

const FULFILLMENT_STATUSES = [
  "APPROVED",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [status, setStatus] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sale");
        return res.json();
      })
      .then((data: SaleDetailResponse) => {
        setSaleData(data);
        setStatus(data.sale.status);
        if (data.sale.deliveryDate) {
          setDeliveryDate(
            new Date(data.sale.deliveryDate).toISOString().split("T")[0]
          );
        }
        if (data.sale.creditDueDate) {
          setDueDate(
            new Date(data.sale.creditDueDate).toISOString().split("T")[0]
          );
        }
        if (data.sale.paymentDate) {
          setPaymentDate(
            new Date(data.sale.paymentDate).toISOString().split("T")[0]
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
    if (!saleData || !deliveryDate) return;

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

    // Validate: If status is COMPLETED, payment date is required
    if (status === "COMPLETED" && !paymentDate) {
      setError("กรุณาระบุวันที่ชำระเงินเมื่อสถานะเป็น 'เสร็จสิ้น'");
      setSubmitting(false);
      return;
    }

    // Validate: If status is CANCELLED, notes is required
    if (status === "CANCELLED" && !notes.trim()) {
      setError("กรุณาระบุหมายเหตุเมื่อยกเลิกรายการขาย");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/sales/${id}/fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          deliveryDate,
          creditDueDate: dueDate,
          paymentDate,
          notes,
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

            <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-blue-700 font-bold uppercase tracking-wide">
                  เครดิต (วัน)
                </span>
              </div>
              <p className="font-bold text-gray-900 text-base sm:text-lg">
                {sale.creditDays || 0} วัน
              </p>
            </div>

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
                className="bg-white border-orange-300 text-orange-700 font-bold px-3 py-1.5"
              >
                {SaleStatusLabels[sale.status]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {FULFILLMENT_STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="rounded-lg">
                        {SaleStatusLabels[
                          st as keyof typeof SaleStatusLabels
                        ] || st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-slate-400 inline-block"></span>
                  เลือกสถานะปัจจุบันของรายการขาย
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* 2. Delivery Date */}
                <div className="space-y-3 group/field">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                      2
                    </span>
                    <Truck className="h-4 w-4 text-emerald-600" />
                    วันที่จัดส่งของ
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={deliveryDate}
                      onChange={(val) => setDeliveryDate(val || "")}
                      label=""
                      placeholder="เลือกวันที่จัดส่ง"
                    />
                  </div>
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
