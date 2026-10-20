import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type4PlannedStrategy } from "../../planned/infrastructure/type4-planned.strategy";

/**
 * Strategy for TYPE_4 Unplanned Activities (กิจกรรมนอกแผน วางบิล / เก็บเงิน 2-in-1)
 * In an unplanned activity, store targets and actual billing/collection results are saved atomically.
 */
export const type4UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_4",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type4PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Targets (into dedicated and generic tables)
    await type4PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. Save Actual Billing & Collection Results (if provided in payload)
    const t4Result =
      planData.type4Result ||
      planData.result ||
      planData.type4ActualData;

    if (t4Result || planData.items) {
      await type4PlannedStrategy.saveActual!(tx, activityPlanId, {
        type4Result: t4Result,
        items: planData.items,
        receivedAmount: t4Result?.receivedAmount ?? planData.receivedAmount,
        actualStartDate: planData.startDate,
        actualEndDate: planData.endDate,
        resultStatus: "COMPLETED",
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    return type4PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type4PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type4PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
