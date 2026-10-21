import type { Type11UnplannedItem } from "../types/unplanned.types";
import type { Type11StockItem } from "../../shared/types";

/**
 * Hydrates Type 11 unplanned items from existing plan/actual record
 */
export function hydrateType11UnplannedData(
  initialData: any,
): Type11UnplannedItem[] {
  if (
    Array.isArray(initialData?.type11UnplannedItems) &&
    initialData.type11UnplannedItems.length > 0
  ) {
    return initialData.type11UnplannedItems;
  }

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
 * Maps Type 11 Unplanned items to payload format for backend save
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

  return {
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
