import type {
  Type13UnplannedItem,
  Type13UnplannedValidationResult,
} from "../types/unplanned.types";

/**
 * Validates Type 13 Unplanned plot and execution data
 */
export function validateType13UnplannedItem(
  item: Type13UnplannedItem,
): Type13UnplannedValidationResult {
  if (!item) {
    return { isValid: false, error: "กรุณาระบุข้อมูลการฉีดแปลงแฮตแทค" };
  }

  if (!item.storeId?.trim()) {
    return { isValid: false, error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค" };
  }

  if (!item.name?.trim()) {
    return { isValid: false, error: "กรุณาระบุชื่อแปลงแฮตแทค" };
  }

  if (!item.province?.trim()) {
    return { isValid: false, error: "กรุณาระบุจังหวัดของแปลงแฮตแทค" };
  }

  if (!item.district?.trim()) {
    return { isValid: false, error: "กรุณาระบุอำเภอของแปลงแฮตแทค" };
  }

  if (!item.latitude?.trim() || !item.longitude?.trim()) {
    return { isValid: false, error: "กรุณาระบุพิกัด GPS ละติจูดและลองจิจูดของแปลงแฮตแทค" };
  }

  return { isValid: true };
}
