import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

export const type11Strategy: WorkTypeStrategy = {
  code: "TYPE_11",

  /**
   * Validate Type 11 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const stores =
      planData.type11Stores ||
      planData.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
      );

    if (Array.isArray(stores) && stores.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าอย่างน้อย 1 ร้านสำหรับการตรวจเช็กสต็อก",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 11 Plan stores in ActivityPlanStore
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const stores =
      planData.type11Stores ||
      planData.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
      );

    if (stores && Array.isArray(stores)) {
      await (tx as any).activityPlanStore.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_11",
        },
      });

      const storesToCreate = stores
        .map((st: any) => ({
          activityPlanId,
          workTypeCode: "TYPE_11",
          storeId: st.storeId || st.id,
          storeName: st.storeName || st.name || null,
          remarks: st.detail || st.remarks || st.notes || "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
          notes: st.detail || st.remarks || st.notes || "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
        }))
        .filter((st: any) => Boolean(st.storeId));

      if (storesToCreate.length > 0) {
        await (tx as any).activityPlanStore.createMany({
          data: storesToCreate,
        });
      }
    }
  },

  /**
   * Save Type 11 Actual stock items in ActivityResultStockItem
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    const stockItems =
      actualData.stockResults ||
      actualData.t11StockItems;

    if (stockItems && Array.isArray(stockItems)) {
      await (tx as any).activityResultStockItem.deleteMany({
        where: { activityResultId: resultId },
      });

      const validItems = stockItems
        .filter((item: any) => Boolean(item.storeId && item.productId))
        .map((item: any) => ({
          activityResultId: resultId,
          storeId: item.storeId,
          productId: item.productId,
          remainingQuantity:
            typeof item.remainingQuantity === "number"
              ? item.remainingQuantity
              : parseInt(String(item.remainingQty || "0").replace(/,/g, ""), 10) || 0,
          stockStatus: item.stockStatus || null,
          reorderOpportunity: item.reorderOpportunity || null,
          remarks: item.remarks || null,
        }));

      if (validItems.length > 0) {
        await (tx as any).activityResultStockItem.createMany({
          data: validItems,
        });
      }
    }
  },

  /**
   * Load Type 11 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return db.activityPlan.findUnique({
      where: { id: activityPlanId },
      include: {
        stores: {
          where: { workTypeCode: "TYPE_11" },
          include: { store: true },
        },
      },
    });
  },
};
