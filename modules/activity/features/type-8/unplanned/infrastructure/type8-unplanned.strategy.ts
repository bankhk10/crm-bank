import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type8PlannedStrategy } from "../../planned/infrastructure/type8-planned.strategy";

/**
 * Strategy for TYPE_8 Unplanned Activities (Meeting Organization)
 * In an unplanned meeting activity, meeting plan details and actual meeting execution records
 * (attendance, product sales, registration sheets, atmosphere photos) are saved together 2-in-1.
 */
export const type8UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_8",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type8PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Type 8 Meeting Plan targets, stores, and promotions
    await type8PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If actual outcome passed (2-in-1 unplanned submission), save actual outcome
    if (planData.actualOutcome || planData.actualData) {
      await type8PlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(planData.actualOutcome || planData.actualData),
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type8PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type8PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type8PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
