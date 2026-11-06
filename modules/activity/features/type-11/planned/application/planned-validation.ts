import type {
  ValidateType11Options,
  Type11ValidationResult,
} from "../types/planned.types";

/**
 * Pure validation function for TYPE 11 (Store Stock Check) plan items.
 * Validates that at least one store is selected for stock check.
 */
export function validateType11FormItems({
  selectedWorkTypes = [],
  stores = [],
  type11Stores = [],
}: ValidateType11Options): Type11ValidationResult {
  const isType11Selected =
    selectedWorkTypes.includes("ตรวจเช็คสต๊อกหน้าร้าน") ||
    selectedWorkTypes.includes("TYPE_11");

  if (!isType11Selected) {
    return { isValid: true };
  }

  const list =
    Array.isArray(type11Stores) && type11Stores.length > 0
      ? type11Stores
      : Array.isArray(stores)
        ? stores
        : [];

  if (list.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้าที่ต้องการตรวจเช็คสต๊อกอย่างน้อย 1 ร้านค้า",
    };
  }

  return { isValid: true };
}
