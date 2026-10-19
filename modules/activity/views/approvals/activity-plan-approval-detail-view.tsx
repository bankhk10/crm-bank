"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  Calendar,
  User,
  FileText,
  Layers,
  Info,
  UserCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ActivityStatusBadge,
  resolveCurrentOperator,
} from "@/modules/activity/ui/activity-status-badge";
import {
  BudgetSection,
  PromotionalMaterialsSection,
  MarketingExpenseSection,
} from "../actual/components";
import { DetailViewActions } from "../detail/components/detail-view-actions";
import {
  ApprovalActionDialog,
  ApprovalAuditLogs,
  ApprovalWorkTypeList,
  HelperReviewDialog,
} from "./components";
import { useApprovalDetailLoader } from "./hooks";

interface ActivityPlanApprovalDetailViewProps {
  id: string;
  onBack?: () => void;
}

export default function ActivityPlanApprovalDetailView({
  id,
  onBack,
}: ActivityPlanApprovalDetailViewProps) {
  const router = useRouter();

  const {
    plan,
    loading,
    error,
    session,
    canManageOrApprove,
    planSummary,
    resolvedWorkTypes,
    targets,
    type1Targets,
    parsedResults,
    canPerformApproval,
    actionDialogOpen,
    setActionDialogOpen,
    actionType,
    handleOpenActionDialog,
    reviewingHelperId,
    setReviewingHelperId,
    rejectHelperDialogOpen,
    setRejectHelperDialogOpen,
    helperRejectReason,
    setHelperRejectReason,
    isProcessingHelper,
    handleApproveHelper,
    handleRejectHelper,
    isTypeActive,
  } = useApprovalDetailLoader({ id });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans/approvals");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลสำหรับการอนุมัติ...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto p-4 max-w-2xl space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูลสำหรับการอนุมัติ"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack} className="text-xs">
          กลับหน้ารายการอนุมัติ
        </Button>
      </div>
    );
  }

  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const startDateDisplay = planSummary.startDateStr || format(start, "dd/MM/yyyy", { locale: th });
  const endDateDisplay = planSummary.endDateStr || format(end, "dd/MM/yyyy", { locale: th });
  const startTimeDisplay = planSummary.startTimeStr || format(start, "HH:mm") + " น.";
  const endTimeDisplay = planSummary.endTimeStr || format(end, "HH:mm") + " น.";

  const userEmployeeId = session?.user?.employeeId;
  const operator = resolveCurrentOperator(plan);

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* ─── 1. TOP HEADER (APPROVAL VIEW) ─── */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight whitespace-nowrap">
                {plan.planType === "UNPLANNED"
                  ? "พิจารณาอนุมัติกิจกรรมนอกแผน ( Unplanned Activity Approval )"
                  : "พิจารณาอนุมัติแผนงาน ( Trip Plan Approval )"}
              </h1>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs border",
                plan.planType === "UNPLANNED"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200",
              )}
            >
              {plan.planType === "UNPLANNED" ? "นอกแผน" : "ตามแผน"}
            </span>
            {(plan.code || planSummary.planNo) && (
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {plan.planType === "UNPLANNED" ? "เลขที่กิจกรรม: " : "เลขที่แผน: "}
                  {plan.code || planSummary.planNo}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. GENERAL PLAN INFORMATION (Overview) ─── */}
        <div className="space-y-3.5">
          {operator && (
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
                    ผู้ดำเนินการปัจจุบัน
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                    {operator.displayRole}
                    {operator.employeeName && (
                      <span className="text-xs sm:text-sm font-medium text-slate-600 ml-2">
                        ({operator.employeeName})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1 shrink-0 self-start sm:self-auto border-t sm:border-t-0 border-blue-100 pt-2 sm:pt-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  สถานะ
                </span>
                <ActivityStatusBadge status={plan.status} />
              </div>
            </div>
          )}

          {plan.status === "PENDING_CANCELLATION" && (
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    แผนงานนี้อยู่ระหว่างขออนุมัติการยกเลิก
                  </h3>
                  {plan.cancellationReason && (
                    <p className="text-xs text-amber-800 mt-0.5">
                      เหตุผลที่ขอยกเลิก:{" "}
                      <span className="font-semibold italic">
                        &quot;{plan.cancellationReason}&quot;
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Core Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  ชื่อแผนงาน / กิจกรรม
                </p>
                <p className="text-base font-bold text-slate-800 truncate" title={plan.title}>
                  {plan.title || "-"}
                </p>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  วันที่เริ่ม - สิ้นสุด ({plan.durationDays} วัน)
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    {startDateDisplay} {startTimeDisplay}
                  </span>
                  <span className="text-slate-400 font-normal">—</span>
                  <span>
                    {endDateDisplay} {endTimeDisplay}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  {plan.planType === "UNPLANNED" ? "ผู้บันทึกกิจกรรม" : "ผู้จัดทำแผน"}
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {plan.employee?.name || "-"}
                </p>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  {plan.planType === "UNPLANNED"
                    ? `ประเภทงานที่ระบุในกิจกรรม (${resolvedWorkTypes.length} ประเภท):`
                    : `ประเภทงานที่ระบุในแผน (${resolvedWorkTypes.length} ประเภท):`}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {resolvedWorkTypes.map((wt, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs px-2.5 py-1 font-semibold rounded-lg border shadow-2xs bg-indigo-50 text-indigo-800 border-indigo-200"
                    >
                      {wt.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Budgets & Materials */}
          <BudgetSection summary={planSummary} />
          <PromotionalMaterialsSection summary={planSummary} />
          <MarketingExpenseSection summary={planSummary} />

          {/* Notes */}
          {plan.notes && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                หมายเหตุเพิ่มเติม:
              </span>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100">
                {plan.notes}
              </p>
            </div>
          )}

          {/* Location */}
          {plan.location && plan.location !== "-" && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  สถานที่จัดงาน : {plan.location || "-"}
                </span>
              </div>
            </div>
          )}

          {/* Helpers Section with Review Actions */}
          {plan.helpers && plan.helpers.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      พนักงานช่วยงาน ({plan.helpers.length} คน)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      รายชื่อเพื่อนร่วมงานที่ขอตัวไปช่วยปฏิบัติงาน
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-purple-50 text-purple-800 border-purple-200"
                >
                  {plan.helpers.length} คน
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.helpers.map((h, idx) => {
                  const canReviewHelper =
                    (canManageOrApprove || (h.employee as any)?.managerEmployeeId === userEmployeeId) &&
                    h.status === "PENDING";

                  return (
                    <div
                      key={h.id || idx}
                      className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {idx + 1}. {h.employee?.name || "พนักงาน"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {h.employee?.positionTitle || "-"}{" "}
                            • {h.departmentName || h.employee?.departmentName || "ไม่ระบุแผนก"}
                          </div>
                          {h.rejectionReason && (
                            <div className="text-[10px] text-red-600 mt-1 italic">
                              เหตุผลปฏิเสธ: {h.rejectionReason}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 shrink-0 rounded-full",
                            h.status === "APPROVED" && "border-emerald-200 text-emerald-700 bg-emerald-50",
                            h.status === "REJECTED" && "border-red-200 text-red-700 bg-red-50",
                            h.status === "PENDING" && "border-amber-200 text-amber-700 bg-amber-50",
                          )}
                        >
                          {h.status === "APPROVED" ? "อนุมัติแล้ว" : h.status === "REJECTED" ? "ปฏิเสธ" : "รออนุมัติ"}
                        </Badge>
                      </div>

                      {canReviewHelper && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessingHelper}
                            onClick={() => {
                              setReviewingHelperId(h.employeeId);
                              setRejectHelperDialogOpen(true);
                            }}
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2.5 rounded-lg"
                          >
                            ไม่อนุมัติ
                          </Button>
                          <Button
                            size="sm"
                            disabled={isProcessingHelper}
                            onClick={() => handleApproveHelper(h.employeeId)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 rounded-lg"
                          >
                            อนุมัติคนช่วย
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── 3. WORK TYPE SPECIFIC DETAILS ─── */}
        <ApprovalWorkTypeList
          plan={plan}
          targets={targets}
          type1Targets={type1Targets}
          parsedResults={parsedResults}
          isTypeActive={isTypeActive}
        />

        {/* ─── 4. APPROVAL AUDIT LOGS ─── */}
        <ApprovalAuditLogs logs={plan.approvalLogs || []} />

        {/* ─── 5. BOTTOM ACTIONS & APPROVAL ACTION BAR ─── */}
        <DetailViewActions onBack={handleBack} backLabel="กลับหน้ารายการอนุมัติ">
          {canPerformApproval && plan.status === "PENDING_CANCELLATION" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog("REJECT_CANCEL")}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-10 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                ปฏิเสธคำขอยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenActionDialog("APPROVE_CANCEL")}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs rounded-xl h-10 px-6 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                อนุมัติการยกเลิก
              </Button>
            </>
          )}

          {canPerformApproval && plan.status !== "PENDING_CANCELLATION" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog("REJECT")}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-10 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                ปฏิเสธ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog("REQUEST_CORRECTION")}
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl h-10 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                ส่งกลับแก้ไข
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenActionDialog("APPROVE")}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs rounded-xl h-10 px-6 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                {plan.status === "PENDING_MARKETING_APPROVAL"
                  ? "อนุมัติการเบิกสินค้า"
                  : "อนุมัติแผนงาน"}
              </Button>
            </>
          )}
        </DetailViewActions>
      </div>

      {/* Helper Reject Dialog */}
      <HelperReviewDialog
        open={rejectHelperDialogOpen}
        onOpenChange={setRejectHelperDialogOpen}
        reason={helperRejectReason}
        onReasonChange={setHelperRejectReason}
        onSubmit={handleRejectHelper}
        isProcessing={isProcessingHelper}
      />

      {/* Approval Confirmation Dialog */}
      <ApprovalActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        plan={plan}
        actionType={actionType}
        onSuccess={() => {
          router.push("/activity-plans/approvals");
        }}
      />
    </section>
  );
}
