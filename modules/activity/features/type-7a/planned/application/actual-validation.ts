import type { Type7aActualRecord } from "../types/actual.types";

export interface Type7aActualValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Type 7A Actual Outcome before submission
 */
export function validateType7aActual(
  actual: Type7aActualRecord,
): Type7aActualValidationResult {
  const errors: string[] = [];

  if (!actual) {
    return {
      isValid: false,
      errors: ["ไม่พบข้อมูลผลการดำเนินงานแปลงสาธิต"],
    };
  }

  // 1. Farmer / Plot
  if (!actual.t7PlotName && !actual.t7FarmerName) {
    errors.push("กรุณาระบุชื่อแปลงสาธิตหรือชื่อเกษตรกร");
  }

  // 2. Crop
  if (!actual.t7CropName && !actual.t7CropCategory) {
    errors.push("กรุณาระบุชนิดพืชที่ทำการสาธิต");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
