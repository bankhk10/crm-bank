"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  recordActivityResultAction,
} from "@/modules/activity-plans/server/actions";
import {
  buildResultSummary,
  deleteActivityPlanImagePaths,
} from "../utils";
import type { PlanSummaryData, ActualTargetsState } from "../types";
import type { useActualStatusState } from "./use-actual-status-state";
import type { useType1Actual } from "@/modules/activity-plans/features/type-1";
import type { useType2Actual } from "@/modules/activity-plans/features/type-2";
import type { useType3Actual } from "@/modules/activity-plans/features/type-3";
import type { useType4Actual } from "@/modules/activity-plans/features/type-4";
import type { useType5Actual } from "@/modules/activity-plans/features/type-5";
import type { useType6Actual } from "@/modules/activity-plans/features/type-6";
import type { useType7aActual } from "@/modules/activity-plans/features/type-7a";
import type { useType7bActual } from "@/modules/activity-plans/features/type-7b";
import type { useType8Actual } from "@/modules/activity-plans/features/type-8";
import type { useType9Actual } from "@/modules/activity-plans/features/type-9";
import type { useType10Actual } from "@/modules/activity-plans/features/type-10";
import type { useType11Actual } from "@/modules/activity-plans/features/type-11";

interface UseActualSubmitProps {
  id?: string;
  planStatus: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isTypeVisible: (typeTitleOrCode: string) => boolean;
  planSummary: PlanSummaryData;
  planWorkTypes: string[];
  targets: ActualTargetsState;
  products: any[];
  customers: any[];
  statusState: ReturnType<typeof useActualStatusState>;
  typeHooks: {
    type1: ReturnType<typeof useType1Actual>;
    type2: ReturnType<typeof useType2Actual>;
    type3: ReturnType<typeof useType3Actual>;
    type4: ReturnType<typeof useType4Actual>;
    type5: ReturnType<typeof useType5Actual>;
    type6: ReturnType<typeof useType6Actual>;
    type7a: ReturnType<typeof useType7aActual>;
    type7b: ReturnType<typeof useType7bActual>;
    type8: ReturnType<typeof useType8Actual>;
    type9: ReturnType<typeof useType9Actual>;
    type10: ReturnType<typeof useType10Actual>;
    type11: ReturnType<typeof useType11Actual>;
  };
}

