"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  ActualViewHeader,
  ActualPlanSummary,
  ActivityResultSection,
  ActivityStatusSection,
  ActualViewActions,
} from "./components";

import {
  useActualPlanLoader,
  useActualStatusState,
  useActualSubmit,
} from "./hooks";

import { useType1Actual } from "@/modules/activity-plans/features/type-1";
import { useType2Actual } from "@/modules/activity-plans/features/type-2";
import { useType3Actual } from "@/modules/activity-plans/features/type-3";
import { useType4Actual } from "@/modules/activity-plans/features/type-4";
import { useType5Actual } from "@/modules/activity-plans/features/type-5";
import { useType6Actual } from "@/modules/activity-plans/features/type-6";
import { useType7aActual } from "@/modules/activity-plans/features/type-7a";
import { useType7bActual } from "@/modules/activity-plans/features/type-7b";
import { useType8Actual } from "@/modules/activity-plans/features/type-8";
import { useType9Actual } from "@/modules/activity-plans/features/type-9";
import { useType10Actual } from "@/modules/activity-plans/features/type-10";
import { useType11Actual } from "@/modules/activity-plans/features/type-11";

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
  const planLoader = useActualPlanLoader({ id });
  const {
    loadingPlan,
    isRefreshing,
    plan,
    planStatus,
    unauthorizedError,
    planSummary,
    planWorkTypes,
    targets,
    parsedResult,
    products,
    customers,
    isTypeVisible,
  } = planLoader;

  // 2. Footer Status State
  const statusState = useActualStatusState();

  // 3. TYPE Hooks
  const type1 = useType1Actual();
  const type2 = useType2Actual();
  const type3 = useType3Actual();
  const type4 = useType4Actual();
  const type5 = useType5Actual();
  const type6 = useType6Actual();
  const type7a = useType7aActual();
  const type7b = useType7bActual();
  const type8 = useType8Actual();
  const type9 = useType9Actual();
  const type10 = useType10Actual();
  const type11 = useType11Actual();

  const typeHooks = useMemo(
    () => ({
      type1,
      type2,
      type3,
      type4,
      type5,
      type6,
      type7a,
      type7b,
      type8,
      type9,
      type10,
      type11,
    }),
    [
      type1,
      type2,
      type3,
      type4,
      type5,
      type6,
      type7a,
      type7b,
      type8,
      type9,
      type10,
      type11,
    ],
  );

  // 4. Hydration Orchestration
  useEffect(() => {
    if (!plan) return;
    statusState.hydrateStatus(parsedResult);
    type1.hydrate(parsedResult);
    type2.hydrate(parsedResult);
    type3.hydrate(parsedResult);
    type4.hydrate(parsedResult);
    type5.hydrate(parsedResult, targets);
    type6.hydrate(parsedResult);
    type7a.hydrate(plan, parsedResult, targets);
    type7b.hydrate(plan, parsedResult, targets);
    type8.hydrate(parsedResult);
    type9.hydrate(parsedResult);
    type10.hydrate(parsedResult);
    type11.hydrate(parsedResult);
  }, [plan, parsedResult]);

  // 5. Submit Handler
  const submitHandler = useActualSubmit({
    id,
    planStatus,
    onSuccess,
    onCancel,
    isTypeVisible,
    planSummary,
    planWorkTypes,
    targets,
    products,
    customers,
    statusState,
    typeHooks,
  });

  const { isSubmitting, formError, submitSuccess, handleSubmit } =
    submitHandler;

  const handleBack = () => {
    if (onCancel) onCancel();
    else if (id) router.push(`/activity-plans/${id}`);
    else router.push("/activity-plans");
  };

  // Permission & Loading Guards
  if (loadingPlan) {
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

  if (!loadingPlan && unauthorizedError) {
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
                onClick={() => {
                  if (onCancel) onCancel();
                  else
                    router.push(
                      id ? `/activity-plans/${id}` : "/activity-plans",
                    );
                }}
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

  if (!loadingPlan && id && planStatus && planStatus !== "APPROVED") {
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
                onClick={() => {
                  if (onCancel) onCancel();
                  else router.push(`/activity-plans/${id}`);
                }}
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

  return (
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* TOP HEADER */}
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

          {/* PLAN SUMMARY COMPONENT */}
          <ActualPlanSummary summary={planSummary} />

          {/* SECTION: ผลการปฏิบัติงานตามประเภทงาน (WORK TYPES 1 - 11) */}
          <ActivityResultSection
            isTypeVisible={isTypeVisible}
            targets={targets}
            products={products}
            customers={customers}
            typeHooks={typeHooks}
            planProvince={
              (type7a.t7DemoPlotData as any)?.province ||
              targets.t7a?.province ||
              planSummary?.province ||
              ""
            }
          />

          {/* SECTION: สถานะผลการทำกิจกรรม */}
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

          {/* BOTTOM ACTIONS */}
          <ActualViewActions
            onBack={handleBack}
            loading={isSubmitting}
            submitLabel="บันทึกผล"
          />
        </form>
      </div>
    </section>
  );
}

export default ActivityPlanActualView;

