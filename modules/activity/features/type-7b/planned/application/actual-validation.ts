import type { Type7bActualRecord } from "../types/actual.types";

/**
 * Validates Type 7B Actual Record
 */
export function validateType7bActual(
  actualState?: Type7bActualRecord | null,
): { isValid: boolean; errors: string[]; error?: string } {
  if (!actualState) {
    return {
      isValid: false,
      errors: ["กรุณากรอกข้อมูลการติดตามแปลงสาธิต"],
      error: "กรุณากรอกข้อมูลการติดตามแปลงสาธิต",
    };
  }

  const errors: string[] = [];

  // 1. Condition & Growth
  if (!actualState.t7CropCondition?.trim()) {
    errors.push("สภาพแปลง / สภาพพืช (สมบูรณ์, มีปัญหา, ปานกลาง, ทรุดโทรม)");
  }

  if (!actualState.t7GrowthStage?.trim()) {
    errors.push("ระยะการเจริญเติบโตของพืช");
  }

  // 2. If problem found, require problem description
  if (
    actualState.t7CropCondition === "มีปัญหา" ||
    actualState.t7CropCondition === "ทรุดโทรม" ||
    actualState.t7ProductResponse === "พบปัญหา"
  ) {
    const hasDesc = Boolean(
      actualState.t7CropProblemDescription?.trim() ||
      actualState.t7ProblemDescription?.trim(),
    );
    if (!hasDesc) {
      errors.push("รายละเอียดปัญหาของสภาพพืช / การใช้ผลิตภัณฑ์");
    }
  }

  // 3. If final completion (yield recorded)
  if (actualState.t7PlotStatus === "COMPLETED") {
    if (!actualState.t7FinalYieldKg && !actualState.t7FinalSummaryNotes?.trim()) {
      errors.push("ผลผลิตจริง หรือ บทสรุปผลการจัดทำแปลงสาธิตเมื่อเสร็จสิ้นโครงการ");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    error: errors[0],
  };
}
