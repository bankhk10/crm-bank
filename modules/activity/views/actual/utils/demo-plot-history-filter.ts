/**
 * Helper to determine if a demo plot visit is a completed TYPE_7B follow-up.
 *
 * Rules:
 * 1. Work Type identification (Canonical Architecture):
 *    - If activityPlan.workTypes has data -> Primary source: wt.workTypeCode === "TYPE_7B" or wt.activityType?.code === "TYPE_7B"
 *    - Fallback: activityPlan.activityType?.code === "TYPE_7B" (only when workTypes is empty)
 *    - Direct field fallback: v.workTypeCode === "TYPE_7B" (if no activityPlan relation)
 * 2. Execution Status:
 *    - Must be Actual Completed: activityPlan.result?.resultStatus === "COMPLETED"
 */
export function isType7bCompletedFollowUpVisit(v: any): boolean {
  if (!v) return false;

  const plan = v.activityPlan;

  // 1. Work Type Identification
  let isType7B = false;

  if (plan) {
    const workTypes = plan.workTypes || [];
    if (workTypes.length > 0) {
      isType7B = workTypes.some(
        (wt: any) =>
          wt.workTypeCode === "TYPE_7B" ||
          wt.activityType?.code === "TYPE_7B",
      );
    } else {
      isType7B = plan.activityType?.code === "TYPE_7B";
    }
  } else {
    isType7B = v.workTypeCode === "TYPE_7B";
  }

  if (!isType7B) return false;

  // 2. Execution Status: Must be Actual Completed
  if (plan) {
    return plan.result?.resultStatus === "COMPLETED";
  }

  return false;
}

/**
 * Filters and deduplicates completed TYPE_7B follow-up visits.
 * Guarantees that at most 1 visit per activityPlanId is returned.
 */
export function filterCompletedType7bVisits(visits: any[]): any[] {
  if (!visits || !Array.isArray(visits)) return [];
  const filtered = visits.filter(isType7bCompletedFollowUpVisit);
  const seenPlanIds = new Set<string>();
  const unique: any[] = [];
  for (const v of filtered) {
    const planKey = v.activityPlanId || v.activityPlan?.id || v.id;
    if (planKey && seenPlanIds.has(planKey)) {
      continue;
    }
    if (planKey) {
      seenPlanIds.add(planKey);
    }
    unique.push(v);
  }
  return unique;
}

