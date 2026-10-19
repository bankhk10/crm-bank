import type { ActivityPlanWithRelations } from "../../types";
import { getWorkTypeCode } from "../../constants";
import { extractType1PlanTargets } from "../../features/type-1";
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
      } else {
        const key = `t${code.replace("TYPE_", "").toLowerCase()}`;
        targets[key] = extractor(plan, prevTargets[key]);
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

  return targets;
}
