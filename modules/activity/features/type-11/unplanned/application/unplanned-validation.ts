import type {
  Type11UnplannedItem,
  Type11UnplannedValidationResult,
} from "../types/unplanned.types";

/**
 * Pure validation for Type 11 Unplanned (Store Stock Check) items
 */
export function validateType11UnplannedItems(
  items: Type11UnplannedItem[],
): Type11UnplannedValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลร้านค้าที่ตรวจเช็คสต๊อกอย่างน้อย 1 ร้านค้า",
      errors: ["กรุณาระบุข้อมูลร้านค้าที่ตรวจเช็คสต๊อกอย่างน้อย 1 ร้านค้า"],
    };
  }

  items.forEach((item, index) => {
    const storeLabel = item.storeName || `ร้านค้าที่ ${index + 1}`;

    if (!item.storeName || !item.storeName.trim()) {
      errors.push(`ร้านค้าที่ ${index + 1}: กรุณาเลือกร้านค้า`);
    }

    if (item.stockItems && item.stockItems.length > 0) {
      item.stockItems.forEach((si, sIdx) => {
        const prodName = si.productName || `สินค้าที่ ${sIdx + 1}`;
        if (!si.productName || !si.productName.trim()) {
          errors.push(
            `${storeLabel}: กรุณาระบุชื่อสินค้ารายการที่ ${sIdx + 1}`,
          );
        }
        if (
          si.remainingQty === undefined ||
          si.remainingQty === null ||
          String(si.remainingQty).trim() === ""
        ) {
          errors.push(`${storeLabel} - ${prodName}: กรุณาระบุจำนวนคงเหลือ`);
        }
        if (!si.reorderOpportunity || !String(si.reorderOpportunity).trim()) {
          errors.push(
            `${storeLabel} - ${prodName}: กรุณาเลือกโอกาสสั่งซื้อรอบใหม่`,
          );
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors[0],
    errors,
  };
}
