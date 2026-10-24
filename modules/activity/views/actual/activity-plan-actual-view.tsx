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
  extractType2PlanTargets,
  type Type2TargetItem,
} from "@/modules/activity/features/type-2";
import {
  useType3Actual,
  validateType3Actual,
  extractType3PlanTargets,
  type Type3TargetItem,
} from "@/modules/activity/features/type-3";
import {
  useType4Actual,
  extractType4PlanTargets,
  type Type4TargetItem,
} from "@/modules/activity/features/type-4";
import {
  useType5Actual,
  validateType5Actual,
  extractType5PlanTargets,
  parseType5ActualResult,
  type Type5TargetItem,
} from "@/modules/activity/features/type-5";
import {
  useType6Actual,
  validateType6Actual,
  extractType6PlanTargets,
  parseType6ActualResult,
  type Type6TargetItem,
} from "@/modules/activity/features/type-6";
import {
  useType7aActual,
  validateType7aActual,
  extractType7aPlanTargets,
  type Type7aTargetItem,
} from "@/modules/activity/features/type-7a";
import {
  useType7bActual,
  validateType7bActual,
  extractType7bPlanTargets,
  parseType7bActualResult,
  type Type7bTargetItem,
} from "@/modules/activity/features/type-7b";
import {
  useType8Actual,
  validateType8Actual,
  extractType8PlanTargets,
  type Type8TargetItem,
} from "@/modules/activity/features/type-8";
import {
  useType9Actual,
  validateType9Actual,
  extractType9PlanTargets,
  type Type9TargetItem,
} from "@/modules/activity/features/type-9";
import {
  useType10Actual,
  validateType10Actual,
  extractType10PlanTargets,
  type Type10TargetItem,
} from "@/modules/activity/features/type-10";
import {
  useType11Actual,
  validateType11Actual,
  extractType11PlanTargets,
  type Type11TargetItem,
} from "@/modules/activity/features/type-11";
import {
  useType12Actual,
  validateType12Actual,
  extractType12PlanTargets,
  type Type12TargetItem,
} from "@/modules/activity/features/type-12";
import {
  useType13Actual,
  validateType13Actual,
  extractType13PlanTargets,
  type Type13TargetItem,
} from "@/modules/activity/features/type-13";
import {
  useType14Actual,
  validateType14Actual,
  extractType14PlanTargets,
  type Type14TargetItem,
} from "@/modules/activity/features/type-14";
import { FormActionButtons } from "@/modules/activity/ui";
import { recordActivityResultAction } from "@/modules/activity/server/actions";
import {
  uploadActivityPlanImageGroup,
  deleteActivityPlanImagePaths,
} from "@/modules/activity/application/media/image-uploader";

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

  // 3. Type 1, Type 2, Type 3 & Type 4 Actual State Hooks
  const type1Actual = useType1Actual();
  const type2Actual = useType2Actual();
  const type3Actual = useType3Actual();
  const type4Actual = useType4Actual();
  const type5Actual = useType5Actual();
  const type6Actual = useType6Actual();
  const type7aActual = useType7aActual();
  const type7bActual = useType7bActual();
  const type8Actual = useType8Actual();
  const type9Actual = useType9Actual();
  const type10Actual = useType10Actual();
  const type11Actual = useType11Actual();
  const type12Actual = useType12Actual();
  const type13Actual = useType13Actual();
  const type14Actual = useType14Actual();
  const [targets, setTargets] = useState<Type1TargetItem[]>([]);
  const [type2Targets, setType2Targets] = useState<Type2TargetItem[]>([]);
  const [type3Targets, setType3Targets] = useState<Type3TargetItem[]>([]);
  const [type4Targets, setType4Targets] = useState<Type4TargetItem[]>([]);
  const [type5Targets, setType5Targets] = useState<Type5TargetItem[]>([]);
  const [type6Targets, setType6Targets] = useState<Type6TargetItem[]>([]);
  const [type7aTargets, setType7aTargets] = useState<Type7aTargetItem[]>([]);
  const [type7bTargets, setType7bTargets] = useState<Type7bTargetItem[]>([]);
  const [type8Targets, setType8Targets] = useState<Type8TargetItem[]>([]);
  const [type9Targets, setType9Targets] = useState<Type9TargetItem[]>([]);
  const [type10Targets, setType10Targets] = useState<Type10TargetItem[]>([]);
  const [type11Targets, setType11Targets] = useState<Type11TargetItem[]>([]);
  const [type12Targets, setType12Targets] = useState<Type12TargetItem[]>([]);
  const [type13Targets, setType13Targets] = useState<Type13TargetItem[]>([]);
  const [type14Targets, setType14Targets] = useState<Type14TargetItem[]>([]);
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

  // 4. Hydrate Type 1 - Type 7A plan targets & existing actual result
  useEffect(() => {
    if (plan && !isHydrated) {
      const extractedTargets = extractType1PlanTargets(plan);
      setTargets(extractedTargets.list);

      const extractedT2 = extractType2PlanTargets(plan);
      setType2Targets(extractedT2.list);

      const extractedT3 = extractType3PlanTargets(plan);
      setType3Targets(extractedT3.list);

      const extractedT4 = extractType4PlanTargets(plan);
      setType4Targets(extractedT4.list);

      const extractedT5 = extractType5PlanTargets(plan);
      setType5Targets(extractedT5.list);

      const extractedT6 = extractType6PlanTargets(plan);
      setType6Targets(extractedT6.list);

      const extractedT7a = extractType7aPlanTargets(plan);
      setType7aTargets(extractedT7a.list);

      const extractedT7b = extractType7bPlanTargets(plan);
      setType7bTargets(extractedT7b.list);

      const extractedT8 = extractType8PlanTargets(plan);
      setType8Targets(extractedT8.list);

      const extractedT9 = extractType9PlanTargets(plan);
      setType9Targets(extractedT9.list);

      const extractedT10 = extractType10PlanTargets(plan);
      setType10Targets(extractedT10.list);

      const extractedT11 = extractType11PlanTargets(plan);
      setType11Targets(extractedT11.list);

      const extractedT12 = extractType12PlanTargets(plan);
      setType12Targets(extractedT12.list);

      const extractedT13 = extractType13PlanTargets(plan);
      setType13Targets(extractedT13.list);

      const extractedT14 = extractType14PlanTargets(plan);
      setType14Targets(extractedT14.list);

      // Hydrate actual result if already recorded
      const res = plan.result || plan.actualResult || plan;
      if (res) {
        const payloadToHydrate = {
          ...res,
          type4Results: plan.type4Results || (res as any)?.type4Results,
          type4Result: plan.type4Result || (res as any)?.type4Result,
          activityPlan: plan,
          attachments:
            res.attachments && res.attachments.length > 0
              ? res.attachments
              : plan.attachments || [],
        };
        type1Actual.hydrate(payloadToHydrate);
        type2Actual.hydrate(payloadToHydrate);
        type3Actual.hydrate(payloadToHydrate);
        type4Actual.hydrate(payloadToHydrate);
        const parsedT5 = parseType5ActualResult(payloadToHydrate);
        type5Actual.hydrate(parsedT5, { t5: extractedT5.primary });
        const parsedT6 = parseType6ActualResult(payloadToHydrate);
        type6Actual.hydrate(parsedT6);
        type7aActual.hydrate(plan, payloadToHydrate, {
          t7a: extractedT7a.primary,
        });
        const parsedT7b = parseType7bActualResult(
          res.resultSummary || "",
          payloadToHydrate,
        );
        if (Object.keys(parsedT7b).length > 0) {
          type7bActual.hydrate(parsedT7b);
        }
        type8Actual.hydrate(payloadToHydrate, payloadToHydrate.attachments);
        type9Actual.hydrate(payloadToHydrate);
        type10Actual.hydrate(payloadToHydrate);
        type11Actual.hydrate(payloadToHydrate);
        type12Actual.hydrate(payloadToHydrate, payloadToHydrate.attachments);
        type13Actual.hydrate(payloadToHydrate, payloadToHydrate.attachments);
        type14Actual.hydrate(payloadToHydrate, payloadToHydrate.attachments);
        statusState.hydrateStatus(res);
      }
      setIsHydrated(true);
    }
  }, [
    plan,
    isHydrated,
    type1Actual,
    type2Actual,
    type3Actual,
    type4Actual,
    type5Actual,
    type6Actual,
    type7aActual,
    type7bActual,
    type8Actual,
    type9Actual,
    type10Actual,
    type11Actual,
    type12Actual,
    type13Actual,
    type14Actual,
    statusState,
  ]);

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
          (s: any) => s.workTypeCode === "TYPE_1" || s.workTypeCode === "VISIT",
        ),
      ) ||
      plan?.activityType?.code === "TYPE_1";

    const isType2Active =
      planWorkTypes.includes("TYPE_2") ||
      planWorkTypes.includes("ติดตามผลการใช้สินค้า") ||
      planWorkTypes.includes("ติดตามผล") ||
      Boolean(plan?.type2Targets?.length);

    const isType3Active =
      planWorkTypes.includes("TYPE_3") ||
      planWorkTypes.includes("เสนอขายสินค้า") ||
      planWorkTypes.includes("เสนอขาย") ||
      Boolean(plan?.type3Targets?.length);

    const isType4Active =
      planWorkTypes.includes("TYPE_4") ||
      planWorkTypes.includes("วางบิล / เก็บเงิน") ||
      planWorkTypes.includes("วางบิล") ||
      planWorkTypes.includes("เก็บเงิน") ||
      Boolean(plan?.type4Targets?.length);

    const isType5Active =
      planWorkTypes.includes("TYPE_5") ||
      planWorkTypes.includes("สำรวจตลาดของคู่แข่ง") ||
      planWorkTypes.includes("สำรวจตลาด") ||
      Boolean(plan?.type5Targets?.length);

    const isType6Active =
      planWorkTypes.includes("TYPE_6") ||
      planWorkTypes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา") ||
      planWorkTypes.includes("ร้องเรียน") ||
      planWorkTypes.includes("แก้ปัญหา") ||
      Boolean(plan?.type6Targets?.length);

    const isType7aActive =
      planWorkTypes.includes("TYPE_7A") ||
      planWorkTypes.includes("จัดทำแปลงสาธิต") ||
      (planWorkTypes.includes("แปลงสาธิต") &&
        !planWorkTypes.includes("ติดตามแปลงสาธิต")) ||
      Boolean(plan?.type7aPlots?.length) ||
      Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_7A")) ||
      plan?.activityType?.code === "TYPE_7A";

    const isType7bActive =
      planWorkTypes.includes("TYPE_7B") ||
      planWorkTypes.includes("ติดตามแปลงสาธิต") ||
      Boolean(plan?.type7bFollowUps?.length) ||
      Boolean(plan?.type7bPlots?.length) ||
      Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_7B")) ||
      plan?.activityType?.code === "TYPE_7B";

    const isType8Active =
      planWorkTypes.includes("TYPE_8") ||
      planWorkTypes.includes("จัดประชุม") ||
      planWorkTypes.includes("ประชุม") ||
      Boolean(plan?.type8Targets?.length) ||
      Boolean(plan?.type8Items?.length) ||
      Boolean(plan?.type8Meetings?.length) ||
      Boolean(plan?.type8Data) ||
      Boolean(plan?.type8) ||
      Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_8")) ||
      plan?.activityType?.code === "TYPE_8";

    const isType9Active =
      planWorkTypes.includes("TYPE_9") ||
      planWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
      planWorkTypes.includes("ส่งเสริมการขายหน้าร้าน") ||
      planWorkTypes.includes("กิจกรรมหน้าร้าน") ||
      Boolean(plan?.type9Targets?.length) ||
      Boolean(plan?.type9Items?.length) ||
      Boolean(plan?.type9Stores?.length) ||
      Boolean(plan?.type9Data) ||
      Boolean(plan?.type9) ||
      Boolean(
        plan?.stores?.some(
          (s: any) =>
            s.workTypeCode === "TYPE_9" ||
            s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
        ),
      ) ||
      plan?.activityType?.code === "TYPE_9";

    const isType10Active =
      planWorkTypes.includes("TYPE_10") ||
      planWorkTypes.includes("จัดงาน Field Day") ||
      planWorkTypes.includes("Field Day") ||
      Boolean(plan?.type10Targets?.length) ||
      Boolean(plan?.type10Plots?.length) ||
      Boolean(plan?.type10Data) ||
      Boolean(plan?.type10) ||
      Boolean(
        plan?.demoPlotVisits?.some(
          (v: any) =>
            v.workTypeCode === "TYPE_10" ||
            v.workTypeCode === "จัดงาน Field Day",
        ),
      ) ||
      plan?.activityType?.code === "TYPE_10";

    const isType11Active =
      planWorkTypes.includes("TYPE_11") ||
      planWorkTypes.includes("ตรวจเช็คสต๊อกหน้าร้าน") ||
      planWorkTypes.includes("ตรวจเช็คสต๊อก") ||
      Boolean(plan?.type11Targets?.length) ||
      Boolean(plan?.type11Stores?.length) ||
      Boolean(plan?.type11Data) ||
      Boolean(plan?.type11) ||
      Boolean(
        plan?.stores?.some(
          (s: any) =>
            s.workTypeCode === "TYPE_11" ||
            s.workTypeCode === "ตรวจเช็คสต๊อกหน้าร้าน",
        ),
      ) ||
      plan?.activityType?.code === "TYPE_11";

    const isType12Active =
      planWorkTypes.includes("TYPE_12") ||
      planWorkTypes.includes("ทัวร์") ||
      planWorkTypes.includes("ทัวร์") ||
      planWorkTypes.includes("ศึกษาดูงาน") ||
      Boolean(plan?.tour) ||
      Boolean(plan?.tourData) ||
      plan?.activityType?.code === "TYPE_12";

    const isType13Active =
      planWorkTypes.includes("TYPE_13") ||
      planWorkTypes.includes("ฉีดแปลงแฮตแทค") ||
      planWorkTypes.includes("ฉีดแปลงแฮตแทค") ||
      planWorkTypes.includes("ฉีดแปลง") ||
      Boolean(plan?.type13Plots?.length) ||
      Boolean(plan?.type13Targets?.length) ||
      Boolean(plan?.t13Plots?.length) ||
      Boolean(plan?.type13Data) ||
      Boolean(plan?.type13) ||
      plan?.activityType?.code === "TYPE_13";

    const isType14Active =
      planWorkTypes.includes("TYPE_14") ||
      planWorkTypes.includes("ติดตามแปลงแฮตแทค") ||
      planWorkTypes.includes("ติดตามแปลงแฮตแทค") ||
      planWorkTypes.includes("ติดตามแปลง") ||
      Boolean(plan?.type14Plots?.length) ||
      Boolean(plan?.type14Targets?.length) ||
      Boolean(plan?.t14Plots?.length) ||
      Boolean(plan?.type14Data) ||
      Boolean(plan?.type14) ||
      plan?.activityType?.code === "TYPE_14";

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

      // Delegate Type 3 validation to features/type-3 domain logic
      if (isType3Active) {
        const type3Validation = validateType3Actual({
          soldProducts: type3Actual.soldProducts,
          actualSales: type3Actual.actualSales,
          actualQuantity: type3Actual.actualQuantity,
          unclosedReason: type3Actual.unclosedReason,
          productSalesDetails: type3Actual.productSalesDetails,
          status: activityResultStatus,
        });
        if (!type3Validation.isValid && type3Validation.error) {
          missingFields.push(type3Validation.error);
        }
      }

      // Delegate Type 4 validation to features/type-4 domain logic
      if (isType4Active) {
        const effectiveCollectType = type4Targets?.[0]?.collectType as any;
        const type4Validation = type4Actual.validate(effectiveCollectType);
        if (!type4Validation.isValid && type4Validation.error) {
          missingFields.push(type4Validation.error);
        }
      }

      // Delegate Type 5 validation to features/type-5 domain logic
      if (isType5Active) {
        const type5Validation = validateType5Actual(
          type5Actual.t5SurveyDetails,
        );
        if (!type5Validation.isValid && type5Validation.error) {
          missingFields.push(type5Validation.error);
        }
      }

      // Delegate Type 6 validation to features/type-6 domain logic
      if (isType6Active) {
        const t6Err = type6Actual.validate();
        if (t6Err) {
          missingFields.push(t6Err);
        }
      }

      // Delegate Type 7A validation to features/type-7a domain logic
      if (isType7aActive) {
        const t7Validation = validateType7aActual(type7aActual.actualState);
        if (!t7Validation.isValid && t7Validation.errors?.length) {
          missingFields = [...missingFields, ...t7Validation.errors];
        }
      }

      // Delegate Type 7B validation to features/type-7b domain logic
      if (isType7bActive) {
        const t7bValidation = validateType7bActual(type7bActual.actualState);
        if (!t7bValidation.isValid && t7bValidation.errors?.length) {
          missingFields = [...missingFields, ...t7bValidation.errors];
        }
      }

      // Delegate Type 8 validation to features/type-8 domain logic
      if (isType8Active) {
        const t8Validation = validateType8Actual({
          activityResultStatus,
          t8RegistrationImages: type8Actual.registrationImages,
        });
        if (!t8Validation.isValid && t8Validation.errors?.length) {
          missingFields = [...missingFields, ...t8Validation.errors];
        }
      }

      // Delegate Type 9 validation to features/type-9 domain logic
      if (isType9Active) {
        const t9Validation = validateType9Actual({
          actualAttendees: type9Actual.actualAttendees,
          actualSales: type9Actual.actualSales,
        });
        if (!t9Validation.isValid && t9Validation.error) {
          missingFields.push(t9Validation.error);
        }
      }

      // Delegate Type 10 validation to features/type-10 domain logic
      if (isType10Active) {
        const t10Validation = validateType10Actual({
          actualAttendees: type10Actual.actualAttendees,
          actualSalesOrBooking: type10Actual.actualSalesOrBooking,
        });
        if (!t10Validation.isValid && t10Validation.error) {
          missingFields.push(t10Validation.error);
        }
      }

      // Delegate Type 11 validation to features/type-11 domain logic
      if (isType11Active) {
        const t11Validation = validateType11Actual(type11Actual.stockItems);
        if (!t11Validation.isValid && t11Validation.error) {
          missingFields.push(t11Validation.error);
        }
      }

      // Delegate Type 12 validation to features/type-12 domain logic
      if (isType12Active) {
        const t12Validation = validateType12Actual(
          type12Actual.collectPayload(),
        );
        if (!t12Validation.isValid && t12Validation.error) {
          missingFields.push(t12Validation.error);
        }
      }

      // Delegate Type 13 validation to features/type-13 domain logic
      if (isType13Active) {
        const t13Validation = validateType13Actual(
          type13Actual.collectPayload(),
        );
        if (!t13Validation.isValid && t13Validation.error) {
          missingFields.push(t13Validation.error);
        }
      }

      // Delegate Type 14 validation to features/type-14 domain logic
      if (isType14Active) {
        const t14Validation = validateType14Actual(
          type14Actual.collectPayload(),
        );
        if (!t14Validation.isValid && t14Validation.error) {
          missingFields.push(t14Validation.error);
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
            attachments: [
              ...(payload.attachments || []),
              ...cleanImages.map((img) => ({
                category: "PLOT",
                fileUrl: img.url,
                fileName: img.name || "รูปแปลงเกษตรกร",
                fileSize: img.size || 0,
                mimeType: img.type || "image/jpeg",
                workTypeCode: "TYPE_1",
              })),
            ],
          };
        }

        // Collect Type 2 payload if active
        if (isType2Active) {
          const newlyUploadedUrls: string[] = [];
          const cleanImages = await type2Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t2Payload = type2Actual.collectPayload(cleanImages);
          payload = {
            ...payload,
            ...t2Payload,
            followupResults: t2Payload.t2FollowupResults || [],
            attachments: [
              ...(payload.attachments || []),
              ...cleanImages.map((img) => ({
                category: "PLOT",
                fileUrl: img.url,
                fileName: img.name || "รูปภาพ",
                fileSize: img.size || 0,
                mimeType: img.type || "image/jpeg",
                workTypeCode: "TYPE_2",
              })),
            ],
          };
          if (!isType1Active && t2Payload.t2FollowupDetail) {
            payload.resultSummary = t2Payload.t2FollowupDetail;
          }
        }

        // Collect Type 3 payload if active
        if (isType3Active) {
          const t3Payload = type3Actual.collectPayload();
          payload = {
            ...payload,
            ...t3Payload,
            productSalesDetails: t3Payload.productSalesDetails || [],
            saleResults: t3Payload.productSalesDetails || [],
            t3ProductSalesDetails: t3Payload.productSalesDetails || [],
          };
          if (!isType1Active && !isType2Active && t3Payload.soldProducts) {
            payload.resultSummary = `เสนอขายสินค้า: ${t3Payload.soldProducts}`;
          }
        }

        // Collect Type 4 payload if active
        if (isType4Active) {
          const newlyUploadedUrls: string[] = [];
          const cleanImages = await type4Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t4Payload = type4Actual.collectPayload();
          payload = {
            ...payload,
            ...t4Payload,
            t4PaymentImages: cleanImages,
            attachments: [
              ...(payload.attachments || []),
              ...cleanImages.map((img) => ({
                category: "PAYMENT",
                fileUrl: img.url,
                fileName: img.name || "หลักฐานการชำระเงิน",
                fileSize: img.size || 0,
                mimeType: img.type || "image/jpeg",
                workTypeCode: "TYPE_4",
              })),
            ],
          };
          if (!isType1Active && !isType2Active && !isType3Active) {
            payload.resultSummary =
              t4Payload.t4CollectDetail ||
              t4Payload.t4BillingDetail ||
              t4Payload.t4Detail ||
              `วางบิล / เก็บเงิน: ${t4Payload.t4OrderNo || "บันทึกผลเรียบร้อย"}`;
          }
        }

        // Collect Type 5 payload if active
        if (isType5Active) {
          const newlyUploadedUrls: string[] = [];
          const cleanDetails = await type5Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t5Payload = type5Actual.collectPayload(cleanDetails);
          payload = {
            ...payload,
            ...t5Payload,
            surveyResults: t5Payload.t5SurveyDetails || [],
            attachments: [
              ...(payload.attachments || []),
              ...cleanDetails.flatMap((d) => [
                ...(d.bottleImages || []).map((img) => ({
                  category: "SURVEY_BOTTLE",
                  fileUrl: img.url,
                  fileName: img.name || "ภาพขวดสินค้า",
                  fileSize: img.size || 0,
                  mimeType: img.type || "image/jpeg",
                  workTypeCode: "TYPE_5",
                  storeId: d.storeId || undefined,
                  productId: d.productId || undefined,
                  surveyItemId: d.id,
                })),
                ...(d.promotionalImages || []).map((img) => ({
                  category: "SURVEY_PROMO_MATERIAL",
                  fileUrl: img.url,
                  fileName: img.name || "ภาพสื่อส่งเสริมการขาย",
                  fileSize: img.size || 0,
                  mimeType: img.type || "image/jpeg",
                  workTypeCode: "TYPE_5",
                  storeId: d.storeId || undefined,
                  productId: d.productId || undefined,
                  surveyItemId: d.id,
                })),
              ]),
            ],
          };
          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            t5Payload.t5CompetitorBrand
          ) {
            payload.resultSummary = `สำรวจตลาด: ${t5Payload.t5CompetitorBrand} (${t5Payload.t5CompetitorProduct || ""})`;
          }
        }

        // Collect Type 6 payload if active
        if (isType6Active) {
          const newlyUploadedUrls: string[] = [];
          const cleanImages = await type6Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t6Payload = type6Actual.collectPayload({
            isTypeVisible: true,
            products,
            customers,
            cleanImages,
          });
          payload = {
            ...payload,
            ...t6Payload,
            issueResults: t6Payload.t6IssueRecord
              ? [t6Payload.t6IssueRecord]
              : [],
            attachments: [
              ...(payload.attachments || []),
              ...cleanImages.map((img) => ({
                category: "ISSUE",
                fileUrl: img.url,
                fileName: img.name || "รูปภาพปัญหา",
                fileSize: img.size || 0,
                mimeType: img.type || "image/jpeg",
                workTypeCode: "TYPE_6",
              })),
            ],
          };
          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            t6Payload.t6ProblemDetail
          ) {
            payload.resultSummary = `ตรวจสอบเรื่องร้องเรียน: ${t6Payload.t6ProblemDetail}`;
          }
        }

        // Collect Type 7A payload if active
        if (isType7aActive) {
          const newlyUploadedUrls: string[] = [];
          const cleanImages = await uploadActivityPlanImageGroup(
            id,
            type7aActual.t7InitialPhotos,
            "type7a",
            "plot",
          );
          const t7Payload = type7aActual.buildPayload();
          payload = {
            ...payload,
            ...t7Payload,
            type7aPlots: [
              {
                id:
                  type7aActual.t7DemoPlotId || type7aTargets[0]?.id || "plot-0",
                plotName: type7aActual.t7PlotName,
                farmerName: type7aActual.t7FarmerName,
                cropCategory: type7aActual.t7CropCategory,
                cropName: type7aActual.t7CropName,
                areaRai: type7aActual.t7AreaRai
                  ? Number(type7aActual.t7AreaRai)
                  : null,
                objective: type7aActual.t7PlotObjective,
                latitude: type7aActual.t7Latitude
                  ? Number(type7aActual.t7Latitude)
                  : null,
                longitude: type7aActual.t7Longitude
                  ? Number(type7aActual.t7Longitude)
                  : null,
                demoProducts: type7aActual.t7DemoProducts,
              },
            ],
            attachments: [
              ...(payload.attachments || []),
              ...cleanImages.updatedImages.map((img: any) => ({
                category: "PLOT",
                fileUrl: img.url,
                fileName: img.name || "รูปถ่ายแปลงสาธิต",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_7A",
              })),
            ],
          };
          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            type7aActual.t7PlotName
          ) {
            payload.resultSummary = `จัดทำแปลงสาธิต: ${type7aActual.t7PlotName} (${type7aActual.t7CropName || ""})`;
          }
        }

        // Collect Type 7B payload if active
        if (isType7bActive) {
          const cropImgResult = await uploadActivityPlanImageGroup(
            id,
            (type7bActual.actualState.t7CropImages || []) as any,
            "type7b_crop",
            "crop",
          );
          const plotImgResult = await uploadActivityPlanImageGroup(
            id,
            (type7bActual.actualState.t7PlotImages || []) as any,
            "type7b_plot",
            "plot",
          );

          const finalCropImages = cropImgResult.updatedImages;
          const finalPlotImages = plotImgResult.updatedImages;

          // Upload images for each spraying round
          const rawRounds = type7bActual.actualState.t7SprayingRounds || [];
          const updatedRounds = [];

          for (let i = 0; i < rawRounds.length; i++) {
            const r = rawRounds[i];
            let roundImgs = r.roundImages || [];
            if (roundImgs.length > 0) {
              const rUploadResult = await uploadActivityPlanImageGroup(
                id,
                roundImgs as any,
                `type7b_round_${r.roundNumber || i + 1}`,
                "round",
              );
              roundImgs = rUploadResult.updatedImages;
            }
            updatedRounds.push({
              ...r,
              roundImages: roundImgs,
            });
          }

          const t7bRecord = {
            ...type7bActual.actualState,
            t7DemoPlotId:
              type7bActual.actualState.t7DemoPlotId ||
              type7bTargets[0]?.demoPlotId ||
              type7bTargets[0]?.id ||
              plan?.type7b?.plots?.[0]?.demoPlotId,
            t7CropImages: finalCropImages,
            t7PlotImages: finalPlotImages,
            t7SprayingRounds: updatedRounds,
          };

          payload = {
            ...payload,
            type7bActual: t7bRecord,
            attachments: [
              ...(payload.attachments || []),
              ...finalCropImages.map((img: any) => ({
                category: "CROP",
                fileUrl: img.url,
                fileName: img.name || "ภาพการเจริญเติบโตของพืช",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_7B",
              })),
              ...finalPlotImages.map((img: any) => ({
                category: "PLOT",
                fileUrl: img.url,
                fileName: img.name || "ภาพสภาพแปลงสาธิต",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_7B",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive
          ) {
            const plotName =
              t7bRecord.t7PlotName || type7bTargets[0]?.plotName || "แปลงสาธิต";
            payload.resultSummary = `ติดตามแปลงสาธิต: ${plotName} (สภาพพืช: ${t7bRecord.t7CropCondition || "ปกติ"})`;
          }
        }

        // Collect Type 8 payload if active
        if (isType8Active) {
          const regImgResult = await uploadActivityPlanImageGroup(
            id,
            (type8Actual.registrationImages || []) as any,
            "type8_registration",
            "registration",
          );
          const atmosImgResult = await uploadActivityPlanImageGroup(
            id,
            (type8Actual.images || []) as any,
            "type8_atmosphere",
            "atmosphere",
          );

          const finalRegImages = regImgResult.updatedImages;
          const finalAtmosImages = atmosImgResult.updatedImages;

          const t8Payload = type8Actual.collectPayload({
            isTypeVisible: true,
            cleanImages: finalAtmosImages,
            cleanRegistrationImages: finalRegImages,
          });

          payload = {
            ...payload,
            ...t8Payload,
            type8Actual: {
              ...t8Payload.type8Actual,
              t8RegistrationImages: finalRegImages,
              t8Images: finalAtmosImages,
            },
            attachments: [
              ...(payload.attachments || []),
              ...finalRegImages.map((img: any) => ({
                category: "REGISTRATION",
                fileUrl: img.url,
                fileName: img.name || "รูปใบลงทะเบียนผู้เข้าร่วมงาน",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_8",
              })),
              ...finalAtmosImages.map((img: any) => ({
                category: "ATMOSPHERE",
                fileUrl: img.url,
                fileName: img.name || "ภาพถ่ายบรรยากาศการประชุม",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_8",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive
          ) {
            const meetingTopic =
              type8Targets[0]?.topic ||
              (plan as any)?.type8Targets?.[0]?.topic ||
              "จัดประชุม";
            const qnaPart = type8Actual.feedbackQnA?.trim()
              ? ` | Q&A: ${type8Actual.feedbackQnA.trim()}`
              : "";
            payload.resultSummary = `จัดประชุม: ${meetingTopic} (ผู้เข้าร่วมจริง: ${type8Actual.actualAttendees || "-"} คน)${qnaPart}`;
          }
        }

        // Collect Type 9 payload if active
        if (isType9Active) {
          const storeImgResult = await uploadActivityPlanImageGroup(
            id,
            (type9Actual.images || []) as any,
            "type9_store",
            "atmosphere",
          );

          const finalStoreImages = storeImgResult.updatedImages;
          const t9Payload = type9Actual.collectPayload(finalStoreImages);

          payload = {
            ...payload,
            ...t9Payload,
            type9Actual: {
              ...t9Payload.type9Actual,
              images: finalStoreImages,
            },
            attachments: [
              ...(payload.attachments || []),
              ...finalStoreImages.map((img: any) => ({
                category: "ATMOSPHERE",
                fileUrl: img.url,
                fileName: img.name || "ภาพถ่ายกิจกรรมหน้าร้าน",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_9",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active
          ) {
            const storeName =
              type9Targets[0]?.storeName ||
              (plan as any)?.type9Targets?.[0]?.storeName ||
              "กิจกรรมหน้าร้าน";
            payload.resultSummary = `จัดกิจกรรมหน้าร้าน: ${storeName} (ผู้เข้าร่วมจริง: ${type9Actual.actualAttendees || "-"} คน, ยอดขายจริง: ${type9Actual.actualSales || "-"} บาท)`;
          }
        }

        // Collect Type 10 payload if active
        if (isType10Active) {
          const fieldDayImgResult = await uploadActivityPlanImageGroup(
            id,
            (type10Actual.images || []) as any,
            "type10_atmosphere",
            "atmosphere",
          );

          const finalFieldDayImages = fieldDayImgResult.updatedImages;
          const t10Payload = type10Actual.collectPayload(finalFieldDayImages);

          payload = {
            ...payload,
            ...t10Payload,
            type10Actual: {
              ...t10Payload.type10Actual,
              images: finalFieldDayImages,
            },
            attachments: [
              ...(payload.attachments || []),
              ...finalFieldDayImages.map((img: any) => ({
                category: "ATMOSPHERE",
                fileUrl: img.url,
                fileName: img.name || "ภาพถ่ายบรรยากาศงาน Field Day",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_10",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active &&
            !isType9Active
          ) {
            const plotName =
              type10Targets[0]?.plotName ||
              (plan as any)?.type10Targets?.[0]?.plotName ||
              type10Targets[0]?.location ||
              "งาน Field Day";
            payload.resultSummary = `จัดงาน Field Day: ${plotName} (ผู้เข้าร่วมจริง: ${type10Actual.actualAttendees || "-"} คน, ยอดขาย/จอง: ${type10Actual.actualSalesOrBooking || "-"} บาท)`;
          }
        }

        // Collect Type 11 payload if active
        if (isType11Active) {
          const stockImgResult = await uploadActivityPlanImageGroup(
            id,
            (type11Actual.images || []) as any,
            "type11_stock",
            "stock",
          );

          const finalStockImages = stockImgResult.updatedImages;
          const t11Payload = type11Actual.collectPayload(finalStockImages);

          payload = {
            ...payload,
            ...t11Payload,
            type11Actual: t11Payload,
            attachments: [
              ...(payload.attachments || []),
              ...finalStockImages.map((img: any) => ({
                category: "STOCK",
                fileUrl: img.url,
                fileName: img.name || "รูปภาพสต็อกสินค้า",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_11",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active &&
            !isType9Active &&
            !isType10Active
          ) {
            const storeName =
              type11Targets[0]?.store ||
              (plan as any)?.type11Stores?.[0]?.storeName ||
              "ร้านค้า";
            payload.resultSummary = `ตรวจเช็คสต๊อกหน้าร้าน: ${storeName} (${type11Actual.stockItems?.length || 0} รายการ)`;
          }
        }

        // Collect Type 12 payload if active
        if (isType12Active) {
          const tourImgResult = await uploadActivityPlanImageGroup(
            id,
            (type12Actual.images || []) as any,
            "type12_tour",
            "tour",
          );

          const finalTourImages = tourImgResult.updatedImages;
          const t12Payload = type12Actual.collectPayload();

          payload = {
            ...payload,
            type12Actual: {
              ...t12Payload,
              images: finalTourImages,
            },
            attachments: [
              ...(payload.attachments || []),
              ...finalTourImages.map((img: any) => ({
                category: "TOUR",
                fileUrl: img.url,
                fileName: img.name || "ภาพกิจกรรมศึกษาดูงาน",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_12",
              })),
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active &&
            !isType9Active &&
            !isType10Active &&
            !isType11Active
          ) {
            const dest =
              type12Targets[0]?.destination ||
              type12Targets[0]?.country ||
              (plan as any)?.tour?.destination ||
              (plan as any)?.tour?.country ||
              "ทัวร์";
            payload.resultSummary = `พาลูกค้าศึกษาดูงาน: ${dest} (ผู้ร่วมเดินทางจริง: ${type12Actual.actualAttendees || "-"} คน)`;
          }
        }

        // Collect Type 13 payload if active
        if (isType13Active) {
          const t13Payload = type13Actual.collectPayload();
          // Upload any un-uploaded images across all plots
          const allPlotImages = (type13Actual.plotsActual || []).flatMap(
            (p) => p.afterSprayImages || [],
          );
          let uploadedAttachments: any[] = [];
          if (allPlotImages.length > 0) {
            const imgResult = await uploadActivityPlanImageGroup(
              id,
              allPlotImages as any,
              "type13_after_spray",
              "after_spray",
            );
            uploadedAttachments = (imgResult.updatedImages || []).map(
              (img: any) => ({
                category: "AFTER_SPRAY",
                fileUrl: img.url,
                fileName: img.name || "ภาพหลังการฉีดพ่น",
                fileSize: (img as any).size || 0,
                mimeType: (img as any).type || "image/jpeg",
                workTypeCode: "TYPE_13",
              }),
            );
          }

          payload = {
            ...payload,
            type13Actual: t13Payload,
            attachments: [
              ...(payload.attachments || []),
              ...uploadedAttachments,
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active &&
            !isType9Active &&
            !isType10Active &&
            !isType11Active &&
            !isType12Active
          ) {
            const plotCount = type13Actual.plotsActual?.length || 1;
            payload.resultSummary = `ฉีดแปลงแฮตแทค: สำเร็จ (${plotCount} แปลง)`;
          }
        }

        // Collect Type 14 payload if active
        if (isType14Active) {
          const newlyUploadedUrls: string[] = [];
          const updatedRounds = await type14Actual.uploadImages(
            id,
            newlyUploadedUrls,
          );
          const t14Payload = type14Actual.collectPayload(updatedRounds);

          const allT14Images = updatedRounds.flatMap(
            (r) => r.afterSprayImages || [],
          );
          const uploadedAttachments = allT14Images.map((img: any) => ({
            category: "TRACKING_AFTER_SPRAY",
            fileUrl: img.url,
            fileName: img.name || "ภาพติดตามแปลงแฮตแทค",
            fileSize: (img as any).size || 0,
            mimeType: (img as any).type || "image/jpeg",
            workTypeCode: "TYPE_14",
          }));

          payload = {
            ...payload,
            type14Actual: t14Payload.type14Actual,
            attachments: [
              ...(payload.attachments || []),
              ...uploadedAttachments,
            ],
          };

          if (
            !isType1Active &&
            !isType2Active &&
            !isType3Active &&
            !isType4Active &&
            !isType5Active &&
            !isType6Active &&
            !isType7aActive &&
            !isType7bActive &&
            !isType8Active &&
            !isType9Active &&
            !isType10Active &&
            !isType11Active &&
            !isType12Active &&
            !isType13Active
          ) {
            const roundsCount = type14Actual.rounds?.length || 1;
            payload.resultSummary = `ติดตามแปลงแฮตแทค: สำเร็จ (${roundsCount} รอบ)`;
          }
        }
      }

      // Track old permanent image URLs that were removed by user
      const originalUrls = (plan?.attachments || [])
        .map((a: any) => a.fileUrl || a.url)
        .filter(
          (u: string) =>
            typeof u === "string" && u.startsWith("/uploads/activity-plans/"),
        );
      const currentUrls = new Set(
        (payload.attachments || [])
          .map((a: any) => a.fileUrl || a.url)
          .filter(Boolean),
      );
      const oldUrlsToDelete = originalUrls.filter(
        (u: string) => !currentUrls.has(u),
      );

      const res = await recordActivityResultAction(id, payload);
      if (res.success) {
        if (oldUrlsToDelete.length > 0 && id) {
          await deleteActivityPlanImagePaths(id, oldUrlsToDelete);
        }
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
              type3State={type3Actual}
              type4State={type4Actual}
              type5State={type5Actual}
              type6State={type6Actual}
              type7aState={type7aActual}
              type7bState={type7bActual}
              type8State={type8Actual}
              type9State={type9Actual}
              type10State={type10Actual}
              type11State={type11Actual}
              type12State={type12Actual}
              type13State={type13Actual}
              type14State={type14Actual}
              targets={targets}
              type2Targets={type2Targets}
              type3Targets={type3Targets}
              type4Targets={type4Targets}
              type5Targets={type5Targets}
              type6Targets={type6Targets}
              type7aTargets={type7aTargets}
              type7bTargets={type7bTargets}
              type8Targets={type8Targets}
              type9Targets={type9Targets}
              type10Targets={type10Targets}
              type11Targets={type11Targets}
              type12Targets={type12Targets}
              type13Targets={type13Targets}
              type14Targets={type14Targets}
              plan={plan}
              products={products}
              customers={customers}
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
          <div className="h-12 md:hidden" />
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
