import type { Type9ActualValidationInput } from "../types/actual.types";

export interface Type9ActualValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateType9Actual(
  input: Type9ActualValidationInput,
): Type9ActualValidationResult {
  // If actual attendees specified, validate positive number
  if (input.actualAttendees && input.actualAttendees.trim()) {
    const attendeesNum = Number(input.actualAttendees.replace(/,/g, ""));
    if (isNaN(attendeesNum) || attendeesNum < 0) {
      return {
        isValid: false,
        error: "จำนวนผู้เข้าร่วมจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0",
      };
    }
  }

  // If actual sales specified, validate positive number
  if (input.actualSales && input.actualSales.trim()) {
    const salesNum = Number(input.actualSales.replace(/,/g, ""));
    if (isNaN(salesNum) || salesNum < 0) {
      return {
        isValid: false,
        error: "ยอดขายจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0",
      };
    }
  }

  return { isValid: true };
}
