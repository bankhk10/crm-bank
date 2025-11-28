"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DatePicker from "@/components/custom/DatePicker";
import { Textarea } from "@/components/custom/Textarea";
import { usePermission } from "@/hooks/use-permission";
import type { SaleWithRelations, PaymentConfirmationData } from "@/types/sales";

export default function ConfirmPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hasPermission, allowed, isLoading: permissionLoading } = usePermission("sale.confirm-payment");

  const [sale, setSale] = useState<SaleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sale");
        return res.json();
      })
      .then((data) => {
        setSale(data.sale);
        // Pre-fill delivery date if exists
        if (data.sale.deliveryDate) {
          setDeliveryDate(new Date(data.sale.deliveryDate).toISOString().split("T")[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentDate) {
      setError("กรุณาระบุวันที่ชำระเงิน");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data: PaymentConfirmationData = {
        paymentDate,
        paymentNotes: paymentNotes || undefined,
        deliveryDate: deliveryDate || undefined,
        deliveryNotes: deliveryNotes || undefined,
      };

      const res = await fetch(`/api/sales/${params.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to confirm payment");
      }

      router.push(`/sales/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์ยืนยันการชำระเงิน</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !sale) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!sale) return null;

  if (sale.status !== "AWAITING_PAYMENT") {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>รายการขายนี้ไม่อยู่ในสถานะรอการชำระเงิน</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/sales/${sale.id}`)} className="mt-4">
          กลับไปดูรายละเอียด
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
        <div>
          <h1 className="text-3xl font-bold">ยืนยันการชำระเงิน</h1>
          <p className="text-gray-500 mt-2">
            {sale.saleNumber} - {sale.customer.name}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sale Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายการขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500">ลูกค้า:</span>
              <p className="font-medium">{sale.customer.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">พนักงานขาย:</span>
              <p className="font-medium">{sale.employee.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">วันที่ขาย:</span>
              <p>{format(new Date(sale.saleDate), "dd MMM yyyy", { locale: th })}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ยอดเงินสุทธิ:</span>
              <p className="text-xl font-bold text-blue-600">
                ฿{Number(sale.totalAmount).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePicker
              label="วันที่ชำระเงิน *"
              value={paymentDate}
              onChange={setPaymentDate}
            />

            <Textarea
              label="หมายเหตุการชำระเงิน"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
              placeholder="ระบุรายละเอียดการชำระเงิน เช่น ช่องทางการชำระ เลขที่อ้างอิง ฯลฯ"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการจัดส่ง (ถ้ามี)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePicker
              label="วันที่จัดส่งสินค้า"
              value={deliveryDate}
              onChange={setDeliveryDate}
              placeholder="ระบุวันที่จัดส่งถ้าทราบ"
            />

            <Textarea
              label="หมายเหตุการจัดส่งสินค้า"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              placeholder="ระบุรายละเอียดการจัดส่ง เช่น บริษัทขนส่ง เลขพัสดุ ฯลฯ"
            />

            <Alert>
              <AlertDescription className="text-sm">
                <strong>หมายเหตุ:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>หากระบุวันที่จัดส่งสินค้า สต็อกจะถูกหักทันที</li>
                  <li>หากไม่ระบุวันที่จัดส่ง สต็อกจะถูกจองไว้จนกว่าจะมีการระบุวันที่จัดส่ง</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button type="submit" disabled={submitting} size="lg">
            <CheckCircle className="h-5 w-5 mr-2" />
            {submitting ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
          </Button>
        </div>
      </form>
    </div>
  );
}
