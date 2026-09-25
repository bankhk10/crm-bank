"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  FileCheck,
  Calendar,
  User,
  Store,
  Layers,
  MapPin,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ActivityStatusBadge } from "@/modules/activity-plans/ui/activity-status-badge";
import {
  getUnplannedReviewQueueAction,
  reviewUnplannedActivityAction,
} from "../../../server/actions";
import { WORK_TYPE_CONFIG } from "../../../constants";
import type { ActivityStatus } from "@prisma/client";

type TabStatus = "PENDING_REVIEW" | "RETURNED" | "REVIEWED" | "ALL";

export default function UnplannedReviewQueueView() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    pendingReviewCount: 0,
    returnedCount: 0,
    reviewedCount: 0,
    totalCount: 0,
  });

  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING_REVIEW");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REQUEST_CORRECTION">("APPROVE");
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await getUnplannedReviewQueueAction({
          status: activeTab,
          search: searchQuery,
        });

        if (res.success && (res as any).plans) {
          setPlans((res as any).plans || []);
          if ((res as any).counts) {
            setCounts((res as any).counts);
          }
        } else {
          setError((res as any).error || "เกิดข้อผิดพลาดในการโหลดคิวตรวจสอบกิจกรรมนอกแผนงาน");
        }
      } catch (err: any) {
        setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, searchQuery],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Review Action (Approve / Return)
  const handleOpenReviewDialog = (
    plan: any,
    action: "APPROVE" | "REQUEST_CORRECTION",
  ) => {
    setSelectedPlan(plan);
    setActionType(action);
    setReviewComment("");
    setActionError(null);
    setDialogOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedPlan) return;

    if (actionType === "REQUEST_CORRECTION" && !reviewComment.trim()) {
      setActionError("กรุณาระบุเหตุผลหรือสิ่งที่ต้องการให้แก้ไข (จำเป็น)");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await reviewUnplannedActivityAction(
        selectedPlan.id,
        actionType,
        reviewComment.trim(),
      );

      if (res.success) {
        setDialogOpen(false);
        setSelectedPlan(null);
        setReviewComment("");
        // Reload queue
        loadData(true);
      } else {
        setActionError(res.error || "ไม่สามารถบันทึกผลการตรวจสอบได้");
      }
    } catch (err: any) {
      setActionError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setSubmitting(false);
    }
  };

  const formatThaiDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return format(d, "d MMM yyyy", { locale: th });
    } catch {
      return "-";
    }
  };

  const formatThaiDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return format(d, "d MMM yyyy HH:mm", { locale: th });
    } catch {
      return "-";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <FileCheck className="w-3.5 h-3.5" />
              Unplanned Activity
            </span>
            <span className="text-xs text-slate-400 font-medium">|</span>
            <span className="text-xs text-slate-500 font-medium">Post-Activity Review</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            คิวตรวจสอบกิจกรรมนอกแผนงาน
          </h1>
          <p className="text-sm text-slate-500">
            รายการกิจกรรมนอกแผนงานที่ส่งผลการปฏิบัติงานจริงและรอการตรวจสอบจากหัวหน้างานสายตรง
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/activity-plans">
            <Button variant="outline" size="sm" className="border-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              กลับหน้ารายการ
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="border-slate-300 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING_REVIEW")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "PENDING_REVIEW"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            รอตรวจสอบ
            <Badge
              variant="secondary"
              className={`ml-1 text-[11px] px-1.5 py-0 h-5 ${
                activeTab === "PENDING_REVIEW"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.pendingReviewCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RETURNED")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "RETURNED"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            ส่งกลับแก้ไข
            <Badge
              variant="secondary"
              className={`ml-1 text-[11px] px-1.5 py-0 h-5 ${
                activeTab === "RETURNED"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.returnedCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REVIEWED")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "REVIEWED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ตรวจสอบแล้ว
            <Badge
              variant="secondary"
              className={`ml-1 text-[11px] px-1.5 py-0 h-5 ${
                activeTab === "REVIEWED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.reviewedCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ทั้งหมด
            <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-5 bg-slate-200 text-slate-700">
              {counts.totalCount}
            </Badge>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัส, ชื่อกิจกรรม, ผู้สร้าง, ร้านค้า..."
            className="pl-9 bg-white rounded-xl border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Queue List Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-3xl border border-slate-200 p-8 text-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดคิวงานตรวจสอบ...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <FileCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่พบกิจกรรมในคิวตรวจสอบ</h3>
          <p className="text-sm text-slate-500 max-w-md">
            {activeTab === "PENDING_REVIEW"
              ? "ขณะนี้ไม่มีกิจกรรมนอกแผนงานที่รอคุณตรวจสอบผลการปฏิบัติงาน"
              : activeTab === "RETURNED"
                ? "ไม่มีกิจกรรมนอกแผนงานที่ถูกส่งกลับแก้ไขในขณะนี้"
                : "ไม่พบข้อมูลกิจกรรมที่ตรงกับเงื่อนไขการค้นหา"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const customerName =
              plan.stores?.[0]?.store?.name ||
              plan.farmerCustomer?.name ||
              plan.location ||
              "-";

            const workTypes =
              plan.workTypes?.length > 0
                ? plan.workTypes.map((wt: any) => wt.activityType)
                : plan.activityType
                  ? [plan.activityType]
                  : [];

            const isPendingReview = plan.status === "PENDING_REVIEW";
            const isReturned = plan.status === "RETURNED";
            const isReviewed = plan.status === "REVIEWED";

            return (
              <Card
                key={plan.id}
                className="overflow-hidden border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all rounded-2xl bg-white"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Code, Title, Creator, Work Types */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                          {plan.code || "UP-UNPLANNED"}
                        </span>
                        <ActivityStatusBadge status={plan.status} />
                        {plan.submittedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ส่งตรวจ: {formatThaiDateTime(plan.submittedAt)}
                          </span>
                        )}
                      </div>

                      <div>
                        <Link
                          href={`/activity-plans/${plan.id}`}
                          className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {plan.title}
                        </Link>
                      </div>

                      {/* Creator & Target Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 font-medium">ผู้ปฏิบัติ:</span>
                          <span className="font-semibold text-slate-800 truncate">
                            {plan.employee?.name || plan.createdBy?.name || "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 font-medium">ลูกค้า/ร้านค้า:</span>
                          <span className="font-medium text-slate-800 truncate">
                            {customerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 font-medium">วันที่ปฏิบัติงาน:</span>
                          <span className="font-medium text-slate-800">
                            {formatThaiDate(plan.result?.actualStartDate || plan.startDate)}
                          </span>
                        </div>
                      </div>

                      {/* Work Type Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium mr-1">
                          ประเภทงาน:
                        </span>
                        {workTypes.map((wt: any, idx: number) => {
                          const config = WORK_TYPE_CONFIG[wt?.code || ""];
                          return (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[11px] bg-slate-50 text-slate-700 border-slate-200 font-medium"
                            >
                              {config?.shortName || wt?.name || wt?.code}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Review Comment if Returned */}
                      {isReturned && plan.approvalLogs?.[0]?.comment && (
                        <div className="mt-2 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900">
                          <span className="font-semibold text-amber-800 block mb-0.5">
                            เหตุผลที่ส่งกลับ:
                          </span>
                          &ldquo;{plan.approvalLogs[0].comment}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <Link href={`/activity-plans/${plan.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300 hover:bg-slate-50 text-slate-700 h-9"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          ดูรายละเอียด
                        </Button>
                      </Link>

                      {plan.canReview && isPendingReview && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenReviewDialog(plan, "APPROVE")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs h-9"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            ผ่าน
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviewDialog(plan, "REQUEST_CORRECTION")}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 font-semibold h-9"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            ส่งกลับแก้ไข
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Confirmation / Comment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              {actionType === "APPROVE" ? (
                <>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  ยืนยันการผ่านการตรวจสอบ
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  ส่งกลับแก้ไขผลการปฏิบัติงาน
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              กิจกรรม: <span className="font-semibold text-slate-800">{selectedPlan?.title}</span> (
              {selectedPlan?.code})
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive" className="rounded-xl my-2">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">{actionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold text-slate-700">
              {actionType === "REQUEST_CORRECTION" ? (
                <>
                  เหตุผล / ข้อความที่ต้องการให้พนักงานแก้ไข{" "}
                  <span className="text-rose-500">*</span>
                </>
              ) : (
                "ข้อคิดเห็นเพิ่มเติม (ไม่บังคับ)"
              )}
            </Label>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                actionType === "REQUEST_CORRECTION"
                  ? "เช่น รูปถ่ายไม่ชัดเจน, กรุณาระบุผลการทดลองเพิ่มเติม..."
                  : "เช่น ผลการปฏิบัติงานครบถ้วนเรียบร้อย..."
              }
              rows={4}
              className="text-sm rounded-xl border-slate-200 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="border-slate-300"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReview}
              disabled={submitting}
              className={
                actionType === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  : "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              }
            >
              {submitting
                ? "กำลังบันทึก..."
                : actionType === "APPROVE"
                  ? "ยืนยันผ่านการตรวจสอบ"
                  : "ยืนยันส่งกลับแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
