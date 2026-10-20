import type {
  ValidateType11Options,
  Type11ValidationResult,
  Type11StockItemInput,
} from "../types";

export type {
  ValidateType11Options,
  Type11ValidationResult,
  Type11StockItemInput,
};

/**
 * Pure validation function for TYPE 11 (Store Stock Check) plan items.
 * Validates that at least one store is selected for stock check.
 */
export function validateType11FormItems({
  selectedWorkTypes = [],
  stores = [],
}: ValidateType11Options): Type11ValidationResult {
  const isType11Selected =
    selectedWorkTypes.includes("ตรวจเช็คสต๊อกหน้าร้าน") ||
    selectedWorkTypes.includes("TYPE_11");

  if (!isType11Selected) {
    return { isValid: true };
  }

  const storeList = Array.isArray(stores) ? stores : [];
  if (storeList.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้าที่ต้องการตรวจเช็กสต็อกอย่างน้อย 1 ร้านค้า",
    };
  }

  return { isValid: true };
}

/**
 * Pure validation function for TYPE 11 (ตรวจนับสต็อก) actual results.
 */
export function validateType11Actual(
  stockItems?: Type11StockItemInput[],
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
