import { type1PlannedStrategy, type1UnplannedStrategy } from "../features/type-1";
import { type2PlannedStrategy, type2UnplannedStrategy } from "../features/type-2";
import { type3PlannedStrategy, type3UnplannedStrategy } from "../features/type-3";
import { type4PlannedStrategy, type4UnplannedStrategy } from "../features/type-4";
import { type5PlannedStrategy, type5UnplannedStrategy } from "../features/type-5";
import { type6PlannedStrategy, type6UnplannedStrategy } from "../features/type-6";
import { type7aPlannedStrategy, type7aUnplannedStrategy } from "../features/type-7a";
import { type7bPlannedStrategy, type7bUnplannedStrategy } from "../features/type-7b";
import { type8PlannedStrategy, type8UnplannedStrategy } from "../features/type-8";
import { type9PlannedStrategy, type9UnplannedStrategy } from "../features/type-9";
import { type10PlannedStrategy, type10UnplannedStrategy } from "../features/type-10";
import { type11PlannedStrategy, type11UnplannedStrategy } from "../features/type-11";
import { type12PlannedStrategy, type12UnplannedStrategy } from "../features/type-12";
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
 * Central Strategy Registry mapping Work Type Codes (TYPE_1 - TYPE_6)
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
    unplanned: type5UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_5") ||
            rawData.workTypeCodes.includes("สำรวจตลาดของคู่แข่ง"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_5")) ||
        (rawData.type5Targets && rawData.type5Targets.length > 0) ||
        (rawData.type5Items && rawData.type5Items.length > 0) ||
        (rawData.type5UnplannedItems && rawData.type5UnplannedItems.length > 0) ||
        (rawData.type5SurveyRecords && rawData.type5SurveyRecords.length > 0) ||
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
    unplanned: type6UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_6") ||
            rawData.workTypeCodes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_6")) ||
        (rawData.type6Targets && rawData.type6Targets.length > 0) ||
        (rawData.type6Items && rawData.type6Items.length > 0) ||
        (rawData.type6UnplannedItems && rawData.type6UnplannedItems.length > 0) ||
        (rawData.type6ActualIssues && rawData.type6ActualIssues.length > 0) ||
        (rawData.issueResults && rawData.issueResults.length > 0) ||
        (rawData.t6IssueDetails && rawData.t6IssueDetails.length > 0) ||
        rawData.t6IssueRecord ||
        rawData.t6ProblemDetail
      ),
  },
  TYPE_7A: {
    code: "TYPE_7A",
    name: "จัดทำแปลงสาธิต",
    planned: type7aPlannedStrategy,
    unplanned: type7aUnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_7A") ||
            rawData.workTypeCodes.includes("จัดทำแปลงสาธิต"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_7A" || s.workTypeCode === "TYPE_7")) ||
        (rawData.type7aPlots && rawData.type7aPlots.length > 0) ||
        (rawData.type7aUnplannedItems && rawData.type7aUnplannedItems.length > 0) ||
        rawData.demoPlotData ||
        rawData.t7PlotName
      ),
  },
  TYPE_7B: {
    code: "TYPE_7B",
    name: "ติดตามแปลงสาธิต",
    planned: type7bPlannedStrategy,
    unplanned: type7bUnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_7B") ||
            rawData.workTypeCodes.includes("ติดตามแปลงสาธิต"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_7B")) ||
        (rawData.type7bPlots && rawData.type7bPlots.length > 0) ||
        (rawData.type7bUnplannedItems && rawData.type7bUnplannedItems.length > 0) ||
        rawData.type7bData ||
        rawData.type7b ||
        rawData.t7GrowthStage
      ),
  },
  TYPE_8: {
    code: "TYPE_8",
    name: "จัดประชุม",
    planned: type8PlannedStrategy,
    unplanned: type8UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_8") ||
            rawData.workTypeCodes.includes("จัดประชุม"))) ||
        (rawData.planStores &&
          rawData.planStores.some((s: any) => s.workTypeCode === "TYPE_8")) ||
        (rawData.type8Meetings && rawData.type8Meetings.length > 0) ||
        (rawData.type8UnplannedItems && rawData.type8UnplannedItems.length > 0) ||
        (rawData.type8Items && rawData.type8Items.length > 0) ||
        rawData.type8Data ||
        rawData.type8 ||
        rawData.type8Actual ||
        rawData.t8Topic ||
        rawData.t8MeetingTarget
      ),
  },
  TYPE_9: {
    code: "TYPE_9",
    name: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    planned: type9PlannedStrategy,
    unplanned: type9UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_9") ||
            rawData.workTypeCodes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน"))) ||
        (rawData.planStores &&
          rawData.planStores.some(
            (s: any) =>
              s.workTypeCode === "TYPE_9" ||
              s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          )) ||
        (rawData.type9Stores && rawData.type9Stores.length > 0) ||
        (rawData.type9UnplannedItems && rawData.type9UnplannedItems.length > 0) ||
        rawData.type9Data ||
        rawData.type9 ||
        rawData.type9Actual ||
        rawData.t9ActualSales
      ),
  },
  TYPE_10: {
    code: "TYPE_10",
    name: "จัดงาน Field Day",
    planned: type10PlannedStrategy,
    unplanned: type10UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_10") ||
            rawData.workTypeCodes.includes("จัดงาน Field Day"))) ||
        (rawData.planStores &&
          rawData.planStores.some(
            (s: any) =>
              s.workTypeCode === "TYPE_10" ||
              s.workTypeCode === "จัดงาน Field Day",
          )) ||
        (rawData.type10Plots && rawData.type10Plots.length > 0) ||
        (rawData.type10UnplannedItems && rawData.type10UnplannedItems.length > 0) ||
        rawData.type10Data ||
        rawData.type10 ||
        rawData.type10Actual ||
        rawData.t10TargetAttendees ||
        rawData.t10ActualAttendees ||
        rawData.t10SalesResult
      ),
  },
  TYPE_11: {
    code: "TYPE_11",
    name: "ตรวจเช็คสต๊อกหน้าร้าน",
    planned: type11PlannedStrategy,
    unplanned: type11UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_11") ||
            rawData.workTypeCodes.includes("ตรวจเช็คสต๊อกหน้าร้าน"))) ||
        (rawData.planStores &&
          rawData.planStores.some(
            (s: any) =>
              s.workTypeCode === "TYPE_11" ||
              s.workTypeCode === "ตรวจเช็คสต๊อกหน้าร้าน",
          )) ||
        (rawData.type11Stores && rawData.type11Stores.length > 0) ||
        (rawData.type11UnplannedItems && rawData.type11UnplannedItems.length > 0) ||
        rawData.type11Data ||
        rawData.type11 ||
        rawData.type11Actual ||
        (rawData.t11StockItems && rawData.t11StockItems.length > 0) ||
        (rawData.stockResults && rawData.stockResults.length > 0) ||
        rawData.t11ProductList ||
        rawData.t11RemainingQty
      ),
  },
  TYPE_12: {
    code: "TYPE_12",
    name: "พาลูกค้าศึกษาดูงาน (ทัวร์)",
    planned: type12PlannedStrategy,
    unplanned: type12UnplannedStrategy,
    hasData: (rawData: any): boolean =>
      Boolean(
        (rawData.workTypeCodes &&
          (rawData.workTypeCodes.includes("TYPE_12") ||
            rawData.workTypeCodes.includes("พาลูกค้าศึกษาดูงาน (ทัวร์)") ||
            rawData.workTypeCodes.includes("ทัวร์"))) ||
        rawData.tour ||
        rawData.tourData ||
        rawData.type12Actual ||
        rawData.t12Actual ||
        (rawData.t12Images && rawData.t12Images.length > 0)
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
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_7A.hasData(rawData)) {
    return "TYPE_7A";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_7B.hasData(rawData)) {
    return "TYPE_7B";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_8.hasData(rawData)) {
    return "TYPE_8";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_9.hasData(rawData)) {
    return "TYPE_9";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_10.hasData(rawData)) {
    return "TYPE_10";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_11.hasData(rawData)) {
    return "TYPE_11";
  }
  if (WORK_TYPE_STRATEGY_REGISTRY.TYPE_12.hasData(rawData)) {
    return "TYPE_12";
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

