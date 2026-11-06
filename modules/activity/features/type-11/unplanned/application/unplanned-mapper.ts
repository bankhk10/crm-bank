import type { Type11UnplannedItem } from "../types/unplanned.types";
import type { Type11StockItem } from "../../shared/types";

/**
 * Hydrates Type 11 unplanned items strictly from dedicated tables (type11Targets).
 * Restores store-level stock audit items and images from attachments.
 */
export function hydrateType11UnplannedData(
  initialData: any,
): Type11UnplannedItem[] {
  if (!initialData) return [];

  // 1. Collect all attachments that belong to Type 11
  const allAttachments: any[] = [
    ...(Array.isArray(initialData?.attachments) ? initialData.attachments : []),
    ...(Array.isArray(initialData?.result?.attachments) ? initialData.result.attachments : []),
  ];

  const type11Attachments = allAttachments.filter(
    (att: any) =>
      att &&
      (att.workTypeCode === "TYPE_11" ||
        att.workTypeCode === "ตรวจเช็คสต็อกหน้าร้าน" ||
        att.workTypeCode === "ตรวจเช็คสต๊อกหน้าร้าน" ||
        att.category === "STOCK" ||
        att.category === "stock" ||
        att.category === "SHELF" ||
        att.category === "shelf" ||
        String(att.fileUrl || att.url || "").includes("/stock/")),
  );

  const mappedGeneralImages = type11Attachments.map((att: any) => ({
    id: att.id || att.fileUrl || att.url,
    url: att.fileUrl || att.url,
    name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
    size: att.fileSize,
    type: att.mimeType || "image/jpeg",
  }));

  const globalFallbackImages =
    mappedGeneralImages.length > 0
      ? mappedGeneralImages
      : Array.isArray(initialData?.t11Images) && initialData.t11Images.length > 0
        ? initialData.t11Images
        : Array.isArray(initialData?.images) && initialData.images.length > 0
          ? initialData.images
          : [];

  // 2. Direct type11UnplannedItems state
  if (
    Array.isArray(initialData?.type11UnplannedItems) &&
    initialData.type11UnplannedItems.length > 0
  ) {
    return initialData.type11UnplannedItems.map((item: Type11UnplannedItem) => {
      if (Array.isArray(item.images) && item.images.length > 0) {
        return item;
      }
      const targetImages = type11Attachments.filter(
        (att: any) =>
          (att.storeId && (att.storeId === item.storeId || att.storeId === item.id)) ||
          (att.targetId && att.targetId === item.id),
      );
      const resolved =
        targetImages.length > 0
          ? targetImages.map((att: any) => ({
              id: att.id || att.fileUrl || att.url,
              url: att.fileUrl || att.url,
              name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
              size: att.fileSize,
              type: att.mimeType || "image/jpeg",
            }))
          : globalFallbackImages;

      return {
        ...item,
        images: resolved,
      };
    });
  }

  // 3. Dedicated type11Targets relational storage (or fallback stores)
  const dedicatedTargets: any[] =
    initialData?.type11Targets ||
    initialData?.type11Data?.targets ||
    initialData?.type11Stores ||
    (Array.isArray(initialData?.stores)
      ? initialData.stores.filter(
          (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
        )
      : []);

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

      // Match target images by storeId/targetId
      const targetImages = type11Attachments.filter(
        (att: any) =>
          (att.storeId && (att.storeId === storeId || att.storeId === t.id)) ||
          (att.targetId && att.targetId === t.id),
      );

      const resolvedImages =
        targetImages.length > 0
          ? targetImages.map((att: any) => ({
              id: att.id || att.fileUrl || att.url,
              url: att.fileUrl || att.url,
              name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
              size: att.fileSize,
              type: att.mimeType || "image/jpeg",
            }))
          : globalFallbackImages;

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
        images: resolvedImages,
      };
    });
  }

  return [];
}

/**
 * Maps Type 11 Unplanned items strictly to dedicated payload format (type11Targets).
 */
export function mapType11UnplannedToPayload(items: Type11UnplannedItem[]) {
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
    summary: item.summary || item.remarks,
  }));

  return {
    type11Targets,
    type11Stores: items.map((i) => ({
      storeId: i.storeId || null,
      storeName: i.storeName,
      storeCode: i.storeCode || null,
      province: i.province || null,
      district: i.district || null,
      dealerId: i.dealerId || null,
      dealerName: i.dealerName || null,
      isUnregisteredStore: Boolean(i.isUnregisteredStore),
      workTypeCode: "TYPE_11",
    })),
    t11StockItems: allStockItems,
    t11NextAction: nextAction,
    type11UnplannedItems: items,
  };
}
