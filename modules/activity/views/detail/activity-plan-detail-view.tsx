"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Layers,
  Info,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import {
  ActivityStatusBadge,
  resolveCurrentOperator,
} from "@/modules/activity-plans/ui/activity-status-badge";
import {
  BudgetSection,
  PromotionalMaterialsSection,
  MarketingExpenseSection,
} from "../actual/components";
import {
  DetailViewActions,
  DetailActivityResultSection,
  DetailActivityStatusSection,
  DetailWorkTypeList,
  DetailAuditLogs,
  CancelPlanDialog,
} from "./components";
import { useDetailPlanLoader } from "./hooks";

interface ActivityPlanDetailViewProps {
  id: string;
  onBack?: () => void;
}

export default function ActivityPlanDetailView({
  id,
  onBack,
}: ActivityPlanDetailViewProps) {
  const router = useRouter();

  const {
    plan,
    loading,
    error,
    planSummary,
    targets,
    type1Targets,
    parsedResults,
    t7DemoPlotData,
    t7VisitHistory,
    mergedLogs,
    isTypeActive,
    canRequestCancel,
    cancelDialogOpen,
    setCancelDialogOpen,
    cancelReason,
    setCancelReason,
    cancelLoading,
    cancelError,
    handleCancelSubmit,
  } = useDetailPlanLoader({ id });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans");
    }
  };

  const resolvedWorkTypes = useMemo(() => {
    if (!plan) return [];
    const list: Array<{ code: string; name: string }> = [];
    (plan.stores || []).forEach((s: any) => {
      if (s.workTypeCode && !list.some((i) => i.code === s.workTypeCode)) {
        list.push({ code: s.workTypeCode, name: s.workType?.name || s.workTypeCode });
      }
    });
    if (
      (plan as any).type1Stores?.length > 0 &&
      !list.some((i) => i.code === "TYPE_1")
    ) {
      list.unshift({ code: "TYPE_1", name: "เข้าพบร้านค้า / Key Farmer" });
    }
    return list;
  }, [plan]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลแผนงาน...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto p-4 max-w-2xl space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูลแผนงานที่ต้องการแสดง"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack} className="text-xs">
          กลับหน้ารายการแผนงาน
        </Button>
      </div>
    );
  }

  const startDateDisplay = plan.startDate
    ? format(new Date(plan.startDate), "dd/MM/yyyy", { locale: th })
    : "-";
  const endDateDisplay = plan.endDate
    ? format(new Date(plan.endDate), "dd/MM/yyyy", { locale: th })
    : "-";
  const startTimeDisplay = plan.startDate
    ? format(new Date(plan.startDate), "HH:mm") + " น."
    : "";
  const endTimeDisplay = plan.endDate
    ? format(new Date(plan.endDate), "HH:mm") + " น."
    : "";

  const hasActualResult = Boolean((plan as any).result);
  const operator = resolveCurrentOperator(plan);

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* ─── 1. TOP HEADER (DETAIL VIEW) ─── */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight whitespace-nowrap">
                {plan.planType === "UNPLANNED"
                  ? "รายละเอียดกิจกรรมนอกแผน ( Unplanned Activity Detail )"
                  : "รายละเอียดแผนงาน ( Trip Plan Detail )"}
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
                <span>เลขที่แผน: {plan.code || planSummary.planNo}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/80 text-xs">
                <div className="flex items-center justify-between bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200/60 shadow-2xs">
                  <span className="text-slate-700 font-medium">1. ผู้อนุมัติตามสายงาน:</span>
                  <span
                    className={cn(
                      "font-bold px-2 py-0.5 rounded-md text-[11px]",
                      plan.lineCancellationApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {plan.lineCancellationApproved ? "✓ อนุมัติแล้ว" : "⏳ รออนุมัติ"}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200/60 shadow-2xs">
                  <span className="text-slate-700 font-medium">
                    2. ผู้จัดการตลาด (ตรวจคืนสินค้า):
                  </span>
                  <span
                    className={cn(
                      "font-bold px-2 py-0.5 rounded-md text-[11px]",
                      plan.mktCancellationApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {plan.mktCancellationApproved ? "✓ อนุมัติแล้ว" : "⏳ รออนุมัติ"}
                  </span>
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
                  ผู้จัดทำแผน
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
                  ประเภทงานที่ระบุในแผน ({resolvedWorkTypes.length} ประเภท):
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
        </div>

        {/* ─── 3. WORK TYPE SPECIFIC DETAILS ─── */}
        <DetailWorkTypeList
          plan={plan}
          targets={targets}
          type1Targets={type1Targets}
          parsedResults={parsedResults}
          isTypeActive={isTypeActive}
          t7DemoPlotData={t7DemoPlotData}
          t7VisitHistory={t7VisitHistory}
        />

        {/* ─── 4. ACTUAL RESULTS (IF RECORDED) ─── */}
        {hasActualResult && (
          <>
            <DetailActivityResultSection
              isTypeVisible={(wt) => isTypeActive("", wt)}
              targets={targets}
              parsedResults={parsedResults}
              demoPlotData={t7DemoPlotData}
              visitHistory={t7VisitHistory}
            />

            {parsedResults.activityResultStatus && (
              <DetailActivityStatusSection
                activityResultStatus={parsedResults.activityResultStatus}
                cancelReason={parsedResults.cancelReason}
                postponedDate={parsedResults.postponedDate}
                postponedTime={parsedResults.postponedTime}
                postponedReason={parsedResults.postponedReason}
                postponedNotes={parsedResults.postponedNotes}
              />
            )}
          </>
        )}

        {/* ─── 5. AUDIT LOGS ─── */}
        <DetailAuditLogs logs={mergedLogs} />

        {/* ─── 6. BOTTOM ACTIONS ─── */}
        <DetailViewActions onBack={handleBack} backLabel="กลับหน้ารายการแผนงาน">
          {canRequestCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
              className="px-5 py-2.5 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <AlertCircle className="w-4 h-4" />
              <span>ขอยกเลิกแผนงาน</span>
            </Button>
          )}
        </DetailViewActions>
      </div>

      {/* Cancellation Dialog */}
      <CancelPlanDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planCodeOrTitle={plan.code || planSummary.planNo || plan.title || plan.id}
        cancelReason={cancelReason}
        onReasonChange={setCancelReason}
        onSubmit={handleCancelSubmit}
        loading={cancelLoading}
        error={cancelError}
      />
    </section>
  );
}
