import { type1PlannedStrategy, type1UnplannedStrategy } from "../features/type-1";
import { type2PlannedStrategy, type2UnplannedStrategy } from "../features/type-2";
import { type3PlannedStrategy, type3UnplannedStrategy } from "../features/type-3";
import { type4PlannedStrategy, type4UnplannedStrategy } from "../features/type-4";
import { type5PlannedStrategy } from "../features/type-5";
import { type6PlannedStrategy } from "../features/type-6";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "../types/strategy.interface";
import { getWorkTypeCode } from "../constants";

export interface WorkTypeStrategyRegistration {
  code: string;
  name?: string;
  planned: WorkTypeStrategy;
  unplanned: WorkTypeStrategy;
  hasData: (rawData: any) => boolean;
}

/**
 * Central Strategy Registry mapping Work Type Codes (TYPE_1 - TYPE_4)
 * to Planned and Unplanned execution strategies.
 */
export const WORK_TYPE_STRATEGY_REGISTRY: Record<string, WorkTypeStrategyRegistration> = {
  TYPE_1: {
    code: "TYPE_1",
    name: "เข้าพบร้านค้า / Key Farmer",
    planned: type1PlannedStrategy,
    unplanned: type1UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_1") ||
            rawData.workTypeCodes.includes("เข้าพบร้านค้า / Key Farmer"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1")) ||
        (rawData.type1Stores && rawData.type1Stores.length > 0) ||
        (rawData.type1UnplannedItems && rawData.type1UnplannedItems.length > 0) ||
        rawData.targetActualResults ||
        rawData.type1Actual ||
        rawData.discussionResult ||
        rawData.productAdvice ||
        rawData.salesOpportunity
      ),
  },
  TYPE_2: {
    code: "TYPE_2",
    name: "ติดตามผลการใช้สินค้า",
    planned: type2PlannedStrategy,
    unplanned: type2UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_2") ||
            rawData.workTypeCodes.includes("ติดตามผลการใช้สินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_2")) ||
        (rawData.type2Targets && rawData.type2Targets.length > 0) ||
        (rawData.type2UnplannedItems && rawData.type2UnplannedItems.length > 0) ||
        (rawData.followupResults && rawData.followupResults.length > 0) ||
        rawData.t2FollowupResults ||
        rawData.type2Actual
      ),
  },
  TYPE_3: {
    code: "TYPE_3",
    name: "เสนอขายสินค้า",
    planned: type3PlannedStrategy,
    unplanned: type3UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_3") ||
            rawData.workTypeCodes.includes("เสนอขายสินค้า"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_3")) ||
        (rawData.type3Targets && rawData.type3Targets.length > 0) ||
        (rawData.type3Items && rawData.type3Items.length > 0) ||
        (rawData.productSalesDetails && rawData.productSalesDetails.length > 0)
      ),
  },
  TYPE_4: {
    code: "TYPE_4",
    name: "วางบิล / เก็บเงิน",
    planned: type4PlannedStrategy,
    unplanned: type4UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_4") ||
            rawData.workTypeCodes.includes("วางบิล / เก็บเงิน"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_4")) ||
        (rawData.type4Targets && rawData.type4Targets.length > 0) ||
        (rawData.type4Items && rawData.type4Items.length > 0) ||
        rawData.billingStatus ||
        rawData.billingDetail ||
        rawData.collectDetail ||
        rawData.t4OrderNo ||
        rawData.orderNo
      ),
  },
  TYPE_5: {
    code: "TYPE_5",
    name: "สำรวจตลาดของคู่แข่ง",
    planned: type5PlannedStrategy,
    unplanned: type5PlannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_5") ||
            rawData.workTypeCodes.includes("สำรวจตลาดของคู่แข่ง"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_5")) ||
        (rawData.type5Targets && rawData.type5Targets.length > 0) ||
        (rawData.type5Items && rawData.type5Items.length > 0) ||
        (rawData.surveyResults && rawData.surveyResults.length > 0) ||
        (rawData.t5SurveyDetails && rawData.t5SurveyDetails.length > 0) ||
        rawData.competitorBrand ||
        rawData.t5CompetitorBrand
      ),
  },
  TYPE_6: {
    code: "TYPE_6",
    name: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
    planned: type6PlannedStrategy,
    unplanned: type6PlannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_6") ||
            rawData.workTypeCodes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_6")) ||
        (rawData.type6Targets && rawData.type6Targets.length > 0) ||
        (rawData.type6Items && rawData.type6Items.length > 0) ||
        (rawData.issueResults && rawData.issueResults.length > 0) ||
        (rawData.t6IssueDetails && rawData.t6IssueDetails.length > 0) ||
        rawData.t6IssueRecord ||
        rawData.t6ProblemDetail
      ),
  },
};

