import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

export interface ValidateType7bOptions {
  items?: Type7DemoPlotItem[];
  selectedWorkTypes?: string[];
}

export interface Type7bValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 7B (Follow-up Demo Plot) form items.
 * Validates presence of at least 1 follow-up item when TYPE 7B is selected.
 */
export function validateType7bFormItems({
  items = [],
  selectedWorkTypes = [],
}: ValidateType7bOptions): Type7bValidationResult {
  const hasType7BSelected = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_7B",
  );
  if (!hasType7BSelected) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการติดตามแปลงสาธิตอย่างน้อย 1 รายการ",
    };
  }

  for (const item of items) {
    const hasPlots =
      (item.selectedPlotIds && item.selectedPlotIds.length > 0) ||
      Boolean(item.existingPlotId || item.demoPlotId);
    if (!hasPlots) {
      return {
        isValid: false,
        error: "กรุณาเลือกแปลงที่ต้องการติดตามอย่างน้อย 1 แปลง",
      };
    }
  }

  return { isValid: true };
}
