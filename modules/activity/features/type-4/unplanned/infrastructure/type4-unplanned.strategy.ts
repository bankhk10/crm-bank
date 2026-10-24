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
    // 1. Save Plan Targets (into dedicated activity_type_4_targets table)
    await type4PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. Save Actual Billing & Collection Results (if provided in payload)
    const t4Result =
      planData.type4Result ||
      planData.type4Results ||
      planData.result ||
      planData.type4ActualData ||
      planData.actualData?.type4Result;

    const t4Items =
      planData.type4Results ||
      planData.type4ActualItems ||
      planData.items ||
      planData.t4Items ||
      planData.actualData?.type4Results ||
      planData.actualData?.items ||
      planData.actualData?.t4Items ||
      (Array.isArray(t4Result) ? t4Result : t4Result?.items) ||
      (Array.isArray(planData.type4Items) &&
      planData.type4Items.length > 0 &&
      (planData.type4Items[0]?.companyName || planData.type4Items[0]?.customerName || planData.type4Items[0]?.customer)
        ? planData.type4Items
        : undefined);

    const attachments =
      planData.attachments ||
      planData.actualData?.attachments ||
      planData.type4PaymentImages ||
      [];

    if (t4Result || t4Items || planData.items || planData.type4Results || planData.actualData) {
      await type4PlannedStrategy.saveActual!(tx, activityPlanId, {
        type4Result: t4Result,
        type4Results: t4Items,
        items: t4Items,
        t4Items,
        companyItems: t4Items,
        receivedAmount: t4Result?.receivedAmount ?? planData.receivedAmount,
        notes: t4Result?.notes ?? planData.notes,
        attachments,
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
