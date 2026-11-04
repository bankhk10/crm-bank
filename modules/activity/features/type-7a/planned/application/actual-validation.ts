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

  // 4. GPS Coordinates (must be valid geographical numbers and fit DECIMAL(10, 7))
  if (actual.t7Latitude != null && actual.t7Latitude !== ("" as any)) {
    const lat = Number(actual.t7Latitude);
    if (isNaN(lat) || !isFinite(lat) || lat < -90 || lat > 90) {
      errors.push(
        "พิกัดละติจูด (Latitude) ไม่ถูกต้อง ต้องอยู่ระหว่าง -90 ถึง 90 องศา (เช่น 13.7563309)",
      );
    }
  }

  if (actual.t7Longitude != null && actual.t7Longitude !== ("" as any)) {
    const lng = Number(actual.t7Longitude);
    if (isNaN(lng) || !isFinite(lng) || lng < -180 || lng > 180) {
      errors.push(
        "พิกัดลองจิจูด (Longitude) ไม่ถูกต้อง ต้องอยู่ระหว่าง -180 ถึง 180 องศา (เช่น 100.5017651)",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
