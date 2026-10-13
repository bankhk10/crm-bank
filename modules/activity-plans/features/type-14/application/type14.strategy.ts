import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import {
  syncType14Data,
  findType14ByPlanId,
} from "../infrastructure/type-14.repository";
import { validateType14FormValues } from "./validation";

export const type14Strategy: WorkTypeStrategy = {
  code: "TYPE_14",

  /**
   * Validate Type 14 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    if (planData.type14Data) {
      const result = validateType14FormValues({
        selectedWorkTypes: planData.workTypeCodes || ["TYPE_14"],
        type14Data: planData.type14Data,
      });

      if (!result.isValid) {
        return {
          valid: false,
          error: result.error || "ข้อมูลแผนงานติดตามแปลงแฮทแทคไม่ถูกต้อง",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 14 Plan targets in dedicated tables (ActivityPlanType14, ActivityPlanType14Plot, ActivityPlanType14Product)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const t14Payload = planData.type14Data;
    if (t14Payload !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      await syncType14Data(
        tx as any,
        activityPlanId,
        t14Payload,
        startDate,
        planData.employeeId || "",
      );
    }
  },

  /**
   * Load Type 14 Plan targets
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType14ByPlanId(activityPlanId);
  },
};