export function useActualSubmit({
  id,
  planStatus,
  onSuccess,
  isTypeVisible,
  planSummary,
  planWorkTypes,
  targets,
  products,
  customers,
  statusState,
  typeHooks,
}: UseActualSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (planStatus && planStatus !== "APPROVED") {
        setFormError(
          "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น",
        );
        return;
      }
      setFormError(null);
      setIsSubmitting(true);

      const allNewlyUploadedUrls: string[] = [];

      try {
        if (id) {
          const {
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
          } = typeHooks;

          // --- 1. UPLOAD NEW IMAGES ACROSS ALL ACTIVE WORK TYPES ---
          let cleanT1Images = type1.t1PlotImages;
          if (isTypeVisible("TYPE_1")) {
            cleanT1Images = await type1.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT2Images = type2.t2Images;
          if (isTypeVisible("TYPE_2")) {
            cleanT2Images = await type2.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT5SurveyDetails = type5.t5SurveyDetails;
          if (isTypeVisible("TYPE_5")) {
            cleanT5SurveyDetails = await type5.uploadImages(id, allNewlyUploadedUrls);
          }

          // Validate TYPE-6 if visible
          if (isTypeVisible("TYPE_6")) {
            const t6ValidationError = type6.validate();
            if (t6ValidationError) {
              setFormError(t6ValidationError);
              setIsSubmitting(false);
              return;
            }
          }

          let cleanT6Images = type6.t6Images;
          if (isTypeVisible("TYPE_6")) {
            cleanT6Images = await type6.uploadImages(id, allNewlyUploadedUrls);
          }

          // TYPE_7 (7A / 7B)
          const isType7A = isTypeVisible("TYPE_7A") || isTypeVisible("ทำแปลงสาธิต");
          const isType7B = isTypeVisible("TYPE_7B") || isTypeVisible("ติดตามแปลงสาธิต");
          const plotItemId =
            type7a.t7DemoPlotId ||
            type7b.t7DemoPlotId ||
            targets.t7.owner ||
            "demo-plot";

          let cleanT7InitialPhotos = type7a.t7InitialPhotos;
          if (isType7A || isType7B) {
            cleanT7InitialPhotos = await type7a.uploadImages(
              id,
              plotItemId,
              allNewlyUploadedUrls,
            );
          }

          let cleanT7CropImages = type7b.t7CropImages;
          let cleanT7PlotImages = type7b.t7PlotImages;
          let cleanT7bRounds = type7b.t7bSprayingRounds;
          if (isType7A || isType7B) {
            const res = await type7b.uploadImages(
              id,
              plotItemId,
              allNewlyUploadedUrls,
            );
            cleanT7CropImages = res.cleanCropImages;
            cleanT7PlotImages = res.cleanPlotImages;
            cleanT7bRounds = res.cleanRounds;
          }

          let cleanT8Images = type8.t8Images;
          if (isTypeVisible("TYPE_8")) {
            cleanT8Images = await type8.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT9Images = type9.t9Images;
          if (isTypeVisible("TYPE_9")) {
            cleanT9Images = await type9.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT10Images = type10.t10Images;
          if (isTypeVisible("TYPE_10")) {
            cleanT10Images = await type10.uploadImages(id, allNewlyUploadedUrls);
          }

          // --- 2. CALCULATE OLD REMOVED URLS ACROSS ALL WORK TYPES ---
          const allOldUrlsToDelete = [
            ...type1.collectOldImageUrlsToDelete(cleanT1Images),
            ...type2.collectOldImageUrlsToDelete(cleanT2Images),
            ...type5.collectOldImageUrlsToDelete(cleanT5SurveyDetails),
            ...type6.collectOldImageUrlsToDelete(cleanT6Images),
            ...type7a.collectOldImageUrlsToDelete(cleanT7InitialPhotos),
            ...type7b.collectOldImageUrlsToDelete(
              cleanT7CropImages,
              cleanT7PlotImages,
              cleanT7bRounds,
            ),
            ...type8.collectOldImageUrlsToDelete(cleanT8Images),
            ...type9.collectOldImageUrlsToDelete(cleanT9Images),
            ...type10.collectOldImageUrlsToDelete(cleanT10Images),
          ];

          // --- 3. BUILD RESULT PAYLOAD & VALIDATE ---
          const t1Payload = type1.collectPayload(cleanT1Images);
          const t2Payload = type2.collectPayload(cleanT2Images);
          const t3Payload = type3.collectPayload();
          const t4Payload = type4.collectPayload();
          const t5Payload = type5.collectPayload(cleanT5SurveyDetails);
          const t6Payload = type6.collectPayload({
            isTypeVisible: isTypeVisible("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา") || isTypeVisible("TYPE_6"),
            products,
            customers,
            cleanImages: cleanT6Images,
          });
          const t7aPayload = type7a.collectPayload(cleanT7InitialPhotos);
          const t7bPayload = type7b.collectPayload({
            cleanCropImages: cleanT7CropImages,
            cleanPlotImages: cleanT7PlotImages,
            cleanRounds: cleanT7bRounds,
            products,
            targets,
          });
          const t8Payload = type8.collectPayload(cleanT8Images);
          const t9Payload = type9.collectPayload(cleanT9Images);
          const t10Payload = type10.collectPayload(cleanT10Images);
          const t11Payload = type11.collectPayload();

          const buildResult = buildResultSummary({
            activityResultStatus: statusState.activityResultStatus,
            cancelReason: statusState.cancelReason,
            postponedDate: statusState.postponedDate,
            postponedTime: statusState.postponedTime,
            postponedReason: statusState.postponedReason,
            postponedNotes: statusState.postponedNotes,
            planSummary,
            planWorkTypes,
            products,
            ...t1Payload,
            ...t2Payload,
            ...t3Payload,
            ...t4Payload,
            ...t5Payload,
            ...t6Payload,
            ...t7aPayload,
            ...t7bPayload,
            ...t8Payload,
            ...t9Payload,
            ...t10Payload,
            ...t11Payload,
          });

          if (buildResult.validationError) {
            if (allNewlyUploadedUrls.length > 0) {
              await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
            }
            setFormError(buildResult.validationError);
            setIsSubmitting(false);
            return;
          }

          // --- 4. RECORD TO DATABASE ---
          const res = await recordActivityResultAction(id, buildResult.payload);
          if (!res.success) {
            if (allNewlyUploadedUrls.length > 0) {
              await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
            }
            setFormError(res.error || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
            setIsSubmitting(false);
            return;
          }

          // --- 5. DB SAVE SUCCEEDED: DELETE OLD REMOVED PHYSICAL FILES ---
          if (allOldUrlsToDelete.length > 0) {
            await deleteActivityPlanImagePaths(id, allOldUrlsToDelete);
          }

          // Update initial references on all TYPE hooks
          type1.commitSavedImages(cleanT1Images);
          type2.commitSavedImages(cleanT2Images);
          type5.commitSavedImages(cleanT5SurveyDetails);
          type6.commitSavedImages(cleanT6Images);
          type7a.commitSavedImages(cleanT7InitialPhotos);
          type7b.commitSavedImages(
            cleanT7CropImages,
            cleanT7PlotImages,
            cleanT7bRounds,
          );
          type8.commitSavedImages(cleanT8Images);
          type9.commitSavedImages(cleanT9Images);
          type10.commitSavedImages(cleanT10Images);

          // Record TYPE-7B DemoPlotVisit if applicable
          if (
            !isType7A &&
            isType7B &&
            (type7b.t7DemoPlotId ||
              type7a.t7DemoPlotId ||
              targets.t7.owner ||
              targets.t7.product ||
              targets.t7a?.owner ||
              targets.t7b?.owner)
          ) {
            const plotIdentifier =
              type7b.t7DemoPlotId ||
              type7a.t7DemoPlotId ||
              targets.t7.owner ||
              "plot-default";
            await type7b.recordVisit(
              id,
              plotIdentifier,
              cleanT7CropImages,
              cleanT7PlotImages,
            );
          }
        }

        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(id ? `/activity-plans/${id}` : "/activity-plans");
          }
        }, 1000);
      } catch (err: any) {
        if (id && allNewlyUploadedUrls.length > 0) {
          await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
        }
        setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
        setIsSubmitting(false);
      }
    },
    [
      id,
      planStatus,
      onSuccess,
      router,
      isTypeVisible,
      planSummary,
      planWorkTypes,
      targets,
      products,
      customers,
      statusState,
      typeHooks,
    ],
  );

  return {
    isSubmitting,
    formError,
    setFormError,
    submitSuccess,
    handleSubmit,
  };
}
