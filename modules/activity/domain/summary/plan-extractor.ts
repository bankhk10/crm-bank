import type { ActivityPlanWithRelations } from "../../types";
import { WORK_TYPES, getWorkTypeName, getWorkTypeCode } from "../../constants";
import type { ActualTargetsState, ExtractedPlanData } from "./types";
import { initialTargets } from "./constants";
import { extractCorePlanSummary } from "./plan-summary-extractor";
import { extractPlanTargets } from "./plan-targets-registry";

/**
 * Main Plan Data Extractor
 * Combines core plan summary with type-specific targets.
 */
export function extractPlanData(
  p: ActivityPlanWithRelations,
  prevTargets: ActualTargetsState = initialTargets,
): ExtractedPlanData {
  const planSummary = extractCorePlanSummary(p);

  // 1. Detect ALL selected work types from normalized relations
  const detectedWorkTypes = new Set<string>();

  if (p.workTypes && Array.isArray(p.workTypes) && p.workTypes.length > 0) {
    for (const wt of p.workTypes) {
      const typeName = getWorkTypeName(
        wt.activityType?.code || wt.activityType?.name || wt.activityTypeId,
      );
      if (typeName && WORK_TYPES.includes(typeName)) {
        detectedWorkTypes.add(typeName);
      }
    }
  }

  // Primary activityType fallback: add only if no workTypes detected or if it matches one of the explicit workTypes
  if (p.activityType) {
    const primaryTypeName = getWorkTypeName(
      p.activityType.code || p.activityType.name,
    );
    if (primaryTypeName && WORK_TYPES.includes(primaryTypeName)) {
      if (detectedWorkTypes.size === 0) {
        detectedWorkTypes.add(primaryTypeName);
      } else {
        const primaryCode = getWorkTypeCode(
          p.activityType.code || p.activityType.name,
        );
        const matchesWorkTypes = p.workTypes?.some(
          (wt: any) =>
            getWorkTypeCode(
              wt.activityType?.code ||
                wt.activityType?.name ||
                wt.activityTypeId,
            ) === primaryCode,
        );
        if (matchesWorkTypes) {
          detectedWorkTypes.add(primaryTypeName);
        }
      }
    }
  }

  // Type 1 fallback if real store targets exist, or only if no other work types detected
  if ((p as any).type1Targets && (p as any).type1Targets.length > 0) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_1"));
  } else if ((p as any).type1Stores && (p as any).type1Stores.length > 0) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_1"));
  } else if (p.type1Results && p.type1Results.length > 0 && detectedWorkTypes.size === 0) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_1"));
  }

  // Type 7A fallback if relation exists
  if (
    ((p as any).type7aTargets && (p as any).type7aTargets.length > 0) ||
    ((p as any).type7aPlots && (p as any).type7aPlots.length > 0)
  ) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_7A"));
  } else if (
    (p as any).type7aResults &&
    (p as any).type7aResults.length > 0 &&
    detectedWorkTypes.size === 0
  ) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_7A"));
  }

  // Type 7B fallback if relation exists
  if (
    ((p as any).type7bTargets && (p as any).type7bTargets.length > 0) ||
    ((p as any).type7bPlots && (p as any).type7bPlots.length > 0)
  ) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_7B"));
  } else if (
    (p as any).type7bResults &&
    (p as any).type7bResults.length > 0 &&
    detectedWorkTypes.size === 0
  ) {
    detectedWorkTypes.add(getWorkTypeName("TYPE_7B"));
  }

  const resolvedWorkTypes = Array.from(detectedWorkTypes);

  // 2. Extract targets via registry
  const targets = extractPlanTargets(p, resolvedWorkTypes, prevTargets);

  return {
    planSummary,
    resolvedWorkTypes,
    targets,
  };
}
