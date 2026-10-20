import type { Type10ActualValidationInput } from "../types/actual.types";

export interface Type10ActualValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export function validateType10Actual(
  input: Type10ActualValidationInput,
): Type10ActualValidationResult {
  const errors: string[] = [];

  // Validate actual attendees if specified
  if (input.actualAttendees && input.actualAttendees.trim()) {
    const attendeesNum = Number(input.actualAttendees.replace(/,/g, ""));
    if (isNaN(attendeesNum) || attendeesNum < 0) {
      errors.push("จำนวนผู้เข้าร่วมงานจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
    }
  }

  // Validate actual sales if specified
  if (input.actualSalesOrBooking && input.actualSalesOrBooking.trim()) {
    const salesNum = Number(input.actualSalesOrBooking.replace(/,/g, ""));
    if (isNaN(salesNum) || salesNum < 0) {
      errors.push("ยอดขายหรือยอดจองจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
    }
  }

  // Validate sold products if hasSales is checked
  if (input.hasSales && input.soldProducts && input.soldProducts.length > 0) {
    input.soldProducts.forEach((p, idx) => {
      const prefix = input.soldProducts!.length > 1 ? `รายการสินค้าที่ ${idx + 1}: ` : "";
      if (!p.productName || !p.productName.trim()) {
        errors.push(`${prefix}กรุณาระบุชื่อสินค้า`);
      }
      if (p.actualQty !== undefined && p.actualQty !== null && String(p.actualQty).trim()) {
        const qtyNum = Number(String(p.actualQty).replace(/,/g, ""));
        if (isNaN(qtyNum) || qtyNum < 0) {
          errors.push(`${prefix}จำนวนสินค้าต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    errors,
  };
}
