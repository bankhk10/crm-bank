"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DetailHeader,
  DetailOverview,
  DetailWorkTypeList,
  DetailActivityStatusSection,
  DetailAuditLogs,
  DetailViewActions,
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
  const {
    plan,
    loading,
    error,
    planSummary,
    resolvedWorkTypes,
    targets,
    type1Targets,
    parsedResults,
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
    handleBack,
  } = useDetailPlanLoader({ id, onBack });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">
          กำลังโหลดข้อมูลแผนงาน...
        </p>
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

  const hasActualResult = Boolean((plan as any).result);

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* ─── 1. TOP HEADER (DETAIL VIEW) ─── */}
        <DetailHeader plan={plan} planSummary={planSummary} />

        {/* ─── 2. GENERAL PLAN INFORMATION (Overview) ─── */}
        <DetailOverview
          plan={plan}
          planSummary={planSummary}
          resolvedWorkTypes={resolvedWorkTypes}
        />

        {/* ─── 3. WORK TYPE SPECIFIC DETAILS ─── */}
        <DetailWorkTypeList
          plan={plan}
          targets={targets}
          type1Targets={type1Targets}
          parsedResults={parsedResults}
          isTypeActive={isTypeActive}
        />

        {/* ─── 4. ACTUAL RESULTS STATUS (IF RECORDED) ─── */}
        {hasActualResult && parsedResults.activityResultStatus && (
          <DetailActivityStatusSection
            activityResultStatus={parsedResults.activityResultStatus}
            cancelReason={parsedResults.cancelReason}
            postponedDate={parsedResults.postponedDate}
            postponedTime={parsedResults.postponedTime}
            postponedReason={parsedResults.postponedReason}
            postponedNotes={parsedResults.postponedNotes}
          />
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
        planCodeOrTitle={
          plan.code || planSummary.planNo || plan.title || plan.id
        }
        cancelReason={cancelReason}
        onReasonChange={setCancelReason}
        onSubmit={handleCancelSubmit}
        loading={cancelLoading}
        error={cancelError}
      />
      <div className="h-12 md:hidden" />
    </section>
  );
}
