"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { TemporaryCreditLimitWithRelations, TemporaryCreditStatus } from "@/types/temporary-credit-limit";
import Link from "next/link";
import { Edit, ArrowLeft } from "lucide-react";

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

export default function ViewTemporaryCreditLimitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.temporaryCreditLimitId as string;

  const [data, setData] = useState<TemporaryCreditLimitWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="bg-white shadow-sm sm:rounded-lg p-6">
        <div className="text-center py-8">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "ไม่พบข้อมูล"}</AlertDescription>
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

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h5 className="font-semibold text-3xl">
              รายละเอียดวงเงินเครดิตชั่วคราว
            </h5>
            {data.status !== "APPROVED" && (
              <Link href={`/temporary-credit-limits/${id}/edit`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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

            {data.approvedBy && (
              <div>
                <label className="block text-sm font-medium text-gray-500">ผู้อนุมัติ/ปฏิเสธ</label>
                <p className="mt-1 text-gray-900">{data.approvedBy.name || "-"}</p>
              </div>
            )}

            {data.approvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500">วันที่อนุมัติ/ปฏิเสธ</label>
                <p className="mt-1 text-gray-900">{formatDate(data.approvedAt)}</p>
              </div>
            )}

            {data.rejectionReason && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">เหตุผลที่ไม่อนุมัติ</label>
                <p className="mt-1 text-red-600 bg-red-50 p-3 rounded">{data.rejectionReason}</p>
              </div>
            )}

            {data.notes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">หมายเหตุ</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{data.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
