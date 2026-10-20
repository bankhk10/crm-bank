import type {
  Type8UnplannedItem,
  Type8UnplannedValidationResult,
} from "../types/unplanned.types";

export type { Type8UnplannedValidationResult };

export function validateType8UnplannedItems(
  items: Type8UnplannedItem[],
): Type8UnplannedValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการจัดประชุมอย่างน้อย 1 รายการ",
      errors: ["กรุณาระบุข้อมูลการจัดประชุมอย่างน้อย 1 รายการ"],
    };
  }

  items.forEach((item, index) => {
    const prefix = items.length > 1 ? `รายการที่ ${index + 1}: ` : "";

    if (!item.topic || !item.topic.trim()) {
      errors.push(`${prefix}กรุณากรอกหัวข้อการประชุม`);
    }

    if (!item.meetingTarget) {
      errors.push(`${prefix}กรุณาเลือกกลุ่มเป้าหมายการประชุม`);
    }

    if (item.meetingTarget === "DEALER" && !item.customerId) {
      errors.push(`${prefix}กรุณาเลือกร้านค้าผู้แทนจำหน่าย (Dealer)`);
    }

    if (item.meetingTarget === "SUBDEALER") {
      const hasSubdealer = item.isNewSubdealer
        ? item.subdealerName && item.subdealerName.trim()
        : item.subdealerId;
      if (!hasSubdealer) {
        errors.push(`${prefix}กรุณาระบุร้านค้ารายย่อย (Subdealer)`);
      }
    }

    if (item.actualAttendees === undefined || item.actualAttendees === null || String(item.actualAttendees).trim() === "") {
      errors.push(`${prefix}กรุณาระบุจำนวนผู้เข้าร่วมประชุมจริง`);
    }

    if (!item.registrationImages || item.registrationImages.length === 0) {
      errors.push(`${prefix}กรุณาแนบรูปถ่ายใบลงทะเบียนผู้เข้าร่วมงานอย่างน้อย 1 รูป`);
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    errors,
  };
}
