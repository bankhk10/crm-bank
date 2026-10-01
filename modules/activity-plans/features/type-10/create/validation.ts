export interface ValidateType10Options {
  selectedWorkTypes?: string[];
  type10DemoPlot?: string;
  type10Attendees?: number;
}

export interface Type10ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 10 (Field Day).
 * Validates selected demo plot and minimum attendees count.
 */
export function validateType10FormItems({
  selectedWorkTypes = [],
  type10DemoPlot = "",
  type10Attendees = 0,
}: ValidateType10Options): Type10ValidationResult {
  const isType10Selected =
    selectedWorkTypes.includes("จัดงาน Field Day") ||
    selectedWorkTypes.includes("TYPE_10");

  if (!isType10Selected) {
    return { isValid: true };
  }

  if (!type10DemoPlot || !type10DemoPlot.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงสาธิตสำหรับการจัดงาน Field Day",
    };
  }

  if (type10Attendees == null || Number(type10Attendees) < 1) {
    return {
      isValid: false,
      error: "เป้าหมายผู้เข้าร่วมงาน Field Day ต้องมีอย่างน้อย 1 คน",
    };
  }

  return { isValid: true };
}
