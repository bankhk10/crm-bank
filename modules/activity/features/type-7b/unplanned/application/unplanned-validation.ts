import type {
  Type7bUnplannedItem,
  Type7bUnplannedValidationResult,
} from "../types/unplanned.types";

export type { Type7bUnplannedValidationResult };

/**
 * Validates Type 7B Unplanned Activity Items
 */
export function validateType7bUnplannedItems(
  items: Type7bUnplannedItem[],
): Type7bUnplannedValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการติดตามแปลงสาธิตอย่างน้อย 1 แปลง",
    };
  }

  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.plotName?.trim() && !item.demoPlotId) {
      errors.push(`แปลงที่ ${i + 1}: กรุณาเลือกหรือระบุชื่อแปลงสาธิต`);
    }

    if (!item.cropCondition?.trim()) {
      errors.push(`แปลงที่ ${i + 1}: กรุณาระบุสภาพแปลง/สภาพพืช`);
    }

    if (!item.growthStage?.trim()) {
      errors.push(`แปลงที่ ${i + 1}: กรุณาระบุระยะการเจริญเติบโตของพืช`);
    }

    if (item.hasProductWithdrawal && item.withdrawnProducts) {
      for (let j = 0; j < item.withdrawnProducts.length; j++) {
        const prod = item.withdrawnProducts[j];
        if (!prod.productId) {
          errors.push(`แปลงที่ ${i + 1} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาเลือกสินค้า`);
        }
        if (prod.quantity == null || Number(prod.quantity) <= 0) {
          errors.push(`แปลงที่ ${i + 1} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาระบุจำนวนสินค้าที่ถูกต้อง`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    error: errors[0],
  };
}
