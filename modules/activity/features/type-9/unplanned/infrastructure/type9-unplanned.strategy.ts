import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type9PlannedStrategy } from "../../planned/infrastructure/type9-planned.strategy";

/**
 * Strategy for TYPE_9 Unplanned Activities (Store Event / Sales Promotion)
 * In an unplanned store event, store promotion plan details and actual sales records
 * are saved together 2-in-1.
 */
export const type9UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_9",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type9PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Type 9 Plan targets and stores
    await type9PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If actual outcome passed (2-in-1 unplanned submission), save actual outcome
    if (planData.actualOutcome || planData.actualData) {
      await type9PlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(planData.actualOutcome || planData.actualData),
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type9PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type9PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type9PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
