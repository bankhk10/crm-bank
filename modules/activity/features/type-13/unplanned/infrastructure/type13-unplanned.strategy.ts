import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { syncType13Data, findType13ByPlanId } from "../../planned/infrastructure/type13.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type13UnplannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 13 Unplanned Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const plots = planData.type13Plots || planData.type13Data?.plots || [];

    if (!plots || plots.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง",
      };
    }

    const firstPlot = plots[0];
    if (!firstPlot.storeId) {
      return {
        valid: false,
        error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค",
      };
    }

    if (!firstPlot.name && !firstPlot.plotName) {
      return {
        valid: false,
        error: "กรุณาระบุชื่อแปลงแฮตแทค",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 13 Unplanned Data
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
        tx,
        activityPlanId,
        t13Payload,
        startDate,
        planData.employeeId || "",
      );
    }
  },

  /**
   * Load Type 13 Unplanned Data
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType13ByPlanId(activityPlanId);
  },
};
