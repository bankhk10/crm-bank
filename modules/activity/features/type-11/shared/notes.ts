import type { Type11StockItem, Type11StoreItem } from "./types";

/**
 * Formats Type 11 Planned stores into summary text
 */
export function formatType11PlannedNotes(stores: Type11StoreItem[]): string {
  if (!stores || stores.length === 0) return "";
  const storeNames = stores
    .map((s) => s.storeName)
    .filter(Boolean)
    .join(", ");
  return `[ตรวจเช็คสต๊อกหน้าร้าน] ร้านค้าเป้าหมาย: ${storeNames}`;
}

/**
 * Formats Type 11 Actual stock items into summary text
 */
export function formatType11ActualSummary(
  stockItems: Type11StockItem[],
  nextAction?: string,
  generalRemarks?: string,
): string {
  const parts: string[] = ["[ผลการตรวจเช็คสต๊อกหน้าร้าน]"];

  if (stockItems && stockItems.length > 0) {
    const lines = stockItems.map((item) => {
      const storePrefix = item.storeName ? `[${item.storeName}] ` : "";
      const statusText = item.stockStatus
        ? ` (สถานะ: ${item.stockStatus})`
        : "";
      const reorderText = item.reorderOpportunity
        ? ` [โอกาสสั่งซื้อ: ${item.reorderOpportunity}]`
        : "";
      const rem = item.remarks ? ` - ข้อสังเกต: ${item.remarks}` : "";
      return `${storePrefix}${item.productName}: คงเหลือ ${item.remainingQty}${statusText}${reorderText}${rem}`;
    });
    parts.push(lines.join("\n"));
  }

  if (nextAction && nextAction.trim()) {
    parts.push(`สิ่งที่ต้องดำเนินการต่อ: ${nextAction.trim()}`);
  }

  if (generalRemarks && generalRemarks.trim()) {
    parts.push(`หมายเหตุเพิ่มเติม: ${generalRemarks.trim()}`);
  }

  return parts.join("\n");
}
