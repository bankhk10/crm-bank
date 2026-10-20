import type {
  ValidateType12Params,
  Type12ValidationResult,
} from "../types/planned.types";

export type { ValidateType12Params, Type12ValidationResult };

/**
 * Pure validation function for TYPE 12 (Tour) form inputs.
 */
export function validateType12FormValues({
  selectedWorkTypes,
  type12TourType,
  type12TourSize,
  type12Country,
  type12Store,
  type12Destination,
}: ValidateType12Params): Type12ValidationResult {
  const isType12Selected =
    selectedWorkTypes.includes("ทัวร์") ||
    selectedWorkTypes.includes("TYPE_12") ||
    selectedWorkTypes.includes("พาลูกค้าศึกษาดูงาน (ทัวร์)");

  if (!isType12Selected) {
    return { isValid: true };
  }

  if (!type12TourType) {
    return { isValid: false, error: "กรุณาเลือกประเภททัวร์" };
  }

  const isStore =
    type12TourType === "ทัวร์ร้านค้า" || type12TourType === "STORE";

  if (!isStore) {
    if (!type12TourSize) {
      return { isValid: false, error: "กรุณาเลือกขนาดทัวร์" };
    }
    if (!type12Country || !type12Country.trim()) {
      return { isValid: false, error: "กรุณากรอกชื่อประเทศสำหรับทัวร์กลาง" };
    }
  } else {
    if (!type12Store || !type12Store.trim()) {
      return { isValid: false, error: "กรุณาเลือกร้านค้าสำหรับทัวร์ร้านค้า" };
    }
    if (!type12Destination || !type12Destination.trim()) {
      return { isValid: false, error: "กรุณากรอกสถานที่หรือประเทศที่จะไป" };
    }
  }

  return { isValid: true };
}
