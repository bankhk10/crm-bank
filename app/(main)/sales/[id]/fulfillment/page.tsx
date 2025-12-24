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
        router.push(`/sales/${id}`);
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
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
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            จัดการการชำระเงินและวันที่จัดส่ง
          </h1>
          <p className="text-gray-500">
            {sale.saleNumber} - {sale.customer.name}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">
              ข้อมูลรายการขาย
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block mb-1">ยอดรวมสุทธิ</span>
              <span className="font-semibold text-lg text-blue-600">
                ฿{Number(sale.totalAmount).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">เงื่อนไขการชำระ</span>
              <Badge variant="outline">
                {PaymentTermLabels[sale.paymentTerm]}
              </Badge>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">เครดิต (วัน)</span>
              <span className="font-medium">{sale.creditDays || 0} วัน</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">สถานะปัจจุบัน</span>
              <Badge variant="secondary" className="bg-white">
                {SaleStatusLabels[sale.status]}
              </Badge>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">
                วันที่ต้องการของ
              </span>
              <span className="font-medium">
                {formatDate(sale.requestedDeliveryDate)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Input Card */}
        <Card className="shadow-md border-0 ring-1 ring-slate-200">
          <CardHeader className="border-b bg-white rounded-t-xl pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              ข้อมูลการชำระเงินและการจัดส่ง
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* 1. Payment Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                1. สถานะการชำระเงิน
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {SaleStatusLabels[st as keyof typeof SaleStatusLabels] ||
                        st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                เลือกสถานะปัจจุบันของรายการขาย
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 2. Delivery Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium">
                    2. วันที่จัดส่งของ
                  </label>
                </div>
                <DatePicker
                  value={deliveryDate}
                  onChange={(val) => setDeliveryDate(val || "")}
                  label=""
                  placeholder="เลือกวันที่จัดส่ง"
                />
              </div>

              {/* 3. Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium">
                    3. วันครบกำหนดชำระ
                  </label>
                </div>
                <DatePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val || "")}
                  label=""
                  placeholder="เลือกวันครบกำหนด"
                />
                <p className="text-xs text-blue-600">
                  * คำนวณอัตโนมัติจาก วันที่จัดส่ง + {sale.creditDays || 0} วัน
                </p>
              </div>

              {/* 4. Payment Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium">
                    4. วันที่ชำระเงิน
                  </label>
                </div>
                <DatePicker
                  value={paymentDate}
                  onChange={(val) => setPaymentDate(val || "")}
                  label=""
                  placeholder="เลือกวันที่ชำระเงิน"
                />
              </div>
            </div>

            {/* 5. Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                หมายเหตุ
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="bg-white"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
          >
            {/* Use Layout stability to prevent hydration/DOM mismatch errors */}
            <div className={submitting ? "flex items-center" : "hidden"}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </div>
            <div className={!submitting ? "flex items-center" : "hidden"}>
              <Save className="mr-2 h-4 w-4" />
              บันทึกข้อมูล
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
}
