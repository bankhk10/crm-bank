import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { saveType10ActualSaleItems } from "./type10.repository";

export const type10PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_10",

  /**
   * Validate Type 10 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const demoPlotId =
      planData.submittedDemoPlotId ||
      planData.type10DemoPlot ||
      planData.demoPlotId;

    if (!demoPlotId && !planData.location) {
      return {
        valid: false,
        error: "กรุณาระบุแปลงสาธิตหรือสถานที่สำหรับการจัดงาน Field Day",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 10 Plan targets in DemoPlotVisit
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const demoPlotId =
      planData.submittedDemoPlotId ||
      planData.type10DemoPlot ||
      planData.demoPlotId;

    if (demoPlotId) {
      const existingVisit = await (tx as any).demoPlotVisit.findFirst({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_10",
        },
      });

      if (existingVisit) {
        await (tx as any).demoPlotVisit.update({
          where: { id: existingVisit.id },
          data: { demoPlotId },
        });
      } else {
        await (tx as any).demoPlotVisit.create({
          data: {
            activityPlanId,
            demoPlotId,
            workTypeCode: "TYPE_10",
            visitNumber: 1,
            visitDate: new Date(),
          },
        });
      }
    }
  },

  /**
   * Save Type 10 Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    const items =
      actualData.productSalesDetails ||
      actualData.soldProducts;

    if (items && Array.isArray(items)) {
      await saveType10ActualSaleItems(tx, resultId, items);
    }
  },
};

export const type10Strategy = type10PlannedStrategy;
