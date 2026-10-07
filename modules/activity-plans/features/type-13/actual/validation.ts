import type { Type13PlotActualState } from "./types";

/**
 * Validates TYPE_13 (ฉีดแปลงแฮตแทค) plots and spraying rounds
 */
export function validateType13Actual(
  plots: Type13PlotActualState[],
): { isValid: boolean; error?: string } {
  if (!plots || plots.length === 0) {
    return {
      isValid: false,
      error: "ต้องมีแปลงอย่างน้อย 1 แปลงสำหรับการบันทึกผล (TYPE_13)",
    };
  }

  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (!p.plotName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุชื่อแปลง (แปลงที่ ${i + 1})`,
      };
    }
    if (!p.latitude?.trim() || !p.longitude?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุพิกัด Latitude และ Longitude ให้ครบถ้วน (${p.plotName})`,
      };
    }
  }

  return { isValid: true };
}
