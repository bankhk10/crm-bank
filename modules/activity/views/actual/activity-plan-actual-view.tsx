"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  ActualViewHeader,
  ActualPlanSummary,
  ActivityStatusSection,
} from "./components";

import { useActualPlanLoader, useActualStatusState } from "./hooks";
import {
  Type1ActualForm,
  useType1Actual,
  extractType1PlanTargets,
  type Type1TargetItem,
} from "@/modules/activity/features/type-1";
import { FormActionButtons } from "@/modules/activity/ui";
import { recordActivityResultAction } from "@/modules/activity-plans/server/actions";

interface ActivityPlanActualViewProps {
  id?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ActivityPlanActualView({
  id,
  onCancel,
  onSuccess,
}: ActivityPlanActualViewProps) {
  const router = useRouter();

  // 1. Plan Loading & Shared Master Data
  const {
    loadingPlan,
    plan,
    planSummary,
    planWorkTypes,
    products,
    customers,
    unauthorizedError,
    planStatus,
    isRefreshing,
  } = useActualPlanLoader({ id });

  // 2. Activity Result Status (COMPLETED / POSTPONED / CANCELLED)
  const statusState = useActualStatusState();

  // 3. Type 1 Actual State Hook
  const type1Actual = useType1Actual();
  const [targets, setTargets] = useState<Type1TargetItem[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // 4. Hydrate Type 1 plan targets & existing actual result
  useEffect(() => {
    if (plan && !isHydrated) {
      const extractedTargets = extractType1PlanTargets(plan);
      setTargets(extractedTargets.list);

      // Hydrate actual result if already recorded
      const res = plan.result || plan.actualResult || plan;
      if (res) {
        type1Actual.hydrate(res);
      }
      setIsHydrated(true);
    }
  }, [plan, isHydrated, type1Actual]);

  const handleBack = () => {
    if (onCancel) onCancel();
    else if (id) router.push(`/activity-plans/${id}`);
    else router.push("/activity-plans");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmitting) return;

    setFormError(null);

    const {
      activityResultStatus,
      cancelReason,
      postponedDate,
      postponedTime,
      postponedReason,
      postponedNotes,
    } = statusState;

    // Validation
    if (activityResultStatus === "CANCELLED" && !cancelReason.trim()) {
      setFormError("กรุณาระบุเหตุผลการยกเลิก");
      toast.error("กรุณาระบุเหตุผลการยกเลิก");
      return;
    }

    if (activityResultStatus === "POSTPONED") {
      if (!postponedDate) {
        setFormError("กรุณาระบุวันที่เลื่อนนัดหมาย");
        toast.error("กรุณาระบุวันที่เลื่อนนัดหมาย");
        return;
      }
      if (!postponedReason.trim()) {
        setFormError("กรุณาระบุเหตุผลการเลื่อน");
        toast.error("กรุณาระบุเหตุผลการเลื่อน");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      let payload: any = {
        resultStatus: activityResultStatus,
        cancelReason: activityResultStatus === "CANCELLED" ? cancelReason.trim() : null,
        postponedDate:
          activityResultStatus === "POSTPONED" && postponedDate
            ? new Date(`${postponedDate}T${postponedTime || "08:30"}:00`)
            : null,
        postponedReason:
          activityResultStatus === "POSTPONED" ? postponedReason.trim() : null,
        postponedNotes:
          activityResultStatus === "POSTPONED" ? postponedNotes.trim() : null,
      };

      // If COMPLETED: upload images and collect Type 1 payload
      if (activityResultStatus === "COMPLETED") {
        const newlyUploadedUrls: string[] = [];
        const cleanImages = await type1Actual.uploadImages(id, newlyUploadedUrls);
        const t1Payload = type1Actual.getPayload(cleanImages);

        payload = {
          ...payload,
          discussionResult: t1Payload.discussionResult || null,
          productAdvice: t1Payload.productAdvice || null,
          advisedProducts: t1Payload.products || [],
          salesOpportunity: t1Payload.salesOpportunity || null,
          nextAction: t1Payload.nextAction || null,
          nextMeetingDate: t1Payload.nextMeetingDate
            ? new Date(t1Payload.nextMeetingDate)
            : null,
          farmerHomeAddress: t1Payload.farmerHomeAddress || null,
          plotLatitude: t1Payload.plotLatitude,
          plotLongitude: t1Payload.plotLongitude,
          plotImages: t1Payload.plotImages || [],
          targetActualResults: t1Payload.targetActualResults || [],
        };
      }

      const res = await recordActivityResultAction(id, payload);
      if (res.success) {
        setSubmitSuccess(true);
        toast.success("บันทึกผลการปฏิบัติงานเรียบร้อยแล้ว");
        if (onSuccess) onSuccess();
        else router.push(`/activity-plans/${id}`);
      } else {
        setFormError(res.error || "เกิดข้อผิดพลาดในการบันทึกผล");
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึกผล");
      }
    } catch (err: any) {
      setFormError(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
      toast.error(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permission & Loading Guards
  if (unauthorizedError) {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <ActualViewHeader planNo={planSummary.planNo} />

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                ไม่มีสิทธิ์บันทึกผลการปฏิบัติงาน
              </h3>
              <p className="text-sm text-slate-600">
                เฉพาะผู้สร้างแผนงานนี้เท่านั้นที่สามารถบันทึกผลการปฏิบัติงานได้
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2 font-semibold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารายละเอียดแผนงาน
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loadingPlan || (!isHydrated && id)) {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto text-center">
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500 font-medium">
              กำลังโหลดข้อมูลแผนงาน...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (id && planStatus && planStatus !== "APPROVED" && planStatus !== "COMPLETED") {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <ActualViewHeader planNo={planSummary.planNo} />

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                ไม่สามารถบันทึกผลการปฏิบัติงานได้
              </h3>
              <p className="text-sm text-slate-600">
                สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2 font-semibold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารายละเอียดแผนงาน
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isType1 =
    planWorkTypes.includes("TYPE_1") ||
    planWorkTypes.includes("VISIT") ||
    planWorkTypes.includes("เข้าพบร้านค้า / Key Farmer") ||
    planWorkTypes.length === 0;

  return (
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
        <ActualViewHeader planNo={planSummary.planNo} />
        {isRefreshing && (
          <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>กำลังอัปเดตข้อมูลแผนงานในพื้นหลัง...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-emerald-600 stroke-[3]" />
              <span>บันทึกผลการปฏิบัติงานเรียบร้อยแล้ว!</span>
            </div>
          )}

          {/* 1. สรุปข้อมูลแผนเดิม */}
          <ActualPlanSummary summary={planSummary} />

          {/* 2. สถานะผลการทำกิจกรรม (สำเร็จ / เลื่อน / ยกเลิก) */}
          <ActivityStatusSection
            activityResultStatus={statusState.activityResultStatus}
            setActivityResultStatus={statusState.setActivityResultStatus}
            cancelReason={statusState.cancelReason}
            setCancelReason={statusState.setCancelReason}
            postponedDate={statusState.postponedDate}
            setPostponedDate={statusState.setPostponedDate}
            postponedTime={statusState.postponedTime}
            setPostponedTime={statusState.setPostponedTime}
            postponedReason={statusState.postponedReason}
            setPostponedReason={statusState.setPostponedReason}
            postponedNotes={statusState.postponedNotes}
            setPostponedNotes={statusState.setPostponedNotes}
          />

          {/* 3. ฟอร์มผลการปฏิบัติงานเฉพาะ Type 1 */}
          {statusState.activityResultStatus === "COMPLETED" && isType1 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <Type1ActualForm
                isVisible={true}
                targets={targets}
                target={targets[0]}
                targetActualResults={type1Actual.t1TargetItems}
                onUpdateTargetActualResults={type1Actual.syncFromTargetItems}
                productAdvice={type1Actual.t1ProductAdvice}
                setProductAdvice={type1Actual.setT1ProductAdvice}
                advisedProducts={type1Actual.t1AdvisedProducts}
                setAdvisedProducts={type1Actual.setT1AdvisedProducts}
                detail={type1Actual.t1Detail}
                setDetail={type1Actual.setT1Detail}
                discussionResult={type1Actual.t1DiscussionResult}
                setDiscussionResult={type1Actual.setT1DiscussionResult}
                salesOpportunity={type1Actual.t1SalesOpportunity}
                setSalesOpportunity={type1Actual.setT1SalesOpportunity}
                nextAction={type1Actual.t1NextAction}
                setNextAction={type1Actual.setT1NextAction}
                nextMeetingDate={type1Actual.t1NextMeetingDate}
                setNextMeetingDate={type1Actual.setT1NextMeetingDate}
                farmerHomeAddress={type1Actual.t1FarmerHomeAddress}
                setFarmerHomeAddress={type1Actual.setT1FarmerHomeAddress}
                plotLatitude={type1Actual.t1PlotLatitude}
                setPlotLatitude={type1Actual.setT1PlotLatitude}
                plotLongitude={type1Actual.t1PlotLongitude}
                setPlotLongitude={type1Actual.setT1PlotLongitude}
                plotImages={type1Actual.t1PlotImages}
                setPlotImages={type1Actual.setT1PlotImages}
              />
            </div>
          )}

          {/* ปุ่มบันทึก */}
          <FormActionButtons
            onBack={handleBack}
            loading={isSubmitting}
            submitLabel="บันทึกผลการปฏิบัติงาน"
          />
        </form>
      </div>
    </section>
  );
}

export default ActivityPlanActualView;
