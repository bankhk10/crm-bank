import type { Type11ActualRecord } from "../types/actual.types";

/**
 * Parses Type 11 actual outcome data from server response or summary text.
 */
export function parseType11ActualResult(
  resData: any,
): Partial<Type11ActualRecord> {
  const result: Partial<Type11ActualRecord> = {};

  // 1. Normalized stockResults relation
  if (
    resData?.stockResults &&
    Array.isArray(resData.stockResults) &&
    resData.stockResults.length > 0
  ) {
    result.t11StockItems = resData.stockResults.map((sr: any) => ({
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
    const foundNextAction = resData.stockResults.find(
      (sr: any) => sr.nextAction,
    )?.nextAction;
    if (foundNextAction) {
      result.t11NextAction = foundNextAction;
    }
  }

  // 2. Attachments
  if (resData?.attachments && Array.isArray(resData.attachments)) {
    const stockImgs = resData.attachments
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

  // 3. Text block fallback from resultSummary
  const summaryText = resData?.resultSummary || "";
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
