import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import {
  syncType7bData,
  findType7bByPlanId,
} from "@/modules/activity-plans/infrastructure/type-7b.repository";

export const type7bStrategy: WorkTypeStrategy = {
  code: "TYPE_7B",

  /**
   * Validate Type 7B Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const type7bData = planData.type7bData;
    const plots = type7bData?.plots || [];

    if (!plots || plots.length === 0) {
      if (!type7bData?.sourceActivityPlanId && !type7bData?.demoPlotId) {
        return {
          valid: false,
          error: "กรุณาระบุแปลงสาธิตที่ต้องการติดตามอย่างน้อย 1 แปลง",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 7B Plan targets in dedicated tables (ActivityPlanType7b, ActivityPlanType7bPlot, ActivityPlanType7bProduct, DemoPlotVisit)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    if (planData.type7bData !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      await syncType7bData(
        tx as any,
        activityPlanId,
        planData.type7bData,
        startDate,
      );
    }
  },

  /**
   * Save Type 7B Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    if (actualData.demoResults && Array.isArray(actualData.demoResults)) {
      await (tx as any).activityResultDemoItem.deleteMany({
        where: { activityResultId: resultId },
      });

      if (actualData.demoResults.length > 0) {
        await (tx as any).activityResultDemoItem.createMany({
          data: actualData.demoResults.map((item: any) => ({
            activityResultId: resultId,
            plannedProductId: item.plannedProductId || null,
            actualProductId: item.actualProductId || null,
            changeReason: item.changeReason || null,
            plotObjective: item.plotObjective || null,
            demoPlotId: item.demoPlotId || null,
          })),
        });
      }
    }
  },

  /**
   * Load Type 7B Plan Data
   */
  async loadPlan(
    _db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType7bByPlanId(activityPlanId);
  },
};
