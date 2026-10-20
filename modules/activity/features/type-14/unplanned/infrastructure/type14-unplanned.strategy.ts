import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType14Data,
  findType14ByPlanId,
} from "../../planned/infrastructure/type14.repository";
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
    const t14Actual = actualData.type14Actual || actualData;
    const rounds: any[] = t14Actual.rounds || t14Actual.sprayRounds || [];

    for (const round of rounds) {
      if (!round.actualVisitDate) continue;

      const visitDate = new Date(round.actualVisitDate);
      const daysSinceStart = round.daysAfterSpray
        ? parseInt(String(round.daysAfterSpray), 10)
        : 0;

      const visits = await tx.demoPlotVisit.findMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_14",
        },
      });

      for (const visit of visits) {
        await tx.demoPlotVisit.update({
          where: { id: visit.id },
          data: {
            visitDate,
            daysSinceStart: isNaN(daysSinceStart) ? 0 : daysSinceStart,
            productResponse:
              round.productResponse || round.trackingResult || "ปกติ",
            productProblemDesc: round.trackingResult || null,
            notes: round.additionalNotes || null,
          },
        });
      }
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
