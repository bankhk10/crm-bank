import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType7aPlots,
  findType7aByPlanId,
  syncType7aActualData,
} from "./type7a.repository";

export const type7aPlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_7A",

  /**
   * Validate Type 7A Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const plots: any[] =
      planData.type7aPlots ||
      (planData.demoPlotData ? [planData.demoPlotData] : []) ||
      [];

    if (!plots || plots.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุข้อมูลแปลงสาธิตอย่างน้อย 1 แปลง",
      };
    }

    for (let i = 0; i < plots.length; i++) {
      const p = plots[i];
      const hasName = Boolean(p.plotName?.trim() || p.name?.trim());
      if (!hasName) {
        return {
          valid: false,
          error: `แปลงสาธิตที่ ${i + 1}: กรุณาระบุชื่อแปลงสาธิต`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 7A Plan targets in dedicated tables (DemoPlot + ActivityPlanStore + ActivityPlanProduct)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawPlots: any[] =
      planData.type7aPlots ||
      (planData.demoPlotData
        ? [
            {
              ...planData.demoPlotData,
              plotName: planData.demoPlotData.name || planData.demoPlotData.plotName,
              storeId: planData.demoPlotData.customerId || planData.demoPlotData.storeId,
              products: planData.demoProducts || planData.planProducts,
            },
          ]
        : []) ||
      [];

    if (planData.type7aPlots !== undefined || planData.demoPlotData !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      const employeeId = planData.employeeId || "";

      await syncType7aPlots(
        tx as any,
        activityPlanId,
        rawPlots.map((p) => ({
          ...p,
          plotName: p.plotName || p.name,
          ownerName: p.ownerName || p.farmerName,
          products: p.products || p.demoProducts,
        })),
        startDate,
        employeeId,
      );
    }
  },

  /**
   * Save Type 7A Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    // 1. Sync full actual outcome to DemoPlot, DemoPlotIrrigation, DemoPlotExternalProduct, DemoPlotProduct, DemoPlotVisit
    await syncType7aActualData(tx as any, activityPlanId, actualData);

    // 2. Sync to ActivityResultDemoItem for backward compatibility
    if (actualData.demoResults && Array.isArray(actualData.demoResults)) {
      await (tx as any).activityResultDemoItem.deleteMany({
        where: { activityResultId: activityPlanId },
      });

      if (actualData.demoResults.length > 0) {
        await (tx as any).activityResultDemoItem.createMany({
          data: actualData.demoResults.map((item: any) => ({
            activityResultId: activityPlanId,
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
   * Load Type 7A Plan Data
   */
  async loadPlan(
    _db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType7aByPlanId(activityPlanId);
  },
};

export const type7aStrategy = type7aPlannedStrategy;
