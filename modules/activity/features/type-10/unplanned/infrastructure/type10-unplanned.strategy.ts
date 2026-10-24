import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { type10PlannedStrategy } from "../../planned/infrastructure/type10-planned.strategy";

/**
 * Strategy for TYPE_10 Unplanned Activities (Field Day Event)
 * In an unplanned field day, field day plan details and actual outcome records
 * are saved together 2-in-1 into activity_type_10_targets, activity_type_10_products,
 * and activity_type_10_result.
 */
export const type10UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_10",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type10PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Type 10 Plan targets, products, and 2-in-1 results per target
    await type10PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If actual outcome passed (top-level 2-in-1 unplanned submission), save actual outcome
    if (planData.actualOutcome || planData.actualData) {
      await type10PlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(planData.actualOutcome || planData.actualData),
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type10PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type10PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type10PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
