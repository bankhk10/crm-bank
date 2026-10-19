import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type2PlannedStrategy } from "../../planned/infrastructure/type2-planned.strategy";

/**
 * Strategy for TYPE_2 Unplanned Activities
 * In an unplanned activity, targets, products, and followup feedback are saved atomically.
 */
export const type2UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_2",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type2PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Targets and Products
    await type2PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. Save Followup Results (if provided in payload)
    const followupResults =
      planData.followupResults ||
      planData.t2FollowupResults ||
      [];

    const attachments =
      planData.actualData?.attachments ||
      planData.attachments ||
      [];

    if (followupResults.length > 0 || attachments.length > 0) {
      await type2PlannedStrategy.saveActual!(tx, activityPlanId, {
        followupResults,
        attachments,
        actualStartDate: planData.startDate,
        actualEndDate: planData.endDate,
        resultStatus: "COMPLETED",
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    return type2PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type2PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type2PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
