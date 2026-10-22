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

  // 1. Farmer
  if (actual.t7IsUnregisteredFarmer) {
    if (!actual.t7FarmerName?.trim()) {
      errors.push("กรุณาระบุชื่อ - สกุล เกษตรกร");
    }
    if (!actual.t7FarmerPhone?.trim()) {
      errors.push("กรุณาระบุเบอร์โทรศัพท์เกษตรกร");
    }
  } else {
    if (!actual.t7FarmerCustomerId && !actual.t7FarmerName?.trim()) {
      errors.push("กรุณาเลือกเกษตรกรเจ้าของแปลง");
    }
  }

  // 2. Crop Info
  if (!actual.t7MainCropInfo?.trim() && !actual.t7CropName?.trim()) {
    errors.push("กรุณาระบุข้อมูลพืชประธาน");
  }

  // 3. Experiment Detail
  if (!actual.t7ExperimentDetail?.trim()) {
    errors.push("กรุณาระบุวิธีการทดลอง");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
