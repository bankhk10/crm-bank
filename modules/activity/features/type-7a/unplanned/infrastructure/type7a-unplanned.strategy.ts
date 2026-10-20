import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type7aPlannedStrategy } from "../../planned/infrastructure/type7a-planned.strategy";

/**
 * Strategy for TYPE_7A Unplanned Activities (Demo Plot Establishment)
 * In an unplanned activity, DemoPlot creation, target products, and on-the-spot establishment photos
 * are saved together.
 */
export const type7aUnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_7A",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type7aPlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save DemoPlot & Plan Targets
    await type7aPlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If actual outcome passed, save actual outcome
    if (planData.actualOutcome || planData.actualData) {
      await type7aPlannedStrategy.saveActual!(tx, activityPlanId, {
        ...(planData.actualOutcome || planData.actualData),
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type7aPlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type7aPlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type7aPlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
