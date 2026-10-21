import type {
  Type14UnplannedItem,
  Type14UnplannedValidationResult,
} from "../types/unplanned.types";

/**
 * Validates Type 14 Unplanned plot and tracking execution data
 */
export function validateType14UnplannedItem(
  item: Type14UnplannedItem,
): Type14UnplannedValidationResult {
  if (!item) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการติดตามแปลงแฮตแทค (TYPE_14)",
    };
  }

  if (!item.name?.trim() && !item.plotName?.trim()) {
    return { isValid: false, error: "กรุณาระบุชื่อแปลงแฮตแทค" };
  }

  if (!item.storeId?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค",
    };
  }

  if (!item.province?.trim()) {
    return { isValid: false, error: "กรุณาระบุจังหวัดของแปลงแฮตแทค" };
  }

  if (!item.district?.trim()) {
    return { isValid: false, error: "กรุณาระบุอำเภอของแปลงแฮตแทค" };
  }

  if (!item.actualVisitDate?.trim()) {
    return { isValid: false, error: "กรุณาระบุวันที่ติดตามผลแปลงแฮทแทค" };
  }

  if (!item.trackingResult?.trim()) {
    return { isValid: false, error: "กรุณาระบุผลการติดตามแปลงแฮตแทค" };
  }

  return { isValid: true };
}
