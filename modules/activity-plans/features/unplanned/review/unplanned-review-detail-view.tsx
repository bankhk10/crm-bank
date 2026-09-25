"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Clock,
  AlertCircle,
  FileCheck,
  Calendar,
  User,
  Store,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  History,
  Edit,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { WORK_TYPE_CONFIG } from "@/modules/activity-plans/constants";
import {
  getActivityPlanAction,
  reviewUnplannedActivityAction,
} from "@/modules/activity-plans/server/actions";
import { parseResultSummary } from "../../shared/actual-view/utils/summary-parser";
import { DetailActivityResultSection } from "../../shared/detail-view/components/detail-activity-result-section";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";

interface UnplannedReviewDetailViewProps {
  id: string;
  onBack?: () => void;
}

export default function UnplannedReviewDetailView({
  id,
  onBack,
}: UnplannedReviewDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission } = usePermission("menu.activity_plans");

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REQUEST_CORRECTION">("APPROVE");
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(res.error || "ไม่พบข้อมูลกิจกรรมนอกแผนงาน");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Roles & Permissions check
  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN" ||
    hasPermission("activity.manage");

  const currentUserId = session?.user?.id;
  const currentUserEmployeeId = session?.user?.employeeId;

  const isCreator =
    (currentUserId && plan?.createdById === currentUserId) ||
    (currentUserEmployeeId && plan?.employeeId === currentUserEmployeeId);

  const isDirectManager =
    Boolean(currentUserEmployeeId) &&
    (plan?.employee?.managerId === currentUserEmployeeId ||
      plan?.currentApproverEmployeeId === currentUserEmployeeId);

  const canReview =
    plan?.status === "PENDING_REVIEW" &&
    !isCreator &&
    (isAdmin || isDirectManager);

  // Handle Review
  const handleOpenReviewDialog = (action: "APPROVE" | "REQUEST_CORRECTION") => {
    setActionType(action);
    setReviewComment("");
    setActionError(null);
    setDialogOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!plan) return;

    if (actionType === "REQUEST_CORRECTION" && !reviewComment.trim()) {
      setActionError("กรุณาระบุเหตุผลหรือข้อความที่ต้องแก้ไขเมื่อส่งกลับ (จำเป็น)");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await reviewUnplannedActivityAction(
        plan.id,
        actionType,
        reviewComment.trim(),
      );

      if (res.success) {
        setDialogOpen(false);
        setReviewComment("");
        // Reload plan data
        loadData();
      } else {
        setActionError(res.error || "ไม่สามารถบันทึกผลการตรวจสอบได้");
      }
    } catch (err: any) {
      setActionError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Parsed Result Summary for work type details
  const parsedResults = useMemo(() => {
    if (!plan?.result) return {};
    return parseResultSummary(plan.result);
  }, [plan?.result]);

  // Work Types
  const resolvedWorkTypes = useMemo(() => {
    if (plan?.workTypes && plan.workTypes.length > 0) {
      return plan.workTypes.map((wt: any) => ({
        code: wt.activityType?.code || "TYPE_1",
        name: wt.activityType?.name || "",
      }));
    }
    if (plan?.activityType) {
      return [{ code: plan.activityType.code, name: plan.activityType.name }];
    }
    return [];
  }, [plan]);

  const isTypeVisible = useCallback(
    (typeName: string) => {
      return resolvedWorkTypes.some(
        (wt: any) => wt.name === typeName || wt.code === typeName,
      );
    },
    [resolvedWorkTypes],
  );

  // Review Audit Logs (step === "POST_ACTIVITY_REVIEW" or all unplanned logs)
  const reviewLogs = useMemo(() => {
    if (!plan?.approvalLogs) return [];
    return (plan.approvalLogs as any[]).filter(
      (log) =>
        log.step === "POST_ACTIVITY_REVIEW" ||
        ["SUBMIT", "REQUEST_CORRECTION", "APPROVE"].includes(log.action),
    );
  }, [plan?.approvalLogs]);

  // Latest Returned Comment
  const returnedComment = useMemo(() => {
    if (plan?.status !== "RETURNED") return null;
    const returnLog = reviewLogs.find(
      (l) => l.action === "REQUEST_CORRECTION" || l.toStatus === "RETURNED",
    );
    return returnLog?.comment || null;
  }, [plan?.status, reviewLogs]);

  const formatThaiDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return format(d, "d MMMM yyyy", { locale: th });
    } catch {
      return "-";
    }
  };

  const formatThaiDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return format(d, "d MMM yyyy HH:mm น.", { locale: th });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">กำลังโหลดรายละเอียดกิจกรรมนอกแผนงาน...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 my-8">
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-sm">
            {error || "ไม่พบข้อมูลกิจกรรมนอกแผนงาน"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack} className="border-slate-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const isPendingReview = plan.status === "PENDING_REVIEW";
  const isReturned = plan.status === "RETURNED";
  const isReviewed = plan.status === "REVIEWED";
  const isDraft = plan.status === "DRAFT";

  const customerName =
    plan.stores?.[0]?.store?.name ||
    plan.farmerCustomer?.name ||
    plan.location ||
    "-";

  const attachments = plan.result?.attachments || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Sticky Header / Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 rounded-xl border-slate-200 hover:bg-slate-50 shrink-0 mr-1"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
              {plan.code || "UP-UNPLANNED"}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <FileCheck className="w-3 h-3" />
              กิจกรรมนอกแผนงาน
            </span>
            <ActivityStatusBadge status={plan.status} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
            {plan.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              ผู้ปฏิบัติงาน:{" "}
              <b className="text-slate-800 font-semibold">
                {plan.employee?.name || plan.createdBy?.name || "-"}
              </b>
            </span>
            {plan.submittedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                ส่งตรวจเมื่อ: {formatThaiDateTime(plan.submittedAt)}
              </span>
            )}
            {plan.currentApprover && (
              <span className="flex items-center gap-1">
                ผู้ตรวจสอบ:{" "}
                <b className="text-slate-800 font-semibold">{plan.currentApprover.name}</b>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
          {/* Review Actions for Manager / Admin */}
          {canReview && (
            <>
              <Button
                type="button"
                onClick={() => handleOpenReviewDialog("APPROVE")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs h-10 px-4 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                ผ่านการตรวจสอบ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenReviewDialog("REQUEST_CORRECTION")}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 font-semibold h-10 px-4 rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                ส่งกลับแก้ไข
              </Button>
            </>
          )}

          {/* Edit button for Creator when Draft or Returned */}
          {isCreator && (isDraft || isReturned) && (
            <Link href={`/activity-plans/unplanned/${plan.id}/edit`}>
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-4 rounded-xl"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                แก้ไขข้อมูล / ส่งตรวจใหม่
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* RETURNED Notice */}
      {isReturned && (
        <Alert className="bg-amber-50/90 border-amber-200 text-amber-900 rounded-3xl p-5 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="ml-2 space-y-1">
            <AlertTitle className="font-bold text-sm text-amber-950">
              กิจกรรมนี้ถูกส่งกลับเพื่อแก้ไข (Returned)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-amber-800">
              {returnedComment ? (
                <div className="bg-white/80 border border-amber-200/80 rounded-2xl p-3.5 my-2 font-medium text-slate-800">
                  <span className="text-amber-800 font-semibold block text-xs mb-1">
                    เหตุผลจากหัวหน้างาน:
                  </span>
                  &ldquo;{returnedComment}&rdquo;
                </div>
              ) : (
                <p>หัวหน้างานได้ส่งกลับกิจกรรมนี้เพื่อให้พนักงานแก้ไขข้อมูล</p>
              )}
              {isCreator && (
                <p className="text-amber-700 text-xs pt-1">
                  💡 คุณสามารถกดปุ่ม <b>&ldquo;แก้ไขข้อมูล / ส่งตรวจใหม่&rdquo;</b>{" "}
                  ด้านบนเพื่อปรับปรุงผลการปฏิบัติงานหรือรูปภาพ แล้วส่งให้หัวหน้าพิจารณาอีกครั้ง
                </p>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* PENDING_REVIEW Notice */}
      {isPendingReview && (
        <Alert className="bg-blue-50/80 border-blue-200 text-blue-900 rounded-3xl p-4 sm:p-5">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm text-blue-950">
              รอการตรวจสอบจากหัวหน้างาน (Pending Review)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-blue-800 mt-1">
              กิจกรรมได้รับการบันทึกผลการปฏิบัติงานจริงเรียบร้อยแล้ว
              และอยู่ระหว่างรอหัวหน้างานตรวจสอบความถูกต้อง
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* REVIEWED Notice */}
      {isReviewed && (
        <Alert className="bg-emerald-50/80 border-emerald-200 text-emerald-900 rounded-3xl p-4 sm:p-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm text-emerald-950">
              ผ่านการตรวจสอบแล้ว (Reviewed)
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-emerald-800 mt-1">
              กิจกรรมนอกแผนงานนี้ผ่านการตรวจสอบเรียบร้อยแล้ว (View Only)
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Section 1: Overview & Location */}
      <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            ข้อมูลกิจกรรมนอกแผนงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs font-medium block">วันที่ปฏิบัติงานจริง</span>
              <span className="font-semibold text-slate-800">
                {formatThaiDate(plan.result?.actualStartDate || plan.startDate)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-medium block">ลูกค้า / ร้านค้า / เกษตรกร</span>
              <span className="font-semibold text-slate-800">{customerName}</span>
              {plan.farmerCustomer?.phone && (
                <span className="text-xs text-slate-500 block">
                  โทร: {plan.farmerCustomer.phone}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-xs font-medium block">สถานที่ / พื้นที่</span>
              <span className="font-semibold text-slate-800">
                {[plan.location, plan.district, plan.province].filter(Boolean).join(", ") || "-"}
              </span>
            </div>
          </div>

          {plan.objective && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 text-xs font-medium block mb-1">
                วัตถุประสงค์
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{plan.objective}</p>
            </div>
          )}

          {plan.description && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 text-xs font-medium block mb-1">
                รายละเอียดเพิ่มเติม
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{plan.description}</p>
            </div>
          )}

          {/* Work Types */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-slate-400 text-xs font-medium block mb-2">
              ประเภทงานที่ปฏิบัติจริง
            </span>
            <div className="flex flex-wrap gap-2">
              {resolvedWorkTypes.map((wt: any, idx: number) => {
                const config = WORK_TYPE_CONFIG[wt.code];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
                  >
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {config?.shortName || wt.code}
                    </Badge>
                    <span>{config?.name || wt.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Actual Execution Results */}
      {plan.result && (
        <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              ผลการปฏิบัติงานจริง (Actual Results)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Summary & Discussion */}
            {(plan.result.resultSummary || plan.result.discussionResult) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.result.resultSummary && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-600 block mb-1">
                      สรุปผลการปฏิบัติงาน
                    </span>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {plan.result.resultSummary}
                    </p>
                  </div>
                )}
                {plan.result.discussionResult && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-600 block mb-1">
                      ผลการพูดคุย / เจรจา
                    </span>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {plan.result.discussionResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Financial / Sales Numbers Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {plan.result.salesResultAmount != null && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    ยอดขายจริง
                  </span>
                  <span className="text-base font-bold text-emerald-900">
                    {Number(plan.result.salesResultAmount).toLocaleString()} บาท
                  </span>
                </div>
              )}
              {plan.result.collectResultAmount != null && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
                  <span className="text-[11px] text-blue-700 font-medium block">
                    ยอดเก็บเงินจริง
                  </span>
                  <span className="text-base font-bold text-blue-900">
                    {Number(plan.result.collectResultAmount).toLocaleString()} บาท
                  </span>
                </div>
              )}
              {plan.result.actualSalesPromotionSpent != null && (
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
                  <span className="text-[11px] text-purple-700 font-medium block">
                    ค่าส่งเสริมการขายใช้จริง
                  </span>
                  <span className="text-base font-bold text-purple-900">
                    {Number(plan.result.actualSalesPromotionSpent).toLocaleString()} บาท
                  </span>
                </div>
              )}
              {plan.result.actualMarketingSpent != null && (
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl">
                  <span className="text-[11px] text-amber-700 font-medium block">
                    ค่างบการตลาดใช้จริง
                  </span>
                  <span className="text-base font-bold text-amber-900">
                    {Number(plan.result.actualMarketingSpent).toLocaleString()} บาท
                  </span>
                </div>
              )}
            </div>

            {/* Existing Work Type Actual Details */}
            <div className="pt-2">
              <DetailActivityResultSection
                isTypeVisible={isTypeVisible}
                targets={{} as any}
                parsedResults={parsedResults}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Evidence & Attachments */}
      {attachments.length > 0 && (
        <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              รูปภาพและหลักฐานการปฏิบัติงาน ({attachments.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {attachments.map((att: any, idx: number) => {
                const isImage =
                  att.mimeType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl || "");

                return (
                  <div
                    key={att.id || idx}
                    className="group relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 aspect-video flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all shadow-2xs"
                    onClick={() => {
                      if (isImage) setPreviewImage(att.fileUrl);
                      else window.open(att.fileUrl, "_blank");
                    }}
                  >
                    {isImage ? (
                      <img
                        src={att.fileUrl}
                        alt={att.fileName || "หลักฐานการปฏิบัติงาน"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="p-3 text-center space-y-1">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[11px] text-slate-600 font-medium block truncate max-w-[120px]">
                          {att.fileName || "เอกสารแนบ"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิดดู
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Review History / Timeline */}
      <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            ประวัติการตรวจสอบผลการปฏิบัติงาน (Review Audit Trail)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {reviewLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              ยังไม่มีประวัติการส่งตรวจสอบ
            </p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {reviewLogs.map((log: any, idx: number) => {
                const isSubmit = log.action === "SUBMIT";
                const isCorrection =
                  log.action === "REQUEST_CORRECTION" || log.toStatus === "RETURNED";
                const isApproved =
                  log.action === "APPROVE" || log.toStatus === "REVIEWED";

                const badgeBg = isSubmit
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : isCorrection
                    ? "bg-amber-100 text-amber-900 border-amber-200"
                    : isApproved
                      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                      : "bg-slate-100 text-slate-800 border-slate-200";

                const dotColor = isSubmit
                  ? "bg-blue-500"
                  : isCorrection
                    ? "bg-amber-500"
                    : isApproved
                      ? "bg-emerald-500"
                      : "bg-slate-400";

                return (
                  <div key={log.id || idx} className="relative">
                    {/* Dot */}
                    <div
                      className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor} shadow-xs`}
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeBg}`}>
                          {isSubmit
                            ? "ส่งขอตรวจสอบ"
                            : isCorrection
                              ? "ส่งกลับแก้ไข (Returned)"
                              : isApproved
                                ? "ผ่านการตรวจสอบ (Reviewed)"
                                : log.action}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatThaiDateTime(log.createdAt)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        โดย: <span className="font-semibold text-slate-800">{log.user?.name || "ระบบ"}</span>
                      </div>

                      {log.comment && (
                        <div className="mt-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800">
                          &ldquo;{log.comment}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
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
              กิจกรรม: <span className="font-semibold text-slate-800">{plan.title}</span> ({plan.code})
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
                  ? "ระบุจุดที่ต้องแก้ไข เช่น รูปถ่ายไม่ชัดเจน, ผลการเข้าพบไม่ครบถ้วน..."
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

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 rounded-2xl overflow-hidden">
            <img
              src={previewImage}
              alt="ภาพหลักฐานการปฏิบัติงาน"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl mx-auto"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
