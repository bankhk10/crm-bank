"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { TemporaryCreditLimitWithRelations, TemporaryCreditStatus } from "@/modules/temporary-credit-limits/types";
import { approveTemporaryCreditLimitAction } from "@/modules/temporary-credit-limits/server/actions";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  FileText,
  Banknote,
  Clock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
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
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
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

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successType, setSuccessType] = useState<"approve" | "reject">("approve");

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

  const handleApproveClick = () => {
    setShowApproveDialog(true);
  };

  const handleApproveConfirm = async () => {
    setShowApproveDialog(false);
    setSubmitting(true);
    setError(null);

    try {
      const res = await approveTemporaryCreditLimitAction(id, { approve: true });
      if (!res.success) {
        throw new Error(res.error || "Failed to approve");
      }

      setSuccessType("approve");
      setSuccessMessage("อนุมัติคำขอสำเร็จ");
      setShowSuccessDialog(true);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    if (!rejectionReason.trim()) {
      setError("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    setShowRejectDialog(false);
    setSubmitting(true);
    setError(null);

    try {
      const res = await approveTemporaryCreditLimitAction(id, { approve: false, rejectionReason });
      if (!res.success) {
        throw new Error(res.error || "Failed to reject");
      }

      setSuccessType("reject");
      setSuccessMessage("ปฏิเสธคำขอสำเร็จ");
      setShowSuccessDialog(true);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    router.push("/temporary-credit-limits");
  };

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
                <ShieldCheck className="h-8 w-8" />
                <h1 className="text-3xl lg:text-4xl font-bold">อนุมัติ/ปฏิเสธคำขอ</h1>
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
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

          {/* Approval Actions Card */}
          {isPending && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-100 to-purple-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  การอนุมัติ
                </h2>
              </div>
              <div className="p-6">
                {!showRejectForm ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex-1"
                      onClick={handleApproveClick}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {submitting ? "กำลังดำเนินการ..." : "อนุมัติคำขอ"}
                    </Button>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex-1"
                      onClick={() => setShowRejectForm(true)}
                      disabled={submitting}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      ไม่อนุมัติคำขอ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <label className="block text-base font-semibold text-red-900 mb-3">
                        เหตุผลที่ไม่อนุมัติ <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-red-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900 placeholder-gray-400"
                        rows={5}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติคำขอนี้..."
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex-1"
                        onClick={handleRejectClick}
                        disabled={submitting || !rejectionReason.trim()}
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        {submitting ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 hover:bg-gray-50 flex-1"
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
            </div>
          )}

          {/* Already Processed Alert */}
          {!isPending && (
            <Alert className="border-2 border-blue-200 bg-blue-50">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-900 font-medium">
                คำขอนี้ได้รับการดำเนินการแล้ว
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              ยืนยันการอนุมัติ
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              คุณแน่ใจหรือไม่ว่าต้องการอนุมัติคำขอนี้?
              <br />
              <span className="text-gray-900 font-semibold mt-2 inline-block">
                จำนวนเงิน: {data && formatCurrency(Number(data.requestedAmount))}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              className="w-full sm:w-32"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleApproveConfirm}
              className="w-full sm:w-32 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-red-900">
              ยืนยันการปฏิเสธ
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอนี้?
              <br />
              <span className="text-gray-900 font-semibold mt-2 inline-block">
                เหตุผล: {rejectionReason}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="w-full sm:w-32"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleRejectConfirm}
              className="w-full sm:w-32 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full animate-bounce ${successType === "approve"
              ? "bg-gradient-to-br from-green-100 to-emerald-100"
              : "bg-gradient-to-br from-orange-100 to-amber-100"
              }`}>
              {successType === "approve" ? (
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-orange-600" />
              )}
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              {successMessage}
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              {successType === "approve"
                ? "คำขอได้รับการอนุมัติเรียบร้อยแล้ว"
                : "คำขอได้รับการปฏิเสธเรียบร้อยแล้ว"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-6">
            <Button
              onClick={handleSuccessClose}
              className={`w-full sm:w-40 ${successType === "approve"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                } text-white`}
            >
              ตกลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
