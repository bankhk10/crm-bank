"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { useType13ActualState } from "@/modules/activity-plans/features/type-13";
import { useType14ActualState } from "@/modules/activity-plans/features/type-14";
import { buildResultSummary, extractPlanData, parseResultSummary } from "../utils";
import { initialTargets } from "../constants";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { useActualStatusState } from "./use-actual-status-state";

export interface ActualTypeHooks {
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
  type13: ReturnType<typeof useType13ActualState>;
  type14: ReturnType<typeof useType14ActualState>;
}

export interface UseActualOrchestratorProps {
  id?: string;
  plan?: any;
  parsedResult?: any;
  targets?: any;
  statusState?: ReturnType<typeof useActualStatusState>;
}

export function useActualOrchestrator({
  id,
  plan,
  parsedResult,
  targets,
  statusState,
}: UseActualOrchestratorProps = {}) {
  // 1. Instantiate individual TYPE actual hooks
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
  const type13 = useType13ActualState();
  const type14 = useType14ActualState();

  // 2. Memoized aggregation map of all TYPE hooks
  const typeHooks: ActualTypeHooks = useMemo(
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
      type13,
      type14,
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
      type13,
      type14,
    ],
  );

  // Keep latest refs to avoid unstable closure dependencies triggering re-hydrations
  const statusStateRef = useRef(statusState);
  statusStateRef.current = statusState;

  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  const typeHooksRef = useRef(typeHooks);
  typeHooksRef.current = typeHooks;

  // 3. Hydration state & lifecycle
  const [isHydrated, setIsHydrated] = useState(!id);
  const hydratedRef = useRef<{ plan: any; parsedResult: any } | null>(null);

  const hydrate = useCallback(
    (targetPlan: any, targetParsedResult: any, targetTargets?: any) => {
      let activeTargets = targetTargets || targetsRef.current;
      if (
        (!activeTargets || Object.keys(activeTargets).length === 0) &&
        targetPlan
      ) {
        try {
          const extracted = extractPlanData(targetPlan, initialTargets);
          activeTargets = extracted.targets;
        } catch {
          activeTargets = initialTargets;
        }
      }
      if (!activeTargets) activeTargets = {};

      const currentStatus = statusStateRef.current;
      const currentHooks = typeHooksRef.current;

      const effectiveParsed = targetParsedResult
        ? targetParsedResult.t1ProductAdvice !== undefined ||
          targetParsedResult.t1DiscussionResult !== undefined ||
          targetParsedResult.t3ProductSalesDetails !== undefined ||
          targetParsedResult.t5SurveyDetails !== undefined ||
          targetParsedResult.t6IssueDetails !== undefined ||
          targetParsedResult.t7DemoResults !== undefined ||
          targetParsedResult.t8ProductSalesDetails !== undefined ||
          targetParsedResult.t9ProductSalesDetails !== undefined ||
          targetParsedResult.t10ProductSalesDetails !== undefined ||
          targetParsedResult.t11StockItems !== undefined ||
          targetParsedResult.activityResultStatus !== undefined
          ? targetParsedResult
          : parseResultSummary(targetParsedResult)
        : null;

      if (currentStatus && effectiveParsed) {
        currentStatus.hydrateStatus(effectiveParsed);
      }

      if (effectiveParsed) {
        currentHooks.type1.hydrate(effectiveParsed);
        currentHooks.type2.hydrate(effectiveParsed);
        currentHooks.type3.hydrate(effectiveParsed);
        currentHooks.type4.hydrate(effectiveParsed);
        currentHooks.type5.hydrate(effectiveParsed, activeTargets);
        currentHooks.type6.hydrate(effectiveParsed);
        currentHooks.type7a.hydrate(
          targetPlan,
          effectiveParsed,
          activeTargets,
        );
        currentHooks.type7b.hydrate(
          targetPlan,
          effectiveParsed,
          activeTargets,
        );
        currentHooks.type8.hydrate(effectiveParsed);
        currentHooks.type9.hydrate(effectiveParsed);
        currentHooks.type10.hydrate(effectiveParsed);
        currentHooks.type11.hydrate(effectiveParsed);
        currentHooks.type13.hydrate(
          targetPlan,
          effectiveParsed,
          activeTargets,
        );
        currentHooks.type14.hydrate(
          targetPlan,
          effectiveParsed,
          activeTargets,
        );
      }
      setIsHydrated(true);
    },
    [],
  );

  useEffect(() => {
    setIsHydrated(!id);
  }, [id]);

  useEffect(() => {
    if (!plan) return;
    if (
      hydratedRef.current &&
      hydratedRef.current.plan === plan &&
      hydratedRef.current.parsedResult === parsedResult
    ) {
      return;
    }
    hydratedRef.current = { plan, parsedResult };
    hydrate(plan, parsedResult, targetsRef.current);
  }, [plan, parsedResult, hydrate]);

  // 4. Actual payload builder (supports unplanned draft / actual submission)
  const buildActualData = useCallback(
    ({
      currentStatusState,
      planSummary,
      planWorkTypes,
      productsList = [],
      customersList = [],
      selectedWorkTypes = [],
      targets: customTargets,
    }: {
      currentStatusState?: ReturnType<typeof useActualStatusState>;
      planSummary: any;
      planWorkTypes: string[];
      productsList?: any[];
      customersList?: any[];
      selectedWorkTypes: string[];
      targets?: any;
    }) => {
      const activeStatus =
        currentStatusState || statusStateRef.current || statusState;
      if (!activeStatus) {
        throw new Error("statusState is required to build actual data payload");
      }

      const isType6Visible = selectedWorkTypes.some(
        (wt) =>
          getWorkTypeCode(wt) === "TYPE_6" ||
          wt.includes("ตรวจสอบเรื่องร้องเรียน"),
      );
      const isType7A = selectedWorkTypes.some(
        (wt) => getWorkTypeCode(wt) === "TYPE_7A" || wt.includes("ทำแปลงสาธิต"),
      );
      const isType7B = selectedWorkTypes.some(
        (wt) =>
          getWorkTypeCode(wt) === "TYPE_7B" || wt.includes("ติดตามแปลงสาธิต"),
      );
      const isType13 = selectedWorkTypes.some(
        (wt) =>
          getWorkTypeCode(wt) === "TYPE_13" || wt.includes("ฉีดแปลงแฮตแทค"),
      );
      const isType14 = selectedWorkTypes.some(
        (wt) =>
          getWorkTypeCode(wt) === "TYPE_14" || wt.includes("ติดตามแปลงแฮทแทค"),
      );

      const activeTargets =
        customTargets || targetsRef.current || targets || {};

      const t1Payload = type1.collectPayload ? type1.collectPayload() : {};
      const t2Payload = type2.collectPayload ? type2.collectPayload() : {};
      const t3Payload = type3.collectPayload ? type3.collectPayload() : {};
      const t4Payload = type4.collectPayload ? type4.collectPayload() : {};
      const t5Payload = type5.collectPayload ? type5.collectPayload() : {};
      const t6Payload = type6.collectPayload
        ? type6.collectPayload({
            isTypeVisible: isType6Visible,
            products: productsList,
            customers: customersList,
            cleanImages: type6.t6Images,
          })
        : {};
      const t7aPayload = type7a.collectPayload ? type7a.collectPayload() : {};
      const t7bPayload = type7b.collectPayload
        ? type7b.collectPayload({
            cleanCropImages: isType7B ? type7b.t7CropImages : [],
            cleanPlotImages: isType7B ? type7b.t7PlotImages : [],
            cleanRounds: isType7B ? type7b.t7bSprayingRounds : [],
            products: productsList,
            targets: activeTargets,
          })
        : {};
      const t8Payload = type8.collectPayload
        ? type8.collectPayload(type8.t8Images, type8.t8RegistrationImages)
        : {};
      const t9Payload = type9.collectPayload
        ? type9.collectPayload(type9.t9Images)
        : {};
      const t10Payload = type10.collectPayload
        ? type10.collectPayload(type10.t10Images)
        : {};
      const t11Payload = type11.collectPayload
        ? type11.collectPayload(type11.t11Images)
        : {};

      const t13Payload =
        isType13 && type13 && type13.buildType13ActualPayload
          ? type13.buildType13ActualPayload(type13.plotsActual)
          : {
              sprayRounds: [],
              type13PlotsActual: [],
              type13NewPlots: [],
              attachments: [],
            };

      const t14Payload =
        isType14 && type14 && type14.buildType14ActualPayload
          ? type14.buildType14ActualPayload(type14.afterSprayImages)
          : { sprayRounds: [], attachments: [] };

      const activeType7Payload = isType7A ? t7aPayload : t7bPayload;

      const buildResult = buildResultSummary({
        activityResultStatus: activeStatus.activityResultStatus,
        cancelReason: activeStatus.cancelReason,
        postponedDate: activeStatus.postponedDate,
        postponedTime: activeStatus.postponedTime,
        postponedReason: activeStatus.postponedReason,
        postponedNotes: activeStatus.postponedNotes,
        planSummary,
        planWorkTypes,
        products: productsList,
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
        return {
          validationError: buildResult.validationError,
          actualData: undefined,
        };
      }

      const actualData = {
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

      return { validationError: null, actualData };
    },
    [
      statusState,
      targets,
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
      type13,
      type14,
    ],
  );

  return {
    typeHooks,
    isHydrated,
    hydrate,
    buildActualData,
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
    type13,
    type14,
  };
}
