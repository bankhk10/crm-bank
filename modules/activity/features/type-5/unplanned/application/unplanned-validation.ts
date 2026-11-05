import type { Type5UnplannedItem } from "../types/unplanned.types";

export interface Type5UnplannedValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Type 5 Unplanned Items
 */
export function validateType5UnplannedItems(
  items: Type5UnplannedItem[],
): Type5UnplannedValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return {
      isValid: false,
      errors: ["กรุณาระบุรายการสำรวจตลาดของคู่แข่งอย่างน้อย 1 รายการ"],
    };
  }

  items.forEach((item, index) => {
    const idx = index + 1;
    if (!item.storeName && !item.storeId) {
      errors.push(`รายการที่ ${idx}: กรุณาเลือกร้านค้า`);
    }
    if (!item.comparedProduct) {
      errors.push(`รายการที่ ${idx}: กรุณาเลือกสินค้าที่นำไปเปรียบเทียบ`);
    }
    if (!item.competitorBrand || !item.competitorBrand.trim()) {
      errors.push(`รายการที่ ${idx}: กรุณาระบุแบรนด์คู่แข่งที่พบหน้างาน`);
    }
    if (!item.competitorProduct || !item.competitorProduct.trim()) {
      errors.push(`รายการที่ ${idx}: กรุณาระบุสินค้าคู่แข่ง`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
