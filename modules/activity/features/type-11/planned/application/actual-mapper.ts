import type { Type11ActualRecord } from "../types/actual.types";

/**
 * Parses Type 11 actual outcome data from dedicated tables or server response.
 * Supports dedicated relational tables (type11Targets, type11Products, type11Results)
 * with backward-compatible fallback to stockResults and resultSummary text.
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

  // 2. Fallback: Normalized stockResults relation (activity_result_stock_items)
  if (
    (!result.t11StockItems || result.t11StockItems.length === 0) &&
    sourceData?.stockResults &&
    Array.isArray(sourceData.stockResults) &&
    sourceData.stockResults.length > 0
  ) {
    result.t11StockItems = sourceData.stockResults.map((sr: any) => ({
      id: sr.id,
      storeId: sr.storeId,
      storeName: sr.store?.name || sr.storeName || "ร้านค้า",
      productId: sr.productId,
      productName: sr.product?.name || sr.productName || "สินค้า",
      productCode: sr.product?.productCode || sr.productCode || undefined,
      remainingQty: String(sr.remainingQuantity ?? 0),
      remainingQuantity: Number(sr.remainingQuantity ?? 0),
      remainingStockQty: Number(sr.remainingQuantity ?? 0),
      stockStatus: sr.stockStatus || "",
      reorderOpportunity: sr.reorderOpportunity || "",
      remarks: sr.remarks || "",
    }));
    const foundNextAction = sourceData.stockResults.find(
      (sr: any) => sr.nextAction,
    )?.nextAction;
    if (foundNextAction) {
      result.t11NextAction = foundNextAction;
    }
  }

  // 3. Attachments
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

  // 4. Text block fallback from resultSummary
  const summaryText = sourceData?.resultSummary || "";
  if (summaryText) {
    if (!result.t11StockItems || result.t11StockItems.length === 0) {
      const match = summaryText.match(/รายการตรวจเช็คสต๊อก:\s*(\[.+\])/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1].trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.t11StockItems = parsed;
          }
        } catch {
          // ignore non-json
        }
      }
    }

    const t11ProductMatch = summaryText.match(/รายการสินค้าตรวจเช็ก:\s*(.+)/);
    if (t11ProductMatch && t11ProductMatch[1]) {
      result.t11ProductList = t11ProductMatch[1].split("\n")[0].trim();
    }
    const t11QtyMatch = summaryText.match(/จำนวนคงเหลือสต็อก:\s*(.+)/);
    if (t11QtyMatch && t11QtyMatch[1]) {
      result.t11RemainingQty = t11QtyMatch[1].split("\n")[0].trim();
    }
    const t11RemarksMatch = summaryText.match(/ข้อสังเกตสต็อก:\s*(.+)/);
    if (t11RemarksMatch && t11RemarksMatch[1]) {
      result.t11Remarks = t11RemarksMatch[1].split("\n")[0].trim();
    }
    const t11StatusMatch = summaryText.match(/สถานะสต็อก:\s*(.+)/);
    if (t11StatusMatch && t11StatusMatch[1]) {
      result.t11StockStatus = t11StatusMatch[1].split("\n")[0].trim() as any;
    }
    const t11ReorderMatch = summaryText.match(/โอกาสสั่งซื้อซ้ำ:\s*(.+)/);
    if (t11ReorderMatch && t11ReorderMatch[1]) {
      result.t11ReorderOpportunity = t11ReorderMatch[1]
        .split("\n")[0]
        .trim() as any;
    }
    const t11NextActionMatch = summaryText.match(
      /(?:สิ่งที่ต้องดำเนินการต่อ|แผนการติดตามสต็อก):\s*(.+)/,
    );
    if (t11NextActionMatch && t11NextActionMatch[1]) {
      result.t11NextAction = t11NextActionMatch[1].split("\n")[0].trim();
    }
  }

  return result;
}
