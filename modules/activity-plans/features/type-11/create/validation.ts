import type { Type11StoreItem } from "../shared/types";

export interface ValidateType11Options {
  selectedWorkTypes?: string[];
  stores?: Type11StoreItem[] | string;
}

export interface Type11ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 11 (Store Stock Check).
 * Validates that at least one store is selected for stock check.
 */
export function validateType11FormItems({
  selectedWorkTypes = [],
  stores = [],
}: ValidateType11Options): Type11ValidationResult {
  const isType11Selected =
    selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
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
