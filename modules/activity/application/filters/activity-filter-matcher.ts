import {
  getWorkTypeCode,
  resolveWorkTypeCode,
} from "../../constants";

export interface ActivityFilterCriteria {
  workTypes?: string[];
  personIds?: string[];
  statuses?: string[];
  searchQuery?: string;
}

/**
 * Predicate: Checks if the activity item matches the given work types (OR within filter)
 */
export function matchesWorkTypes(item: any, selectedWorkTypes: string[]): boolean {
  if (!selectedWorkTypes || selectedWorkTypes.length === 0) return true;

  const selectedNormalized = selectedWorkTypes.map(
    (wt) => getWorkTypeCode(wt) || wt.toUpperCase(),
  );

  const itemCodes = new Set<string>();

  // 1. Plan workTypes
  const planWorkTypes = item.activityPlan?.workTypes || item.workTypes;
  if (Array.isArray(planWorkTypes)) {
    for (const wt of planWorkTypes) {
      const rawCode =
        wt.workTypeCode || wt.activityType?.code || resolveWorkTypeCode(wt);
      if (rawCode) {
        const canonical = getWorkTypeCode(rawCode) || rawCode;
        itemCodes.add(canonical.toUpperCase());
      }
      if (wt.activityTypeId) itemCodes.add(wt.activityTypeId);
      if (wt.activityType?.id) itemCodes.add(wt.activityType.id);
    }
  }

  // 2. Primary activityType
  const primaryType = item.activityPlan?.activityType || item.activityType;
  if (primaryType) {
    const rawCode =
      typeof primaryType === "string"
        ? resolveWorkTypeCode(primaryType)
        : primaryType.code || resolveWorkTypeCode(primaryType);
    if (rawCode) {
      const canonical = getWorkTypeCode(rawCode) || rawCode;
      itemCodes.add(canonical.toUpperCase());
    }
    if (primaryType.id) itemCodes.add(primaryType.id);
  }

  // 3. Direct activityTypeId
  const actTypeId = item.activityPlan?.activityTypeId || item.activityTypeId;
  if (actTypeId) {
    itemCodes.add(actTypeId);
    const canonical = resolveWorkTypeCode(actTypeId);
    if (canonical) itemCodes.add(canonical.toUpperCase());
  }

  // 4. Tour (TYPE_12)
  if (item.tour || item.activityPlan?.tour) {
    itemCodes.add("TYPE_12");
  }

  for (let i = 0; i < selectedWorkTypes.length; i++) {
    const orig = selectedWorkTypes[i];
    const norm = selectedNormalized[i];
    if (
      itemCodes.has(orig) ||
      itemCodes.has(orig.toUpperCase()) ||
      itemCodes.has(norm)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Predicate: Checks if the activity item matches the given employee / person IDs (OR within filter)
 */
export function matchesAssignedPerson(item: any, personIds: string[]): boolean {
  if (!personIds || personIds.length === 0) return true;

  const itemPersonIds = new Set<string>();

  if (item.employeeId) itemPersonIds.add(item.employeeId);
  if (item.employee?.id) itemPersonIds.add(item.employee.id);
  if (item.createdById) itemPersonIds.add(item.createdById);
  if (item.activityPlan?.employeeId)
    itemPersonIds.add(item.activityPlan.employeeId);
  if (item.activityPlan?.employee?.id)
    itemPersonIds.add(item.activityPlan.employee.id);

  // Helpers in ActivityPlan
  const helpers = item.activityPlan?.helpers || item.helpers;
  if (Array.isArray(helpers)) {
    for (const h of helpers) {
      if (h.employeeId) itemPersonIds.add(h.employeeId);
      if (h.employee?.id) itemPersonIds.add(h.employee.id);
    }
  }

  // Attendees in ActivityCalendarEvent
  if (Array.isArray(item.attendees)) {
    for (const att of item.attendees) {
      if (att.employeeId) itemPersonIds.add(att.employeeId);
      if (att.employee?.id) itemPersonIds.add(att.employee.id);
    }
  }

  for (const pid of personIds) {
    if (itemPersonIds.has(pid)) return true;
  }

  return false;
}

/**
 * Predicate: Checks if the activity item matches the given statuses (OR within filter)
 */
export function matchesPlanStatus(item: any, statuses: string[]): boolean {
  if (!statuses || statuses.length === 0) return true;

  const planStatus = item.activityPlan?.status || item.status;
  const resultStatus =
    item.activityPlan?.result?.resultStatus || item.result?.resultStatus;
  const eventStatus = item.status; // CalendarEventStatus

  for (const s of statuses) {
    if (s === "CANCELLED") {
      if (
        planStatus === "CANCELLED" ||
        eventStatus === "CANCELLED" ||
        resultStatus === "CANCELLED"
      ) {
        return true;
      }
    } else if (["COMPLETED", "PARTIAL", "POSTPONED", "FAILED"].includes(s)) {
      if (
        resultStatus === s ||
        (s === "COMPLETED" && eventStatus === "COMPLETED")
      ) {
        return true;
      }
    } else if (s === "APPROVED") {
      if (
        planStatus === "APPROVED" ||
        (eventStatus === "SCHEDULED" && planStatus !== "CANCELLED")
      ) {
        return true;
      }
    } else {
      if (planStatus === s || eventStatus === s) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Predicate: Checks if the activity item matches keyword query in title, code, location, or employee
 */
export function matchesSearchText(item: any, searchQuery?: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const q = searchQuery.trim().toLowerCase();
  const title = (item.title || item.activityPlan?.title || "").toLowerCase();
  const code = (
    item.code ||
    item.activityPlan?.code ||
    item.planNo ||
    ""
  ).toLowerCase();
  const loc = (
    item.location ||
    item.activityPlan?.location ||
    ""
  ).toLowerCase();
  const empName = (
    item.employee?.name ||
    item.activityPlan?.employee?.name ||
    ""
  ).toLowerCase();

  return (
    title.includes(q) ||
    code.includes(q) ||
    loc.includes(q) ||
    empName.includes(q)
  );
}

/**
 * Shared filter evaluation function for Activity Plans and Activity Calendar Events.
 * Evaluates:
 * - workTypes (OR)
 * - personIds (OR)
 * - statuses (OR)
 * - searchQuery (Substring match)
 * Combined with AND across categories.
 */
export function matchesActivityFilters(
  item: any,
  filters: ActivityFilterCriteria,
): boolean {
  if (!item) return false;

  if (filters.workTypes && filters.workTypes.length > 0) {
    if (!matchesWorkTypes(item, filters.workTypes)) return false;
  }

  if (filters.personIds && filters.personIds.length > 0) {
    if (!matchesAssignedPerson(item, filters.personIds)) return false;
  }

  if (filters.statuses && filters.statuses.length > 0) {
    if (!matchesPlanStatus(item, filters.statuses)) return false;
  }

  if (filters.searchQuery && filters.searchQuery.trim()) {
    if (!matchesSearchText(item, filters.searchQuery)) return false;
  }

  return true;
}
