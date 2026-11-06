import type { Type7aUnplannedItem } from "../types/unplanned.types";

export interface Type7aUnplannedValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Type 7A Unplanned Items
 */
export function validateType7aUnplannedItems(
  items: Type7aUnplannedItem[],
): Type7aUnplannedValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return {
      isValid: false,
      errors: ["กรุณาระบุข้อมูลการจัดทำแปลงสาธิตอย่างน้อย 1 แปลง"],
    };
  }

  items.forEach((item, index) => {
    const idx = index + 1;

    if (!item.plotName || !item.plotName.trim()) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุชื่อแปลงสาธิต`);
    }

    if (!item.farmerName || !item.farmerName.trim()) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุหรือเลือกชื่อเจ้าของแปลง / เกษตรกร`);
    }

    if (!item.cropName && !item.cropCategory) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุชนิดพืชที่ทำการสาธิต`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
