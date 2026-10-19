"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  Check,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  ActualViewHeader,
  ActualPlanSummary,
  ActivityStatusSection,
  ActualWorkTypeList,
} from "./components";

import { useActualPlanLoader, useActualStatusState } from "./hooks";
import {
  useType1Actual,
  extractType1PlanTargets,
  type Type1TargetItem,
} from "@/modules/activity/features/type-1";
import {
  useType2Actual,
  validateType2Actual,
} from "@/modules/activity/features/type-2";
import { FormActionButtons } from "@/modules/activity/ui";
import { recordActivityResultAction } from "@/modules/activity/server/actions";

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

  // 3. Type 1 & Type 2 Actual State Hooks
  const type1Actual = useType1Actual();
  const type2Actual = useType2Actual();
  const [targets, setTargets] = useState<Type1TargetItem[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Validation Alert Popup Modal state
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    messages: string[];
  }>({
    isOpen: false,
    title: "",
    messages: [],
  });

  // 4. Hydrate Type 1 & Type 2 plan targets & existing actual result
  useEffect(() => {
    if (plan && !isHydrated) {
      const extractedTargets = extractType1PlanTargets(plan);
      setTargets(extractedTargets.list);

      // Hydrate actual result if already recorded
      const res = plan.result || plan.actualResult || plan;
      if (res) {
        type1Actual.hydrate(res);
        type2Actual.hydrate(res);
        statusState.hydrateStatus(res);
      }
      setIsHydrated(true);
    }
  }, [plan, isHydrated, type1Actual, type2Actual, statusState]);

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

    const isType1Active =
      planWorkTypes.includes("TYPE_1") ||
      planWorkTypes.includes("VISIT") ||
      planWorkTypes.includes("เข้าพบร้านค้า / Key Farmer") ||
      Boolean(plan?.type1Stores?.length) ||
      Boolean(
        plan?.stores?.some(
          (s: any) =>
            s.workTypeCode === "TYPE_1" || s.workTypeCode === "VISIT",
        ),
      ) ||
      plan?.activityType?.code === "TYPE_1";

    const isType2Active =
      planWorkTypes.includes("TYPE_2") ||
      planWorkTypes.includes("ติดตามผลการใช้สินค้า") ||
      planWorkTypes.includes("ติดตามผล") ||
      Boolean(plan?.type2Targets?.length);

    // 1. Validation for CANCELLED
    if (activityResultStatus === "CANCELLED" && !cancelReason.trim()) {
      setValidationAlert({
        isOpen: true,
        title: "กรุณาระบุเหตุผลการยกเลิก",
        description:
          "จำเป็นต้องระบุเหตุผลเพื่อเป็นบันทึกประกอบการยกเลิกแผนงานกิจกรรม",
        messages: ["เหตุผลการยกเลิกกิจกรรม"],
      });
      setFormError("กรุณาระบุเหตุผลการยกเลิก");
      toast.error("กรุณาระบุเหตุผลการยกเลิก");
      return;
    }

    // 2. Validation for POSTPONED
    if (activityResultStatus === "POSTPONED") {
      const missing: string[] = [];
      if (!postponedDate) missing.push("วันที่เลื่อนนัดหมาย");
      if (!postponedReason.trim()) missing.push("เหตุผลการเลื่อนกิจกรรม");
      if (missing.length > 0) {
        setValidationAlert({
          isOpen: true,
          title: "ข้อมูลการเลื่อนกิจกรรมไม่ครบถ้วน",
          description:
            "กรุณาระบุข้อมูลวันที่และเหตุผลสำหรับการเลื่อนกิจกรรมให้ครบถ้วน",
          messages: missing,
        });
        setFormError(`กรุณาระบุ${missing[0]}`);
        toast.error(`กรุณาระบุ${missing[0]}`);
        return;
      }
    }

    // 3. Validation for COMPLETED or PARTIAL
    if (
      activityResultStatus === "COMPLETED" ||
      activityResultStatus === "PARTIAL"
    ) {
      let missingFields: string[] = [];

      // Delegate Type 1 validation to features/type-1 domain logic
      if (isType1Active) {
        const type1Validation = type1Actual.validate(targets);
        if (!type1Validation.isValid) {
          missingFields = [...missingFields, ...type1Validation.errors];
        }
      }

      // Delegate Type 2 validation to features/type-2 domain logic
      if (isType2Active) {
        const type2Validation = validateType2Actual({
          followupResults: type2Actual.t2FollowupResults,
          status: activityResultStatus,
        });
        if (!type2Validation.isValid && type2Validation.error) {
          missingFields.push(type2Validation.error);
        }
      }

      if (missingFields.length > 0) {
        setValidationAlert({
          isOpen: true,
          title: "กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก",
          description:
            "ระบบพบข้อมูลจำเป็นที่ยังไม่ได้ระบุ กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจันสีแดง (*):",
          messages: missingFields,
        });
        setFormError(`กรุณากรอก ${missingFields[0]}`);
        toast.error(`กรุณากรอก ${missingFields[0]}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const parseDateSafe = (val: any): Date | null => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      const planStart = parseDateSafe(plan?.startDate) || new Date();
      const planEnd = parseDateSafe(plan?.endDate) || planStart;

      let payload: any = {
        actualStartDate: planStart,
        actualEndDate: planEnd,
        resultStatus: activityResultStatus,
        resultSummary: `บันทึกผลการปฏิบัติงาน (${activityResultStatus})`,
        cancelReason:
          activityResultStatus === "CANCELLED" ? cancelReason.trim() : null,
        postponedDate:
          activityResultStatus === "POSTPONED" && postponedDate
            ? parseDateSafe(`${postponedDate}T${postponedTime || "08:30"}:00`)
            : null,
        postponedReason:
          activityResultStatus === "POSTPONED" ? postponedReason.trim() : null,
        postponedNotes:
          activityResultStatus === "POSTPONED" ? postponedNotes.trim() : null,
      };

      // If COMPLETED or PARTIAL: upload images and collect payloads per work type
      if (
        activityResultStatus === "COMPLETED" ||
        activityResultStatus === "PARTIAL"
      ) {
        // Collect Type 1 payload ONLY if Type 1 is active
        if (isType1Active) {
          const newlyUploadedUrls: string[] = [];
          const cleanImages = await type1Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t1Payload = type1Actual.getPayload(cleanImages);
          const validNextDate = parseDateSafe(t1Payload.nextMeetingDate);
          const sanitizedTargets = (t1Payload.targetActualResults || []).map(
            (t: any) => ({
              ...t,
              nextMeetingDate: parseDateSafe(t.nextMeetingDate)
                ? t.nextMeetingDate
                : null,
            }),
          );

          payload = {
            ...payload,
            resultSummary:
              t1Payload.discussionResult ||
              `บันทึกผลการปฏิบัติงาน (${activityResultStatus})`,
            discussionResult: t1Payload.discussionResult || null,
            productAdvice: t1Payload.productAdvice || null,
            advisedProducts: t1Payload.products || [],
            salesOpportunity: t1Payload.salesOpportunity || null,
            nextAction: t1Payload.nextAction || null,
            nextMeetingDate: validNextDate,
            farmerHomeAddress: t1Payload.farmerHomeAddress || null,
            plotLatitude: t1Payload.plotLatitude,
            plotLongitude: t1Payload.plotLongitude,
            plotImages: t1Payload.plotImages || [],
            targetActualResults: sanitizedTargets,
          };
        }

        // Collect Type 2 payload if active
        if (isType2Active) {
          const t2Payload = type2Actual.collectPayload();
          payload = {
            ...payload,
            ...t2Payload,
            followupResults: t2Payload.t2FollowupResults || [],
          };
          if (!isType1Active && t2Payload.t2FollowupDetail) {
            payload.resultSummary = t2Payload.t2FollowupDetail;
          }
        }
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

  if (
    id &&
    planStatus &&
    planStatus !== "APPROVED" &&
    planStatus !== "COMPLETED"
  ) {
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

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
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

          {/* 2. ฟอร์มผลการปฏิบัติงานตามประเภทงาน (Work Types 1 - 14) */}
          {(statusState.activityResultStatus === "COMPLETED" ||
            statusState.activityResultStatus === "PARTIAL") && (
            <ActualWorkTypeList
              planWorkTypes={planWorkTypes}
              type1State={type1Actual}
              type2State={type2Actual}
              targets={targets}
              plan={plan}
              products={products}
            />
          )}

          {/* 3. สถานะผลการทำกิจกรรม (สำเร็จ / เลื่อน / ยกเลิก) */}
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

          {/* ปุ่มบันทึก */}
          <FormActionButtons
            onBack={handleBack}
            loading={isSubmitting}
            submitLabel="บันทึกผลการปฏิบัติงาน"
          />
        </form>
      </div>

      {/* Popup Modal แจ้งเตือนเมื่อข้อมูลไม่ครบถ้วน */}
      <AlertDialog
        open={validationAlert.isOpen}
        onOpenChange={(open) =>
          setValidationAlert((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-xl border border-slate-200">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <AlertDialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                {validationAlert.title}
              </AlertDialogTitle>
              {validationAlert.description && (
                <AlertDialogDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                  {validationAlert.description}
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>

          <div className="py-2">
            <ul className="space-y-2 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-amber-900 font-medium">
              {validationAlert.messages.map((msg, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>

          <AlertDialogFooter className="pt-2">
            <AlertDialogAction
              onClick={() =>
                setValidationAlert((prev) => ({ ...prev, isOpen: false }))
              }
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 h-10 cursor-pointer shadow-xs transition-colors"
            >
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ActivityPlanActualView;
