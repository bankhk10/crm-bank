import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "../../../../types/strategy.interface";
import { WORK_TYPE_CODE } from "../../shared/constants";
import { validateType14FormValues } from "../application/planned-validation";
import { syncType14Data } from "./type14.repository";
import { Prisma } from "@prisma/client";

export const type14PlannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawT14 = planData.type14Data || planData.type14;
    if (!rawT14) {
      return { valid: true };
    }
    const valResult = validateType14FormValues(rawT14);
    if (!valResult.isValid) {
      return {
        valid: false,
        error: valResult.error || "ข้อมูลติดตามแปลงแฮตแทคไม่ถูกต้อง (TYPE_14)",
      };
    }
    return { valid: true };
  },

  async savePlan(
    tx: PrismaTransaction,
    planId: string,
    planData: any,
  ): Promise<void> {
    const rawT14 = planData.type14Data || planData.type14;
    const startDate = planData.startDate
      ? new Date(planData.startDate)
      : new Date();

    if (rawT14) {
      await syncType14Data(tx, planId, rawT14, startDate);
    }
  },

  async saveActual(
    tx: PrismaTransaction,
    planId: string,
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

      // Link to existing DemoPlotVisits for this activity plan
      const visits = await tx.demoPlotVisit.findMany({
        where: {
          activityPlanId: planId,
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
};

export const type14Strategy = type14PlannedStrategy;
