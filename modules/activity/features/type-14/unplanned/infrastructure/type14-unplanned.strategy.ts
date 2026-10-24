import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType14Data,
  findType14ByPlanId,
} from "../../planned/infrastructure/type14.repository";
import { type14PlannedStrategy } from "../../planned/infrastructure/type14-planned.strategy";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type14UnplannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 14 Unplanned Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawT14 = planData.type14Data || planData.type14;
    const plots =
      planData.type14Plots ||
      rawT14?.plots ||
      [];

    if (!plots || plots.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง (TYPE_14)",
      };
    }

    const firstPlot = plots[0];
    if (!firstPlot.storeId) {
      return {
        valid: false,
        error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค (TYPE_14)",
      };
    }

    if (!firstPlot.name && !firstPlot.plotName) {
      return {
        valid: false,
        error: "กรุณาระบุชื่อแปลงแฮตแทค (TYPE_14)",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 14 Unplanned Data
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawT14 = planData.type14Data || planData.type14;
    const t14Payload =
      rawT14 !== undefined
        ? rawT14
        : planData.type14Plots
          ? {
              mode: "NEW_PLOT",
              plots: planData.type14Plots.map((p: any, idx: number) => ({
                ...p,
                plotIndex: idx + 1,
              })),
            }
          : null;

    if (t14Payload !== undefined) {
      const startDate = planData.startDate
        ? new Date(planData.startDate)
        : new Date();
      await syncType14Data(
        tx,
        activityPlanId,
        t14Payload,
        startDate,
        planData.employeeId || "",
      );
    }
  },

  /**
   * Save actual execution for Type 14 Unplanned
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    if (typeof type14PlannedStrategy.saveActual === "function") {
      await type14PlannedStrategy.saveActual(tx, activityPlanId, actualData);
    }
  },

  /**
   * Load Type 14 Unplanned Data
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType14ByPlanId(activityPlanId);
  },
};

