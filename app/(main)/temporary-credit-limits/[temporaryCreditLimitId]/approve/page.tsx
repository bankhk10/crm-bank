"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { TemporaryCreditLimitWithRelations, TemporaryCreditStatus } from "@/types/temporary-credit-limit";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const getStatusBadge = (status: TemporaryCreditStatus) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">รออนุมัติ</Badge>;
    case "APPROVED":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">อนุมัติแล้ว</Badge>;
    case "REJECTED":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">ไม่อนุมัติ</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ApproveTemporaryCreditLimitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.temporaryCreditLimitId as string;

  const [data, setData] = useState<TemporaryCreditLimitWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/temporary-credit-limits/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.temporaryCreditLimit);
        } else {
          setError("ไม่พบข้อมูลวงเงินเครดิตชั่วคราว");
        }
      } catch (e) {
        console.error("Failed to load data", e);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการอนุมัติคำขอนี้?")) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/temporary-credit-limits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to approve");
      }

      alert("อนุมัติสำเร็จ");
      router.push("/temporary-credit-limits");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }

    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอนี้?")) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/temporary-credit-limits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: false, rejectionReason }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to reject");
      }

      alert("ปฏิเสธสำเร็จ");
      router.push("/temporary-credit-limits");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm sm:rounded-lg p-6">
        <div className="text-center py-8">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>ไม่พบข้อมูล</AlertDescription>
      </Alert>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "dd MMM yyyy HH:mm", { locale: th });
  };

  const formatDateOnly = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "dd MMM yyyy", { locale: th });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const isPending = data.status === "PENDING";

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/temporary-credit-limits")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="border-b pb-4 mb-6">
            <h5 className="font-semibold text-3xl">
              อนุมัติ/ปฏิเสธคำขอวงเงินเครดิตชั่วคราว
            </h5>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-500">สถานะ</label>
              <div className="mt-1">{getStatusBadge(data.status)}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">รหัสลูกค้า</label>
              <p className="mt-1 text-gray-900">{data.customer.customerCode}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">ชื่อลูกค้า</label>
              <p className="mt-1 text-gray-900">{data.customer.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">จำนวนเงินที่ขอ</label>
              <p className="mt-1 text-gray-900 font-semibold text-lg">
                {formatCurrency(Number(data.requestedAmount))}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">วันหมดอายุ</label>
              <p className="mt-1 text-gray-900">{formatDateOnly(data.expiryDate)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">ผู้ขอ</label>
              <p className="mt-1 text-gray-900">{data.requestedBy?.name || "-"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">วันที่ขอ</label>
              <p className="mt-1 text-gray-900">{formatDate(data.requestedAt)}</p>
            </div>

            {data.notes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">หมายเหตุ</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{data.notes}</p>
              </div>
            )}
          </div>

          {isPending && (
            <div className="border-t pt-6">
              <h6 className="font-semibold text-xl mb-4">การอนุมัติ</h6>

              {!showRejectForm ? (
                <div className="flex gap-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    อนุมัติ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={submitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลที่ไม่อนุมัติ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="กรุณาระบุเหตุผล..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={submitting || !rejectionReason.trim()}
                    >
                      ยืนยันปฏิเสธ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      disabled={submitting}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isPending && (
            <Alert>
              <AlertDescription>
                คำขอนี้ได้รับการดำเนินการแล้ว
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </section>
  );
}
