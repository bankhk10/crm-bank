import type { ActivityPlanWithRelations } from "../../types";
import { getWorkTypeCode } from "../../constants";
import { extractType1PlanTargets } from "../../features/type-1";
import { extractType2PlanTargets } from "../../features/type-2";
import { extractType3PlanTargets } from "../../features/type-3";
import { extractType4PlanTargets } from "../../features/type-4";
import { extractType5PlanTargets } from "../../features/type-5";
import { extractType6PlanTargets } from "../../features/type-6";
import { extractType7aPlanTargets } from "../../features/type-7a";
import { extractType7bPlanTargets } from "../../features/type-7b";
import type { ActualTargetsState } from "./types";
import { initialTargets } from "./constants";

export type TargetExtractorFn = (
  plan: ActivityPlanWithRelations,
  prevTarget?: any,
) => any;

/**
 * Registry of type-specific target extractors.
 * New work types (Type 2 - 14) register their extractors here.
 */
const TARGET_EXTRACTORS: Record<string, TargetExtractorFn> = {
  TYPE_1: (p, prev) => extractType1PlanTargets(p, prev),
  TYPE_2: (p, prev) => extractType2PlanTargets(p, prev),
  TYPE_3: (p, prev) => extractType3PlanTargets(p, prev),
  TYPE_4: (p, prev) => extractType4PlanTargets(p, prev),
  TYPE_5: (p, prev) => extractType5PlanTargets(p, prev),
  TYPE_6: (p, prev) => extractType6PlanTargets(p, prev),
  TYPE_7A: (p, prev) => extractType7aPlanTargets(p, prev),
  TYPE_7B: (p, prev) => extractType7bPlanTargets(p, prev),
};

/**
 * Register a target extractor for a specific work type.
 */
export function registerTargetExtractor(
  workTypeCode: string,
  extractor: TargetExtractorFn,
) {
  TARGET_EXTRACTORS[workTypeCode.toUpperCase()] = extractor;
}

/**
 * Extract targets for all present work types in the plan.
 */
export function extractPlanTargets(
  plan: ActivityPlanWithRelations,
  resolvedWorkTypes: string[],
  prevTargets: ActualTargetsState = initialTargets,
): ActualTargetsState {
  const targets: ActualTargetsState = { ...prevTargets };

  for (const wt of resolvedWorkTypes) {
    const code = getWorkTypeCode(wt);
    const extractor = TARGET_EXTRACTORS[code];

    if (extractor) {
      if (code === "TYPE_1") {
        const extracted = extractor(plan, prevTargets.t1);
        targets.t1 = extracted.primary || extracted;
        targets.t1List = extracted.list || [];
      } else if (code === "TYPE_2") {
        const extracted = extractor(plan, prevTargets.t2);
        targets.t2 = extracted.primary || extracted;
        targets.t2List = extracted.list || [];
      } else if (code === "TYPE_3") {
        const extracted = extractor(plan, prevTargets.t3);
        targets.t3 = extracted.primary || extracted;
        targets.t3List = extracted.list || [];
      } else if (code === "TYPE_4") {
        const extracted = extractor(plan, prevTargets.t4);
        targets.t4 = extracted.primary || extracted;
        targets.t4List = extracted.list || [];
      } else {
        const key = `t${code.replace("TYPE_", "").toLowerCase()}`;
        const extracted = extractor(plan, prevTargets[key]);
        targets[key] = extracted?.primary || extracted;
        if (extracted?.list) {
          targets[`${key}List`] = extracted.list;
        }
        if (code === "TYPE_7A") {
          targets.t7 = targets.t7a;
          targets.t7List = targets.t7aList;
        }
      }
    }
  }

  // Always attempt Type 1 if relation exists
  if (
    !targets.t1?.customer &&
    (plan.type1Stores?.length || plan.type1Results?.length)
  ) {
    const extracted = extractType1PlanTargets(plan, prevTargets.t1);
    targets.t1 = extracted.primary;
    targets.t1List = extracted.list;
  }

  // Always attempt Type 2 if relation exists
  if (!targets.t2?.customer && plan.type2Targets?.length) {
    const extracted = extractType2PlanTargets(plan, prevTargets.t2);
    targets.t2 = extracted.primary;
    targets.t2List = extracted.list;
  }

  // Always attempt Type 3 if relation exists
  if (!targets.t3?.customer && plan.type3Targets?.length) {
    const extracted = extractType3PlanTargets(plan, prevTargets.t3);
    targets.t3 = extracted.primary;
    targets.t3List = extracted.list;
  }

  // Always attempt Type 4 if relation exists
  if (!targets.t4?.customer && (plan as any).type4Targets?.length) {
    const extracted = extractType4PlanTargets(plan, prevTargets.t4);
    targets.t4 = extracted.primary;
    targets.t4List = extracted.list;
  }

  // Always attempt Type 5 if relation exists
  if (!targets.t5?.store && (plan as any).type5Targets?.length) {
    const extracted = extractType5PlanTargets(plan, prevTargets.t5);
    targets.t5 = extracted.primary;
    targets.t5List = extracted.list;
  }

  // Always attempt Type 6 if relation exists
  if (!targets.t6?.customer && (plan as any).type6Targets?.length) {
    const extracted = extractType6PlanTargets(plan, prevTargets.t6);
    targets.t6 = extracted.primary;
    targets.t6List = extracted.list;
  }

  // Always attempt Type 7A if relation exists
  if (
    !targets.t7a?.plotName &&
    !targets.t7?.plotName &&
    ((plan as any).type7aPlots?.length || (plan as any).demoPlots?.length)
  ) {
    const extracted = extractType7aPlanTargets(plan);
    targets.t7a = extracted.primary;
    targets.t7aList = extracted.list;
    targets.t7 = extracted.primary;
    targets.t7List = extracted.list;
  }

  // Always attempt Type 7B if relation exists
  if (
    !targets.t7b?.plotName &&
    ((plan as any).type7b || (plan as any).type7bData)
  ) {
    const extracted = extractType7bPlanTargets(plan, prevTargets.t7b);
    targets.t7b = extracted.primary;
    targets.t7bList = extracted.list;
  }

  return targets;
}

