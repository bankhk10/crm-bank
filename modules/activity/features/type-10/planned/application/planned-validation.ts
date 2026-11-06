import type { Type10ValidationResult } from "../types/planned.types";

export interface ValidateType10FormInput {
  selectedWorkTypes?: string[];
  type10DemoPlot?: string;
  type10Attendees?: number;
}

export function validateType10Form(
  input: ValidateType10FormInput,
): Type10ValidationResult {
  const { selectedWorkTypes, type10DemoPlot, type10Attendees } = input;

  const isType10 =
    !selectedWorkTypes ||
    selectedWorkTypes.length === 0 ||
    selectedWorkTypes.some(
      (t) =>
        t === "TYPE_10" ||
        t === "FIELD_DAY" ||
        t.includes("TYPE_10") ||
        t.includes("จัดงาน Field Day") ||
        t.includes("Field Day"),
    );

  if (!isType10) {
    return { isValid: true };
  }

  const errors: string[] = [];

  if (!type10DemoPlot || !type10DemoPlot.trim()) {
    errors.push("กรุณาเลือกแปลงสาธิตสำหรับจัดงาน Field Day");
  }

  if (type10Attendees !== undefined && type10Attendees !== null && type10Attendees < 0) {
    errors.push("เป้าหมายจำนวนผู้เข้าร่วมงานต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    errors,
  };
}
