import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { findType8ByPlanId, saveType8ActualSales } from "./type8.repository";

export const type8PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_8",

  /**
   * Validate Type 8 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type8Stores ||
      (planData.planStores || []).filter(
        (s: any) => s.workTypeCode === "TYPE_8",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName) {
          return {
            valid: false,
            error: `รายการประชุมที่ ${i + 1}: กรุณาระบุร้านค้าหรือสถานที่จัดประชุม`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 8 Plan targets in ActivityPlanStore & ActivityPlanProduct
   */
  async savePlan(
    _tx: PrismaTransaction,
    _activityPlanId: string,
    _planData: any,
  ): Promise<void> {
    // Handled in repository activityPlanStore and activityPlanProduct sync
  },

  /**
   * Save Type 8 Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    if (
      actualData.productSalesDetails &&
      Array.isArray(actualData.productSalesDetails)
    ) {
      await saveType8ActualSales(tx, resultId, actualData.productSalesDetails);
    }
  },

  /**
   * Load Type 8 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType8ByPlanId(activityPlanId, db);
  },
};

// Backward-compatible alias
export const type8Strategy = type8PlannedStrategy;