/**
 * Get strategy for a work type code and plan type
 */
export function getStrategyForWorkType(
  workTypeCodeOrName: string,
  planType: "PLANNED" | "UNPLANNED" | string = "PLANNED"
): WorkTypeStrategy | undefined {
  const code = getWorkTypeCode(workTypeCodeOrName);
  const registration = WORK_TYPE_STRATEGY_REGISTRY[code];
  if (!registration) return undefined;
  return planType === "UNPLANNED" ? registration.unplanned : registration.planned;
}

/**
 * Resolve primary work type code from rawData using registered strategies
 */
export function resolvePrimaryWorkTypeCode(rawData: any): string {
  if (Array.isArray(rawData.workTypeCodes) && rawData.workTypeCodes.length > 0) {
    return getWorkTypeCode(rawData.workTypeCodes[0]);
  }
  if (Array.isArray(rawData.workTypes) && rawData.workTypes.length > 0) {
    return getWorkTypeCode(rawData.workTypes[0]);
  }
  if (rawData.activityTypeId) {
    return getWorkTypeCode(rawData.activityTypeId);
  }

  // Fallback: inspect registered strategies
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_2.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_1.hasData(rawData)) {
    return "TYPE_2";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_3.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_1.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_2.hasData(rawData)) {
    return "TYPE_3";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_4.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_1.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_2.hasData(rawData) && !WORK_TYPE_STRATEGY_REGISTRY.TYPE_3.hasData(rawData)) {
    return "TYPE_4";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_5.hasData(rawData)) {
    return "TYPE_5";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_6.hasData(rawData)) {
    return "TYPE_6";
  }

  return "TYPE_1";
}

/**
 * Validate all active strategies for a plan before database mutations
 */
export async function validateStrategiesForPlan(
  db: any,
  rawData: any
): Promise<StrategyValidationResult> {
  const isUnplanned = rawData.planType === "UNPLANNED";
  for (const registration of Object.values(WORK_TYPE_STRATEGY_REGISTRY)) {
    if (registration.hasData(rawData)) {
      const strategy = isUnplanned ? registration.unplanned : registration.planned;
      if (typeof strategy.validatePlan === "function") {
        const result = await strategy.validatePlan(rawData, db);
        if (result && !result.valid) {
          return result;
        }
      }
    }
  }
  return { valid: true };
}

/**
 * Execute savePlan for all active strategies inside an atomic Prisma transaction
 */
export async function saveStrategiesForPlan(
  tx: PrismaTransaction,
  planId: string,
  rawData: any
): Promise<void> {
  const isUnplanned = rawData.planType === "UNPLANNED";
  for (const registration of Object.values(WORK_TYPE_STRATEGY_REGISTRY)) {
    if (registration.hasData(rawData)) {
      const strategy = isUnplanned ? registration.unplanned : registration.planned;
      await strategy.savePlan(tx, planId, rawData);
    }
  }
}

/**
 * Execute saveActual for all active strategies inside an atomic Prisma transaction
 */
export async function saveStrategiesForActual(
  tx: PrismaTransaction,
  planId: string,
  actualData: any,
  planWorkTypeCodes: string[] = []
): Promise<void> {
  for (const registration of Object.values(WORK_TYPE_STRATEGY_REGISTRY)) {
    const isPlanWorkType = planWorkTypeCodes.some(
      (code) => getWorkTypeCode(code) === registration.code
    );
    if (isPlanWorkType || registration.hasData(actualData)) {
      const strategy = registration.planned;
      if (typeof strategy.saveActual === "function") {
        await strategy.saveActual(tx, planId, actualData);
      }
    }
  }
}

