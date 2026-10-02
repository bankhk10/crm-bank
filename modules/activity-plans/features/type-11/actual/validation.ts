export interface Type11StockItemInput {
  productId?: string;
  productName?: string;
  remainingQty?: string | number;
  reorderOpportunity?: string;
  remarks?: string;
  stockStatus?: string;
}

/**
 * Validates TYPE_11 (ตรวจนับสต็อก) actual results
 */
export function validateType11Actual(
  stockItems?: Type11StockItemInput[],
): { isValid: boolean; error?: string } {
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
