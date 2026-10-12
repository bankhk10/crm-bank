import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

export const type9Strategy: WorkTypeStrategy = {
  code: "TYPE_9",

  /**
   * Validate Type 9 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type9Stores ||
      (planData.planStores || []).filter(
        (s: any) => s.workTypeCode === "TYPE_9",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subDealerStore && !s.storeName) {
          return {
            valid: false,
            error: `รายการกิจกรรมหน้าร้านที่ ${i + 1}: กรุณาระบุร้านค้าหลักหรือชื่อร้าน Sub Dealer`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 9 Plan targets in ActivityPlanStore & ActivityPlanProduct
   */
  async savePlan(
    _tx: PrismaTransaction,
    _activityPlanId: string,
    _planData: any,
  ): Promise<void> {
    // Handled in repository activityPlanStore and activityPlanProduct sync
  },

  /**
   * Save Type 9 Actual outcome data
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
          workTypeCode: "TYPE_9",
        },
      });

      if (actualData.productSalesDetails.length > 0) {
        await (tx as any).activityResultSaleItem.createMany({
          data: actualData.productSalesDetails.map((item: any) => ({
            activityResultId: resultId,
            workTypeCode: "TYPE_9",
            storeId: item.storeId || null,
            productId: item.productId || null,
            productName: item.productName || null,
            actualQuantity: item.actualQuantityCases
              ? Number(item.actualQuantityCases)
              : 0,
            actualUnitPrice: item.pricePerCase ? Number(item.pricePerCase) : null,
            actualTotal: item.actualSales ? Number(item.actualSales) : null,
          })),
        });
      }
    }
  },

  /**
   * Load Type 9 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return db.activityPlan.findUnique({
      where: { id: activityPlanId },
      include: {
        stores: {
          where: { workTypeCode: "TYPE_9" },
          include: { store: true },
        },
        products: {
          where: { workTypeCode: "TYPE_9" },
          include: { product: true },
        },
      },
    });
  },
};
