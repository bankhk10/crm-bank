import type {
  Type11TargetItem,
  Type11StockItem,
  Type11ActualRecord,
  Type11TargetStoreItem,
} from "../types";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

/**
 * Extracts Type 11 plan targets (Store stock check list) from activity plan relations.
 */
export function extractType11PlanTargets(
  plan: any,
  prevTarget?: Type11TargetItem,
): { primary: Type11TargetItem; list: Type11TargetItem[] } {
  const stores = Array.isArray(plan?.stores) ? plan.stores : [];
  const t11Stores = stores.filter(
    (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
  );

  const items: Type11TargetStoreItem[] = t11Stores.map((s: any) => ({
    storeId: s.storeId || s.id,
    store: s.storeName || s.store?.name || "",
    storeName: s.storeName || s.store?.name || "",
    detail: s.remarks || s.notes || "",
  }));

  const list: Type11TargetItem[] = t11Stores.map((s: any) => ({
    id: s.storeId || s.id,
    store: s.storeName || s.store?.name || "",
    detail: s.remarks || s.notes || "",
    targetOpportunity: prevTarget?.targetOpportunity || "",
    items: [
      {
        storeId: s.storeId || s.id,
        store: s.storeName || s.store?.name || "",
        storeName: s.storeName || s.store?.name || "",
        detail: s.remarks || s.notes || "",
      },
    ],
  }));

  const t11StoreNames = items
    .map((i) => i.store || i.storeName)
    .filter(Boolean)
    .join(", ");

  const t11Details = items
    .map((i) => i.detail)
    .filter(Boolean)
    .join(" | ");

  const primary: Type11TargetItem = {
    store: t11StoreNames || prevTarget?.store || "",
    detail: t11Details || prevTarget?.detail || "",
    targetOpportunity: prevTarget?.targetOpportunity || "",
    items: items.length > 0 ? items : prevTarget?.items || [],
  };

  return { primary, list };
}

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
      reorderOpportunity: (sr.reorderOpportunity as any) || "",
      remarks: sr.remarks || "",
    }));
  }

  // 2. Attachments
  if (resData?.attachments && Array.isArray(resData.attachments)) {
    const stockImgs = resData.attachments
      .filter(
        (att: any) =>
          att.workTypeCode === "TYPE_11" ||
          att.category === "stock" ||
          att.category === "t11",
      )
      .map((att: any) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
        size: att.fileSize,
        type: att.fileType,
      }));
    if (stockImgs.length > 0) {
      result.t11Images = stockImgs;
    }
  }

  // 3. Text block fallback from resultSummary
  const summaryText = resData?.resultSummary || "";
  if (summaryText) {
    if (!result.t11StockItems || result.t11StockItems.length === 0) {
      const match = summaryText.match(/รายการตรวจเช็กสต็อก:\s*(\[.+\])/);
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

/**
 * Maps Type 11 stores to section display items for Detail View.
 */
export function mapType11ToSectionItems(
  type11Stores: any[],
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t11Line = objectiveLines.find(
    (l) => l.includes("[ตรวจเช็กสต็อก") || l.includes("ตรวจเช็กสต็อก"),
  );

  if (type11Stores.length === 0 && !t11Line) {
    return null;
  }

  const list = type11Stores.map((s: any) => ({
    title: s.storeName || "ร้านค้า",
    details: s.remarks || s.notes || undefined,
  }));

  return {
    typeIndex: 11,
    title: "ตรวจเช็กสต็อกหน้าร้าน",
    badge: "เช็กสต็อก",
    items: list,
    rawSummary: t11Line ? t11Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
