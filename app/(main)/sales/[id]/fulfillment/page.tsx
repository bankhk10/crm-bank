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
    } catch (err: any) {
      setError(err.message);
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

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
        {/* Header with Gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-5 blur-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  จัดการการชำระเงินและวันที่จัดส่ง
                </h1>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="font-semibold text-blue-600">
                    {sale.saleNumber}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium">{sale.customer.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Card with Gradient Border */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse inline-block"></span>
                  ข้อมูลรายการขาย
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                <div className="group/item hover:scale-105 transition-transform">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    ยอดรวมสุทธิ
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ฿{Number(sale.totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="group/item hover:scale-105 transition-transform">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    เงื่อนไขการชำระ
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 font-medium px-3 py-1"
                  >
                    {PaymentTermLabels[sale.paymentTerm]}
                  </Badge>
                </div>
                <div className="group/item hover:scale-105 transition-transform">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    เครดิต (วัน)
                  </span>
                  <span className="text-lg font-semibold text-slate-700">
                    {sale.creditDays || 0} วัน
                  </span>
                </div>
                <div className="group/item hover:scale-105 transition-transform">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    สถานะปัจจุบัน
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium px-3 py-1 shadow-sm"
                  >
                    {SaleStatusLabels[sale.status]}
                  </Badge>
                </div>
                <div className="group/item hover:scale-105 transition-transform sm:col-span-2 lg:col-span-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    วันที่ต้องการของ
                  </span>
                  <span className="text-lg font-semibold text-slate-700">
                    {formatDate(sale.requestedDeliveryDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  ข้อมูลการชำระเงินและการจัดส่ง
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* 1. Payment Status */}
                <div className="space-y-3 group/field">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                      1
                    </span>
                    สถานะการชำระเงิน
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
                      คำนวณอัตโนมัติจาก วันที่จัดส่ง + {sale.creditDays || 0}{" "}
                      วัน
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
                    </label>
                    <div className="relative max-w-md">
                      <DatePicker
                        value={paymentDate}
                        onChange={(val) => setPaymentDate(val || "")}
                        label=""
                        placeholder="เลือกวันที่ชำระเงิน"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Notes */}
                <div className="space-y-3 group/field">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      5
                    </span>
                    หมายเหตุ
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons with Gradient */}
          <div className="flex items-center justify-center gap-4 sticky bottom-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 px-6 h-12 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 h-12 rounded-xl font-semibold min-w-[160px] shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              {/* Use Layout stability to prevent hydration/DOM mismatch errors */}
              <div
                className={
                  submitting ? "flex items-center relative z-10" : "hidden"
                }
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังบันทึก...
              </div>
              <div
                className={
                  !submitting ? "flex items-center relative z-10" : "hidden"
                }
              >
                <Save className="mr-2 h-5 w-5" />
                บันทึกข้อมูล
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
