import type { ActualTargetsState, PlanSummaryData } from "./types";

export const NON_STRICT_OUTCOMES = [
  "PARTIAL",
  "POSTPONED",
  "CANCELLED",
] as const;
export type NonStrictOutcome = (typeof NON_STRICT_OUTCOMES)[number];

export function isNonStrictOutcome(status?: string | null): boolean {
  if (!status) return false;
  return NON_STRICT_OUTCOMES.includes(status as any);
}

export const initialPlanSummary: PlanSummaryData = {
  title: "",
  startDateStr: "",
  timeStr: "",
  locationStr: "",
};

export const initialTargets: ActualTargetsState = {
  t1: {
    customer: "",
    topic: "",
    notes: "",
    opportunity: "",
    nextDate: "",
  },
  t1List: [],
  t2: {
    product: "",
    customer: "",
    detail: "",
    expectedResult: "",
    items: [],
  },
  t3: {
    product: "",
    customer: "",
    targetQty: "",
    targetSales: "",
    items: [],
  },
  t4: {
    customer: "",
    orderNo: "",
    targetCollect: "",
    items: [],
  },
  t5: {
    store: "",
    product: "",
    detail: "",
    items: [],
  },
  t6: {
    customer: "",
    issueType: "",
    detail: "",
    targetStatus: "",
    items: [],
  },
  t7: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t7b: {
    plots: "",
    detail: "",
    items: [],
  },
  t8: {
    topic: "",
    products: "",
    targetAttendees: "",
  },
  t9: {
    store: "",
    isSubDealer: false,
    subDealerStore: "",
    product: "",
    targetSales: "",
    targetAttendees: "",
    items: [],
  },
  t10: {
    plot: "",
    location: "",
    showcase: "",
    targetAttendees: "",
    targetSales: "",
  },
  t11: {
    store: "",
    detail: "",
    targetOpportunity: "",
  },
  t12: {
    tourType: "CENTRAL",
    tourSize: null,
    country: null,
    storeName: null,
    destination: null,
  },
  t13: {
    id: "",
    name: "",
    storeId: "",
    province: "",
    district: "",
    plannedPlotsCount: 0,
    products: [],
  },
  t14: {
    plots: "",
    detail: "",
    items: [],
  },
};
