import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type5PlannedStrategy } from "../../planned/infrastructure/type5-planned.strategy";

/**
 * Strategy for TYPE_5 Unplanned Activities (Competitor Market Survey)
 * In an unplanned activity, survey targets and actual survey results with 4-tier pricing & photos
 * are saved together.
 */
export const type5UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_5",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type5PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Targets & Stores
    await type5PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If unplanned items have actual outcome (prices, competitorBrand, etc.), save actual outcome as well
    const items =
      planData.type5SurveyRecords ||
      planData.targetActualResults ||
      planData.type5UnplannedItems ||
      planData.unplannedItems ||
      [];

    if (items.length > 0) {
      await type5PlannedStrategy.saveActual!(tx, activityPlanId, {
        surveyResults: items,
        t5SurveyDetails: items,
        targetActualResults: items,
        type5SurveyRecords: items,
        attachments:
          planData.attachments ||
          planData.actualData?.attachments ||
          [],
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type5PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type5PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type5PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
