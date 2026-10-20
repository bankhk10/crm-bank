import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { saveType11ActualStockItems } from "../../planned/infrastructure/type11.repository";
import type { Type11UnplannedItem } from "../types/unplanned.types";
import { validateType11UnplannedItems } from "../application/unplanned-validation";

export const type11UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_11",

  /**
   * Validate Type 11 Unplanned Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const unplannedItems: Type11UnplannedItem[] =
      planData.type11UnplannedItems || [];

    if (unplannedItems.length > 0) {
      const result = validateType11UnplannedItems(unplannedItems);
      if (!result.isValid) {
        return {
          valid: false,
          error: result.error || "ข้อมูลการตรวจเช็กสต็อกไม่ถูกต้อง",
        };
      }
    }

    const stores =
      planData.type11Stores ||
      planData.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
      );

    if (unplannedItems.length === 0 && Array.isArray(stores) && stores.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าอย่างน้อย 1 ร้านสำหรับการตรวจเช็กสต็อก",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 11 Unplanned Plan stores in ActivityPlanStore
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const unplannedItems: Type11UnplannedItem[] =
      planData.type11UnplannedItems || [];

    if (unplannedItems.length > 0) {
      await (tx as any).activityPlanStore.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_11",
        },
      });

      const storesToCreate = unplannedItems
        .filter((item) => Boolean(item.storeId || item.id))
        .map((item) => ({
          activityPlanId,
          workTypeCode: "TYPE_11",
          storeId: item.storeId || item.id,
          storeName: item.storeName || null,
          remarks: item.remarks || "ตรวจเช็กสต็อกหน้าร้าน (Unplanned)",
          notes: item.remarks || "ตรวจเช็กสต็อกหน้าร้าน (Unplanned)",
        }));

      if (storesToCreate.length > 0) {
        await (tx as any).activityPlanStore.createMany({
          data: storesToCreate,
        });
      }
      return;
    }

    // Fallback to standard stores
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
          remarks: st.detail || st.remarks || st.notes || "ตรวจเช็กสต็อกหน้าร้าน (Unplanned)",
          notes: st.detail || st.remarks || st.notes || "ตรวจเช็กสต็อกหน้าร้าน (Unplanned)",
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
   * Save Type 11 Unplanned Actual stock items in ActivityResultStockItem
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    const unplannedItems: Type11UnplannedItem[] =
      actualData.type11UnplannedItems || [];

    if (unplannedItems.length > 0) {
      const stockItems = unplannedItems.flatMap((u) =>
        (u.stockItems || []).map((si) => ({
          ...si,
          storeId: u.storeId || u.id,
          storeName: u.storeName,
          nextAction: u.nextAction,
        })),
      );

      if (stockItems.length > 0) {
        await saveType11ActualStockItems(
          tx,
          resultId,
          stockItems,
          actualData.t11NextAction || actualData.nextAction,
        );
        return;
      }
    }

    // Fallback standard actual
    const stockItems =
      actualData.stockResults ||
      actualData.t11StockItems;

    if (stockItems && Array.isArray(stockItems)) {
      await saveType11ActualStockItems(
        tx,
        resultId,
        stockItems,
        actualData.t11NextAction || actualData.nextAction,
      );
    }
  },

  /**
   * Load Type 11 Unplanned Data
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
