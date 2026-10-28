import { ActivityResultStatus } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { syncType13Data, findType13ByPlanId } from "../../planned/infrastructure/type13.repository";
import { type13PlannedStrategy } from "../../planned/infrastructure/type13-planned.strategy";
import { WORK_TYPE_CODE } from "../../shared/constants";
import { mapType13UnplannedToPayload } from "../application/unplanned-mapper";
import { validateType13UnplannedItems } from "../application/unplanned-validation";

export const type13UnplannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 13 Unplanned Plan Data (2-in-1 Plan setup + Actual execution)
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawT13 = planData.type13Data || planData.type13;
    const plots =
      planData.type13UnplannedItems ||
      planData.type13Plots ||
      rawT13?.plots ||
      planData.type13Targets ||
      [];

    const validation = validateType13UnplannedItems(plots);
    if (!validation.isValid) {
      return {
        valid: false,
        error: validation.error || "ข้อมูลการฉีดแปลงแฮตแทคไม่ถูกต้อง (Type 13)",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 13 Unplanned Data (Targets, Products, Actual Results, Spray Rounds, Spray Products, Attachments, and Header Result)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawT13 = planData.type13Data || planData.type13;
    const plots =
      planData.type13Plots ||
      rawT13?.plots ||
      planData.type13Targets ||
      planData.type13UnplannedItems ||
      [];

    const startDate = planData.startDate
      ? new Date(planData.startDate)
      : new Date();

    const t13Payload =
      rawT13 !== undefined
        ? rawT13
        : plots.length > 0
          ? {
              plots: plots.map((p: any, idx: number) => ({
                ...p,
                plotIndex: idx + 1,
              })),
            }
          : null;

    // 1. Save Target & Product records
    if (t13Payload !== null) {
      await syncType13Data(
        tx,
        activityPlanId,
        t13Payload,
        startDate,
        planData.employeeId || "",
      );
    }

    // 2. Prepare actual execution payload
    let actualPayload =
      planData.type13Actual ||
      planData.actualData?.type13Actual ||
      (planData.actualData?.workTypeCode === WORK_TYPE_CODE ? planData.actualData : null);

    if (!actualPayload) {
      if (planData.type13UnplannedItems && planData.type13UnplannedItems.length > 0) {
        actualPayload = mapType13UnplannedToPayload(planData.type13UnplannedItems).type13Actual;
      } else if (plots.length > 0) {
        actualPayload = mapType13UnplannedToPayload(plots).type13Actual;
      }
    }

    // 3. Save Actual Outcome (ActivityResultType13, SprayRounds, SprayProducts, Attachments)
    if (actualPayload && typeof type13PlannedStrategy.saveActual === "function") {
      await type13PlannedStrategy.saveActual(tx, activityPlanId, actualPayload);
    }

    // 4. Ensure header ActivityResult exists and record demoPlotsCreated
    const effectivePlots = actualPayload?.plots || t13Payload?.plots || plots || [];
    const totalActualPlots = effectivePlots.reduce(
      (sum: number, p: any) => sum + (Number(p.actualPlotsCount) || 1),
      0,
    );

    const endDate = planData.endDate ? new Date(planData.endDate) : startDate;

    await (tx as any).activityResult.upsert({
      where: { activityPlanId },
      create: {
        activityPlanId,
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
        demoPlotsCreated: totalActualPlots || 1,
      },
      update: {
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
        demoPlotsCreated: totalActualPlots || 1,
      },
    });
  },

  /**
   * Save Type 13 Unplanned Actual Data
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    if (typeof type13PlannedStrategy.saveActual === "function") {
      await type13PlannedStrategy.saveActual(tx, activityPlanId, actualData);
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
