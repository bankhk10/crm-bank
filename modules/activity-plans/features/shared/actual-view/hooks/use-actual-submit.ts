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
import { validateType13Actual } from "@/modules/activity-plans/features/type-13/actual/validation";
import type { PlanSummaryData, ActualTargetsState } from "../types";
import type { useActualStatusState } from "./use-actual-status-state";
import type { ActualTypeHooks } from "./use-actual-orchestrator";

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
  typeHooks: ActualTypeHooks;
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
          if (isType7A) {
            cleanT7InitialPhotos = await type7a.uploadImages(
              id,
              plotItemId,
              allNewlyUploadedUrls,
            );
          }

          let cleanT7CropImages = type7b.t7CropImages;
          let cleanT7PlotImages = type7b.t7PlotImages;
          let cleanT7bRounds = type7b.t7bSprayingRounds;
          if (isType7B) {
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
          let cleanT8RegistrationImages = type8.t8RegistrationImages;
          if (isTypeVisible("TYPE_8")) {
            const res = await type8.uploadImages(id, allNewlyUploadedUrls);
            cleanT8Images = res.cleanImages;
            cleanT8RegistrationImages = res.cleanRegistrationImages;
          }

          let cleanT9Images = type9.t9Images;
          if (isTypeVisible("TYPE_9")) {
            cleanT9Images = await type9.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT10Images = type10.t10Images;
          if (isTypeVisible("TYPE_10")) {
            cleanT10Images = await type10.uploadImages(id, allNewlyUploadedUrls);
          }

          let cleanT11Images = type11.t11Images;
          if (isTypeVisible("TYPE_11")) {
            const t11ValidationError = type11.validate();
            if (t11ValidationError) {
              setFormError(t11ValidationError);
              setIsSubmitting(false);
              return;
            }
            cleanT11Images = await type11.uploadImages(id, allNewlyUploadedUrls);
          }

          // TYPE_13: ฉีดแปลงแฮตแทค - Upload after-spray photos
          const isType13 =
            isTypeVisible("ฉีดแปลงแฮตแทค") || isTypeVisible("TYPE_13");
          let cleanT13Plots = typeHooks.type13?.plotsActual;
          if (isType13 && typeHooks.type13) {
            cleanT13Plots = await typeHooks.type13.uploadImages(id, allNewlyUploadedUrls);
          }

          // TYPE_14: ติดตามแปลงแฮทแทค - Upload after-spray photos
          const isType14 =
            isTypeVisible("ติดตามแปลงแฮทแทค") || isTypeVisible("TYPE_14");
          let cleanT14Images = typeHooks.type14?.afterSprayImages;
          if (isType14 && typeHooks.type14) {
            cleanT14Images = await typeHooks.type14.uploadImages(
              id,
              allNewlyUploadedUrls,
            );
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
            ...type8.collectOldImageUrlsToDelete(
              cleanT8Images,
              cleanT8RegistrationImages,
            ),
            ...type9.collectOldImageUrlsToDelete(cleanT9Images),
            ...type10.collectOldImageUrlsToDelete(cleanT10Images),
            ...type11.collectOldImageUrlsToDelete(cleanT11Images),
            ...(isType13 && typeHooks.type13 && cleanT13Plots
              ? typeHooks.type13.collectOldImageUrlsToDelete(cleanT13Plots)
              : []),
            ...(isType14 && typeHooks.type14 && cleanT14Images
              ? typeHooks.type14.collectOldImageUrlsToDelete(cleanT14Images)
              : []),
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
            cleanCropImages: isType7B ? cleanT7CropImages : [],
            cleanPlotImages: isType7B ? cleanT7PlotImages : [],
            cleanRounds: isType7B ? cleanT7bRounds : [],
            products,
            targets,
          });
          const t8Payload = type8.collectPayload(
            cleanT8Images,
            cleanT8RegistrationImages,
          );
          const t9Payload = type9.collectPayload(cleanT9Images);
          const t10Payload = type10.collectPayload(cleanT10Images);
          const t11Payload = type11.collectPayload(cleanT11Images);

          // TYPE_13 payload
          let t13Payload: any = {};
          if (isType13 && typeHooks.type13) {
            const currentPlots = cleanT13Plots || typeHooks.type13.plotsActual;
            const t13Validation = validateType13Actual(currentPlots);
            if (!t13Validation.isValid) {
              if (allNewlyUploadedUrls.length > 0) {
                await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
              }
              setFormError(t13Validation.error || "ข้อมูลแปลงไม่ถูกต้อง");
              setIsSubmitting(false);
              return;
            }
            t13Payload = typeHooks.type13.buildType13ActualPayload(currentPlots);
          }

          // TYPE_14 payload
          let t14Payload: any = {};
          if (isType14 && typeHooks.type14) {
            try {
              t14Payload = typeHooks.type14.buildType14ActualPayload(cleanT14Images);
            } catch (err: any) {
              if (allNewlyUploadedUrls.length > 0) {
                await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
              }
              setFormError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล TYPE14");
              setIsSubmitting(false);
              return;
            }
          }

          const activeType7Payload = isType7A ? t7aPayload : t7bPayload;

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
            ...activeType7Payload,
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
          const combinedPayload = {
            ...buildResult.payload,
            ...(t13Payload.sprayRounds?.length || t14Payload.sprayRounds?.length
              ? {
                  sprayRounds: [
                    ...(buildResult.payload.sprayRounds || []),
                    ...(t13Payload.sprayRounds || []),
                    ...(t14Payload.sprayRounds || []),
                  ],
                }
              : {}),
            ...(t13Payload.type13PlotsActual?.length
              ? { type13PlotsActual: t13Payload.type13PlotsActual }
              : {}),
            ...(t13Payload.type13NewPlots?.length
              ? { type13NewPlots: t13Payload.type13NewPlots }
              : {}),
            ...(t13Payload.attachments?.length || t14Payload.attachments?.length
              ? {
                  attachments: [
                    ...(buildResult.payload.attachments || []),
                    ...(t13Payload.attachments || []),
                    ...(t14Payload.attachments || []),
                  ],
                }
              : {}),
          };
          const res = await recordActivityResultAction(id, combinedPayload);
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
          type8.commitSavedImages(cleanT8Images, cleanT8RegistrationImages);
          type9.commitSavedImages(cleanT9Images);
          type10.commitSavedImages(cleanT10Images);
          type11.commitSavedImages(cleanT11Images);
          if (isType13 && typeHooks.type13 && cleanT13Plots) {
            typeHooks.type13.commitSavedImages(cleanT13Plots);
          }
          if (isType14 && typeHooks.type14 && cleanT14Images) {
            typeHooks.type14.commitSavedImages(cleanT14Images);
          }

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
