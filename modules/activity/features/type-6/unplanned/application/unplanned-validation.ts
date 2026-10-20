import type { Type6UnplannedItem } from "../types/unplanned.types";

export interface Type6UnplannedValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Type 6 Unplanned Items
 */
export function validateType6UnplannedItems(
  items: Type6UnplannedItem[],
): Type6UnplannedValidationResult {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    return {
      isValid: false,
      errors: ["กรุณาระบุรายการตรวจสอบเรื่องร้องเรียนอย่างน้อย 1 รายการ"],
    };
  }

  items.forEach((item, index) => {
    const idx = index + 1;

    // 1. Customer validation
    if (item.isManualCustomer) {
      if (!item.manualCustomerName || !item.manualCustomerName.trim()) {
        errors.push(`รายการที่ ${idx}: กรุณาระบุชื่อลูกค้า/เกษตรกร (กรณีไม่ได้อยู่ในระบบ)`);
      }
    } else {
      if (!item.customerName && !item.storeId) {
        errors.push(`รายการที่ ${idx}: กรุณาเลือกร้านค้า หรือ Key Farmer จาก Customer Master`);
      }
    }

    // 2. Issue Type
    if (!item.issueType) {
      errors.push(`รายการที่ ${idx}: กรุณาระบุประเภทปัญหา`);
    }

    if (item.issueType === "อื่นๆ ระบุ" && (!item.detail || !item.detail.trim())) {
      errors.push(`รายการที่ ${idx}: กรุณาระบุรายละเอียดเพิ่มเติมสำหรับประเภทปัญหา "อื่นๆ ระบุ"`);
    }

    // 3. Actual Investigation Fields
    if (!item.lotNumber || !item.lotNumber.trim()) {
      errors.push(`รายการที่ ${idx}: กรุณาระบุเลข Lot บนบรรจุภัณฑ์`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
