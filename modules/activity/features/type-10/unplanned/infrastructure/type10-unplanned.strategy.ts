import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { saveType10ActualSaleItems } from "../../planned/infrastructure/type10.repository";

export const type10UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_10",

  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const events = planData.type10Data?.events || [];
    if (events.length === 0 && !planData.demoPlotId && !planData.location) {
      return {
        valid: false,
        error: "กรุณาระบุแปลงสาธิตหรือสถานที่สำหรับการจัดงาน Field Day",
      };
    }
    return { valid: true };
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const visits = planData.demoPlotVisits || [];
    for (const v of visits) {
      if (v.demoPlotId) {
        await (tx as any).demoPlotVisit.create({
          data: {
            activityPlanId,
            demoPlotId: v.demoPlotId,
            workTypeCode: "TYPE_10",
            visitNumber: 1,
            visitDate: new Date(),
          },
        });
      }
    }
  },

  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    const items =
      actualData.soldProducts ||
      actualData.productSalesDetails ||
      actualData.type10Actual?.soldProducts;

    if (items && Array.isArray(items)) {
      await saveType10ActualSaleItems(tx, resultId, items);
    }
  },
};
