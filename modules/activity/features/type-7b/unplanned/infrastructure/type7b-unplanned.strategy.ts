import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type7bPlannedStrategy } from "../../planned/infrastructure/type7b-planned.strategy";

/**
 * Strategy for TYPE_7B Unplanned Activities (Demo Plot Follow-up)
 * In an unplanned follow-up activity, demo plot visit records and actual follow-up evaluations
 * are saved together.
 */
export const type7bUnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_7B",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type7bPlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Type 7B Plan targets & visits
    await type7bPlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If actual outcome passed, save actual outcome
    const actualOutcomePayload =
      planData.actualOutcome ||
      planData.actualData?.actualOutcome ||
      planData.actualData ||
      planData.type7bActual;

    if (actualOutcomePayload) {
      const resolvedType7bActual =
        planData.type7bActual ||
        planData.actualOutcome?.type7bActual ||
        planData.actualData?.actualOutcome?.type7bActual ||
        planData.actualData?.type7bActual ||
        actualOutcomePayload.type7bActual ||
        actualOutcomePayload;

      await type7bPlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(typeof actualOutcomePayload === "object" ? actualOutcomePayload : {}),
        ...(planData.actualData && typeof planData.actualData === "object"
          ? planData.actualData
          : {}),
        type7bActual: resolvedType7bActual,
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type7bPlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type7bPlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type7bPlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
