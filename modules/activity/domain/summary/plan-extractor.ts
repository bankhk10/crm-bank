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

  // Primary activityType fallback
  if (p.activityType) {
    const primaryTypeName = getWorkTypeName(
      p.activityType.code || p.activityType.name,
    );
    if (primaryTypeName && WORK_TYPES.includes(primaryTypeName)) {
      detectedWorkTypes.add(primaryTypeName);
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

  const resolvedWorkTypes = Array.from(detectedWorkTypes);

  // 2. Extract targets via registry
  const targets = extractPlanTargets(p, resolvedWorkTypes, prevTargets);

  return {
    planSummary,
    resolvedWorkTypes,
    targets,
  };
}
