import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type6PlannedStrategy } from "../../planned/infrastructure/type6-planned.strategy";

/**
 * Strategy for TYPE_6 Unplanned Activities (Issue Complaint & Problem Solving)
 * In an unplanned activity, issue complaints targets and actual issue investigation results
 * (lot number, purchase channel, evidence photos, status) are saved together.
 */
export const type6UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_6",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type6PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Targets & Stores
    await type6PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If unplanned items have actual outcome (lotNumber, evidence photos, etc.), save actual outcome as well
    const items =
      planData.type6ActualIssues ||
      planData.targetActualResults ||
      planData.type6UnplannedItems ||
      planData.unplannedItems ||
      [];

    if (items.length > 0) {
      await type6PlannedStrategy.saveActual!(tx, activityPlanId, {
        issueResults: items,
        type6ActualIssues: items,
        targetActualResults: items,
        attachments:
          planData.attachments ||
          planData.actualData?.attachments ||
          [],
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type6PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type6PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type6PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
