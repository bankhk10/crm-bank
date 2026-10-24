import type { Type11UnplannedItem } from "../types/unplanned.types";
import type { Type11StockItem } from "../../shared/types";

/**
 * Hydrates Type 11 unplanned items from existing plan/actual record.
 * Supports dedicated tables (type11Targets, type11Products, type11Results)
 * with backward-compatible fallback to stores and stockResults.
 */
export function hydrateType11UnplannedData(
  initialData: any,
): Type11UnplannedItem[] {
  // 1. Direct type11UnplannedItems state
  if (
    Array.isArray(initialData?.type11UnplannedItems) &&
    initialData.type11UnplannedItems.length > 0
  ) {
    return initialData.type11UnplannedItems;
  }

  // 2. Dedicated type11Targets relational storage
  const dedicatedTargets =
    initialData?.type11Targets ||
    initialData?.type11Data?.targets;

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    return dedicatedTargets.map((t: any) => {
      const storeId = t.storeId || null;
      const storeName = t.storeName || t.store?.name || "ร้านค้า";

      const matchedStockItems: Type11StockItem[] = Array.isArray(t.products)
        ? t.products.map((p: any) => ({
            id: p.id,
            targetId: t.id,
            storeId,
            storeName,
            productId: p.productId,
            productName: p.productName || p.product?.name || "สินค้า",
            productCode: p.product?.productCode || undefined,
            productRole: p.productRole,
            targetQuantity: p.targetQuantity,
            targetNotes: p.targetNotes,
            remainingQty: p.actualQuantity != null ? String(p.actualQuantity) : "0",
            remainingQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
            actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
            remainingStockQty: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
            stockStatus: p.stockStatus || "ปกติ",
            reorderOpportunity: p.reorderOpportunity || "",
            suggestedOrderQty: p.suggestedOrderQty != null ? Number(p.suggestedOrderQty) : undefined,
            remarks: p.remarks || "",
            nextAction: p.nextAction || "",
          }))
        : [];

      return {
        id: t.id,
        targetId: t.id,
        storeId,
        storeName,
        isUnregisteredStore: Boolean(t.isUnregisteredStore),
        storeCode: t.storeCode || t.store?.customerCode || null,
        province: t.province || t.store?.province || null,
        district: t.district || t.store?.district || null,
        dealerId: t.dealerId || null,
        dealerName: t.dealerName || t.dealer?.name || null,
        visitPurpose: t.visitPurpose || null,
        stockItems: matchedStockItems,
        overallStockStatus: t.result?.overallStockStatus || null,
        overallReorderOpportunity: t.result?.overallReorderOpportunity || null,
        feedback: t.result?.feedback || null,
        nextAction: t.result?.nextAction || t.notes || "",
        remarks: t.notes || "",
        summary: t.result?.summary || "",
        images: initialData?.t11Images || initialData?.images || [],
      };
    });
  }

  // 3. Legacy stores and stockResults fallback
  const stores = initialData?.stores || initialData?.type11Stores || [];
  const stockResults =
    initialData?.stockResults || initialData?.t11StockItems || [];

  if (Array.isArray(stores) && stores.length > 0) {
    const t11Stores = stores.filter(
      (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
    );

    if (t11Stores.length > 0) {
      return t11Stores.map((s: any) => {
        const storeId = s.storeId || s.id;
        const storeName = s.storeName || s.store?.name || s.name || "ร้านค้า";
        const matchedStockItems: Type11StockItem[] = Array.isArray(stockResults)
          ? stockResults
              .filter(
                (sr: any) =>
                  sr.storeId === storeId ||
                  sr.storeName === storeName ||
                  !sr.storeId,
              )
              .map((sr: any) => ({
                id: sr.id || crypto.randomUUID(),
                storeId,
                storeName,
                productId: sr.productId,
                productName: sr.product?.name || sr.productName || "สินค้า",
                productCode: sr.product?.productCode || sr.productCode,
                remainingQty: sr.remainingQuantity ?? sr.remainingQty ?? 0,
                stockStatus: sr.stockStatus || "ปกติ",
                reorderOpportunity: sr.reorderOpportunity || "",
                remarks: sr.remarks || "",
              }))
          : [];

        return {
          id: s.id || crypto.randomUUID(),
          storeId,
          storeName,
          stockItems: matchedStockItems,
          nextAction: s.nextAction || initialData?.t11NextAction || "",
          remarks: s.remarks || s.notes || "",
          images: initialData?.t11Images || initialData?.images || [],
        };
      });
    }
  }

  return [];
}

/**
 * Maps Type 11 Unplanned items to payload format for backend save.
 * Produces both dedicated type11Targets and legacy planStores/t11StockItems.
 */
export function mapType11UnplannedToPayload(items: Type11UnplannedItem[]) {
  const planStores = items.map((item) => ({
    workTypeCode: "TYPE_11",
    storeId: item.storeId || item.id,
    storeName: item.storeName || null,
    notes: item.remarks || "ตรวจเช็คสต๊อกหน้าร้าน",
  }));

  const allStockItems: Type11StockItem[] = [];
  items.forEach((item) => {
    if (item.stockItems && item.stockItems.length > 0) {
      item.stockItems.forEach((si) => {
        allStockItems.push({
          ...si,
          targetId: item.targetId || item.id,
          storeId: item.storeId || item.id,
          storeName: item.storeName,
        });
      });
    }
  });

  const nextAction = items
    .map((i) => i.nextAction)
    .filter(Boolean)
    .join("; ");

  const type11Targets = items.map((item) => ({
    id: item.targetId || item.id,
    targetId: item.targetId || item.id,
    storeId: item.storeId || null,
    storeName: item.storeName,
    isUnregisteredStore: item.isUnregisteredStore,
    storeCode: item.storeCode,
    province: item.province,
    district: item.district,
    dealerId: item.dealerId,
    dealerName: item.dealerName,
    visitPurpose: item.visitPurpose,
    notes: item.remarks || item.summary,
    products: item.stockItems,
    stockItems: item.stockItems,
    overallStockStatus: item.overallStockStatus,
    overallReorderOpportunity: item.overallReorderOpportunity,
    feedback: item.feedback,
    nextAction: item.nextAction,
    summary: item.summary,
  }));

  return {
    type11Targets,
    type11Stores: items.map((i) => ({
      storeId: i.storeId || i.id,
      storeName: i.storeName,
    })),
    planStores,
    t11StockItems: allStockItems,
    stockResults: allStockItems,
    t11NextAction: nextAction,
    type11UnplannedItems: items,
  };
}
