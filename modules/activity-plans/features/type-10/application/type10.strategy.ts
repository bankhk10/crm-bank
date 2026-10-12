import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

export const type10Strategy: WorkTypeStrategy = {
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
      await (tx as any).activityResultSaleItem.deleteMany({
        where: {
          activityResultId: resultId,
          workTypeCode: "TYPE_10",
        },
      });

      if (items.length > 0) {
        await (tx as any).activityResultSaleItem.createMany({
          data: items.map((item: any) => ({
            activityResultId: resultId,
            workTypeCode: "TYPE_10",
            productId: item.productId || null,
            productName: item.productName || item.customProductName || null,
            actualQuantity: item.actualQty
              ? Number(item.actualQty)
              : item.quantity
                ? Number(item.quantity)
                : 0,
            actualUnitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            actualTotal: item.actualSales ? Number(item.actualSales) : null,
            unclosedReason: item.remarks || null,
          })),
        });
      }
    }
  },

  /**
   * Load Type 10 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return db.activityPlan.findUnique({
      where: { id: activityPlanId },
      include: {
        demoPlotVisits: {
          where: { workTypeCode: "TYPE_10" },
          include: { demoPlot: true },
        },
        products: {
          where: { workTypeCode: "TYPE_10" },
          include: { product: true },
        },
      },
    });
  },
};
