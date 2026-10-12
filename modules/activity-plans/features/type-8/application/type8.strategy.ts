import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

export const type8Strategy: WorkTypeStrategy = {
  code: "TYPE_8",

  /**
   * Validate Type 8 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type8Stores ||
      (planData.planStores || []).filter(
        (s: any) => s.workTypeCode === "TYPE_8",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName) {
          return {
            valid: false,
            error: `รายการประชุมที่ ${i + 1}: กรุณาระบุร้านค้าหรือสถานที่จัดประชุม`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 8 Plan targets in ActivityPlanStore & ActivityPlanProduct
   */
  async savePlan(
    _tx: PrismaTransaction,
    _activityPlanId: string,
    _planData: any,
  ): Promise<void> {
    // Handled in repository activityPlanStore and activityPlanProduct sync
  },

  /**
   * Save Type 8 Actual outcome data
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    if (
      actualData.productSalesDetails &&
      Array.isArray(actualData.productSalesDetails)
    ) {
      await (tx as any).activityResultSaleItem.deleteMany({
        where: {
          activityResultId: resultId,
          workTypeCode: "TYPE_8",
        },
      });

      if (actualData.productSalesDetails.length > 0) {
        await (tx as any).activityResultSaleItem.createMany({
          data: actualData.productSalesDetails.map((item: any) => ({
            activityResultId: resultId,
            workTypeCode: "TYPE_8",
            productId: item.productId || null,
            productName: item.productName || null,
            actualQuantity: item.actualQty ? Number(item.actualQty) : 0,
            actualUnitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            actualTotal: item.actualSales ? Number(item.actualSales) : null,
            unclosedReason: item.notes || null,
          })),
        });
      }
    }
  },

  /**
   * Load Type 8 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return db.activityPlan.findUnique({
      where: { id: activityPlanId },
      include: {
        stores: {
          where: { workTypeCode: "TYPE_8" },
          include: { store: true },
        },
        products: {
          where: {
            OR: [
              { workTypeCode: "TYPE_8" },
              { workTypeCode: "TYPE_8_PROMOTION" },
            ],
          },
          include: { product: true },
        },
      },
    });
  },
};
