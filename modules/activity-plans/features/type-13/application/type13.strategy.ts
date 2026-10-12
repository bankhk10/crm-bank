import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import {
  syncType13Data,
  findType13ByPlanId,
} from "@/modules/activity-plans/infrastructure/type-13.repository";

export const type13Strategy: WorkTypeStrategy = {
  code: "TYPE_13",

  /**
   * Validate Type 13 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const type13Data = planData.type13Data;
    const plots = type13Data?.plots || planData.type13Plots || [];

    if (!plots || plots.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุแปลงแฮตแทคอย่างน้อย 1 แปลง",
      };
    }

    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      if (!p.storeId) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาเลือกร้านค้า Dealer`,
        };
      }
      if (!p.province) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาระบุจังหวัด`,
        };
      }
      if (!p.district) {
        return {
          valid: false,
          error: `แปลงที่ ${i + 1}: กรุณาระบุอำเภอ`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 13 Plan targets in dedicated tables (ActivityPlanType13, ActivityPlanType13Plot, ActivityPlanType13Product)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const t13Payload =
      planData.type13Data !== undefined
        ? planData.type13Data
        : planData.type13Plots
          ? {
              plots: planData.type13Plots.map((p: any, idx: number) => ({
                ...p,
                plotIndex: idx + 1,
              })),
            }
          : null;

    if (t13Payload !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      await syncType13Data(
        tx as any,
        activityPlanId,
        t13Payload,
        startDate,
        planData.employeeId || "",
      );
    }
  },

  /**
   * Load Type 13 Plan targets
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType13ByPlanId(activityPlanId);
  },
};
