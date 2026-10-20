import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { findType9ByPlanId, saveType9ActualSales } from "./type9.repository";

export const type9PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_9",

  /**
   * Validate Type 9 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type9Stores ||
      (planData.planStores || []).filter(
        (s: any) =>
          s.workTypeCode === "TYPE_9" ||
          s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName) {
          return {
            valid: false,
            error: `รายการกิจกรรมหน้าร้านที่ ${i + 1}: กรุณาระบุร้านค้าหลักหรือชื่อร้าน Sub Dealer`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 9 Plan targets in ActivityPlanStore & ActivityPlanProduct
   */
  async savePlan(
    _tx: PrismaTransaction,
    _activityPlanId: string,
    _planData: any,
  ): Promise<void> {
    // Handled in repository activityPlanStore and activityPlanProduct sync
  },

  /**
   * Save Type 9 Actual outcome data
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
      await saveType9ActualSales(tx, resultId, actualData.productSalesDetails);
    }
  },

  /**
   * Load Type 9 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType9ByPlanId(activityPlanId, db);
  },
};

// Backward-compatible alias
export const type9Strategy = type9PlannedStrategy;
