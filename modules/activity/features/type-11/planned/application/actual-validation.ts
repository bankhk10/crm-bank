import type { Type11StockItem } from "../../shared/types";
import type { Type11ValidationResult } from "../types/planned.types";

/**
 * Pure validation function for TYPE 11 (Store Stock Check) actual results.
 */
export function validateType11Actual(
  stockItems?: Type11StockItem[],
): Type11ValidationResult {
  if (stockItems && stockItems.length > 0) {
    for (const item of stockItems) {
      if (
        item.remainingQty === undefined ||
        item.remainingQty === null ||
        String(item.remainingQty).trim() === ""
      ) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนคงเหลือสำหรับสินค้า "${item.productName || "ที่ตรวจเช็ก"}"`,
        };
      }
      if (!item.reorderOpportunity || !String(item.reorderOpportunity).trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกโอกาสการสั่งซื้อรอบใหม่สำหรับสินค้า "${item.productName || "ที่ตรวจเช็ก"}"`,
        };
      }
    }
  }

  return { isValid: true };
}
