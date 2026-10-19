import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type1PlannedStrategy } from "../../planned/infrastructure/type1-planned.strategy";

/**
 * Strategy for TYPE_1 Unplanned Activities
 * In an unplanned activity, stores and actual results are saved together.
 */
export const type1UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_1",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type1PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Stores
    await type1PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If unplanned items have actual outcome (discussionResult, etc.), save actual outcome as well
    const items =
      planData.type1UnplannedItems ||
      planData.unplannedItems ||
      planData.items ||
      [];

    if (items.length > 0) {
      await type1PlannedStrategy.saveActual!(tx, activityPlanId, {
        targetActualResults: items,
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type1PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type1PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type1PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
