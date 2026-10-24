import type { Type11ActualRecord } from "../types/actual.types";

/**
 * Parses Type 11 actual outcome data strictly from dedicated tables
 * (type11Targets, type11Products, type11Results).
 */
export function parseType11ActualResult(
  resData: any,
  plan?: any,
): Partial<Type11ActualRecord> {
  const result: Partial<Type11ActualRecord> = {};

  const sourceData = resData || plan;

  // 1. Dedicated relational tables support (type11Products / type11Results / type11Targets)
  const dedicatedProducts =
    sourceData?.type11Products ||
    sourceData?.type11Targets?.flatMap((t: any) => t.products || []);

  const dedicatedResults =
    sourceData?.type11Results ||
    sourceData?.type11Targets?.map((t: any) => t.result).filter(Boolean);

  if (Array.isArray(dedicatedProducts) && dedicatedProducts.length > 0) {
    result.t11StockItems = dedicatedProducts.map((p: any) => ({
      id: p.id,
      targetId: p.targetId,
      storeId: p.target?.storeId,
      storeName: p.target?.storeName || p.target?.store?.name || "ร้านค้า",
      productId: p.productId,
      productName: p.productName || p.product?.name || "สินค้า",
      productCode: p.product?.productCode || undefined,
      productRole: p.productRole,
      targetQuantity: p.targetQuantity,
      targetNotes: p.targetNotes,
      remainingQty: p.actualQuantity != null ? String(p.actualQuantity) : "0",
      remainingQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
      remainingStockQty: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
      actualQuantity: p.actualQuantity != null ? Number(p.actualQuantity) : 0,
      stockStatus: p.stockStatus || "",
      reorderOpportunity: p.reorderOpportunity || "",
      suggestedOrderQty: p.suggestedOrderQty != null ? Number(p.suggestedOrderQty) : undefined,
      remarks: p.remarks || "",
      nextAction: p.nextAction || "",
    }));

    const foundNextAction = dedicatedProducts.find((p: any) => p.nextAction)?.nextAction;
    if (foundNextAction) {
      result.t11NextAction = foundNextAction;
    }
  }

  if (Array.isArray(dedicatedResults) && dedicatedResults.length > 0) {
    const firstRes = dedicatedResults[0];
    if (firstRes) {
      if (firstRes.overallStockStatus) result.t11StockStatus = firstRes.overallStockStatus as any;
      if (firstRes.overallReorderOpportunity) result.t11ReorderOpportunity = firstRes.overallReorderOpportunity as any;
      if (firstRes.nextAction) result.t11NextAction = firstRes.nextAction;
      if (firstRes.summary) result.t11Summary = firstRes.summary;
      if (firstRes.feedback) result.t11Feedback = firstRes.feedback;
    }
  }

  // 2. Attachments
  if (sourceData?.attachments && Array.isArray(sourceData.attachments)) {
    const stockImgs = sourceData.attachments
      .filter(
        (att: any) =>
          att.workTypeCode === "TYPE_11" ||
          att.category === "stock" ||
          att.category === "STOCK" ||
          att.category === "t11",
      )
      .map((att: any) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
        size: att.fileSize,
        type: att.fileType || "image/jpeg",
      }));
    if (stockImgs.length > 0) {
      result.t11Images = stockImgs;
    }
  }

  return result;
}
