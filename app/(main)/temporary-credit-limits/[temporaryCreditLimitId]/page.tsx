"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { TemporaryCreditLimitWithRelations, TemporaryCreditStatus } from "@/modules/temporary-credit-limits/types";
import Link from "next/link";
import {
  Edit,
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Banknote
} from "lucide-react";

const getStatusConfig = (status: TemporaryCreditStatus) => {
  switch (status) {
    case "PENDING":
      return {
        badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1.5 text-sm font-semibold">รออนุมัติ</Badge>,
        icon: <Clock className="h-5 w-5 text-yellow-600" />,
        gradient: "from-yellow-500 via-amber-500 to-orange-500"
      };
    case "APPROVED":
      return {
        badge: <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-1.5 text-sm font-semibold">อนุมัติแล้ว</Badge>,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        gradient: "from-green-500 via-emerald-500 to-teal-500"
      };
    case "REJECTED":
      return {
        badge: <Badge className="bg-red-100 text-red-800 border-red-300 px-4 py-1.5 text-sm font-semibold">ไม่อนุมัติ</Badge>,
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        gradient: "from-red-500 via-rose-500 to-pink-500"
      };
    default:
      return {
        badge: <Badge variant="outline">{status}</Badge>,
        icon: <AlertCircle className="h-5 w-5 text-gray-600" />,
        gradient: "from-gray-500 via-slate-500 to-gray-600"
      };
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
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

  const statusConfig = getStatusConfig(data.status);

  return (
    <div className="min-h-screen">
      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className={`bg-gradient-to-br ${statusConfig.gradient} text-white rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8`}>
          <Link
            href="/temporary-credit-limits"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายการวงเงินเครดิตชั่วคราว
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-8 w-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">วงเงินเครดิตชั่วคราว</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {statusConfig.icon}
                  {statusConfig.badge}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Amount Card - Featured */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-200 to-emerald-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Banknote className="h-6 w-6 text-emerald-600" />
                จำนวนเงินที่ขอ
              </h2>
            </div>
            <div className="p-8">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-8 border border-emerald-200 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-3 bg-emerald-600 rounded-lg">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p className="text-5xl font-bold text-emerald-900">
                  {formatCurrency(Number(data.requestedAmount))}
                </p>
              </div>
            </div>
          </div>

          {/* Information Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-100 to-indigo-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  ข้อมูลลูกค้า
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={<User className="h-5 w-5" />}
                  label="รหัสลูกค้า"
                  value={data.customer.customerCode}
                />
                <DetailItem
                  icon={<User className="h-5 w-5" />}
                  label="ชื่อลูกค้า"
                  value={data.customer.name}
                />
              </div>
            </div>

            {/* Request Details Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-100 to-pink-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  รายละเอียดคำขอ
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <DetailItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="วันหมดอายุ"
                  value={formatDateOnly(data.expiryDate)}
                />
                <DetailItem
                  icon={<User className="h-5 w-5" />}
                  label="ผู้ขอ"
                  value={data.requestedBy?.name || "-"}
                />
                <DetailItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="วันที่ขอ"
                  value={formatDate(data.requestedAt)}
                />
              </div>
            </div>
          </div>

          {/* Approval Information Card - Conditional */}
          {(data.approvedBy || data.approvedAt) && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-amber-600" />
                  ข้อมูลการอนุมัติ
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.approvedBy && (
                    <DetailItem
                      icon={<User className="h-5 w-5" />}
                      label="ผู้อนุมัติ/ปฏิเสธ"
                      value={data.approvedBy.name || "-"}
                    />
                  )}
                  {data.approvedAt && (
                    <DetailItem
                      icon={<Calendar className="h-5 w-5" />}
                      label="วันที่อนุมัติ/ปฏิเสธ"
                      value={formatDate(data.approvedAt)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason Card - Conditional */}
          {data.rejectionReason && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-red-200">
              <div className="p-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
                <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  เหตุผลที่ไม่อนุมัติ
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 leading-relaxed whitespace-pre-wrap">{data.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Card - Conditional */}
          {data.notes && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-slate-600" />
                  หมายเหตุ
                </h2>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd className="text-base text-gray-900 font-medium break-words">{value || "-"}</dd>
      </div>
    </div>
  );
}
