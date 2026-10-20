import type {
  Type12UnplannedItem,
  Type12UnplannedValidationResult,
} from "../types/unplanned.types";

export function validateType12UnplannedItem(
  item: Type12UnplannedItem,
): Type12UnplannedValidationResult {
  if (!item) {
    return { isValid: false, error: "กรุณาระบุข้อมูลกิจกรรมศึกษาดูงาน (ทัวร์)" };
  }

  if (!item.tourType) {
    return { isValid: false, error: "กรุณาเลือกประเภททัวร์" };
  }

  if (item.tourType === "CENTRAL") {
    if (!item.country || !item.country.trim()) {
      return { isValid: false, error: "กรุณาระบุประเทศปลายทางสำหรับทัวร์กลาง" };
    }
  } else if (item.tourType === "STORE") {
    if (!item.storeId && !item.storeName) {
      return { isValid: false, error: "กรุณาเลือกร้านค้าสำหรับทัวร์ร้านค้า" };
    }
    if (!item.destination || !item.destination.trim()) {
      return { isValid: false, error: "กรุณาระบุสถานที่หรือประเทศที่จะไป" };
    }
  }

  if (item.actualAttendees !== undefined && item.actualAttendees !== null) {
    const num = Number(item.actualAttendees);
    if (isNaN(num) || num < 0) {
      return { isValid: false, error: "จำนวนผู้ร่วมเดินทางจริงต้องเป็นตัวเลขที่ถูกต้อง" };
    }
  }

  return { isValid: true };
}
