import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { type3PlannedStrategy } from "../../planned/infrastructure/type3-planned.strategy";

/**
 * Strategy for TYPE_3 Unplanned Activities (กิจกรรมนอกแผน เสนอขายสินค้า 2-in-1)
 * In an unplanned activity, store targets, proposed products, and actual sales results are saved atomically.
 */
export const type3UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_3",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type3PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Targets and Products (into dedicated and generic tables)
    await type3PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. Save Actual Sales Results (if provided in payload)
    const saleResults =
      planData.productSalesDetails ||
      planData.saleResults ||
      planData.t3ProductSalesDetails ||
      [];

    if (saleResults.length > 0) {
      await type3PlannedStrategy.saveActual!(tx, activityPlanId, {
        productSalesDetails: saleResults,
        actualStartDate: planData.startDate,
        actualEndDate: planData.endDate,
        resultStatus: "COMPLETED",
      });
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    return type3PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type3PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type3PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
