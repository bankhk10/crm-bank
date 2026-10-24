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

  // 1. Visit Date & Days after spray
  if (!actualState.t7VisitDate && !actualState.actualStartDate) {
    // If neither is present, warn or validate
    // Note: It's recommended to have visit date
  }

  // 2. Validate Spraying Rounds
  const rounds = actualState.t7SprayingRounds;
  if (Array.isArray(rounds) && rounds.length > 0) {
    rounds.forEach((round, rIdx) => {
      const rNum = round.roundNumber || rIdx + 1;
      if (!round.sprayMethod) {
        errors.push(`รอบที่ ${rNum}: กรุณาเลือกวิธีการฉีดพ่น`);
      }
      if (!round.sprayEquipment) {
        errors.push(`รอบที่ ${rNum}: กรุณาเลือกอุปกรณ์ที่ใช้ฉีดพ่น`);
      }
      if (
        (round.sprayEquipment === "อื่นๆ ระบุ..." || round.sprayEquipment === "อื่นๆ (ระบุ)") &&
        !round.otherEquipment?.trim()
      ) {
        errors.push(`รอบที่ ${rNum}: กรุณาระบุชื่ออุปกรณ์ฉีดพ่นเพิ่มเติม`);
      }
      if (round.productResponse === "พบปัญหา / พืชมีอาการผิดปกติ" && !round.problemDetail?.trim()) {
        errors.push(`รอบที่ ${rNum}: กรุณาระบุรายละเอียดปัญหาหรืออาการผิดปกติ`);
      }

      // Check additional products
      if (Array.isArray(round.additionalProducts)) {
        round.additionalProducts.forEach((ap, pIdx) => {
          if (!ap.productId) {
            errors.push(`รอบที่ ${rNum} สินค้าเพิ่มเติมรายการที่ ${pIdx + 1}: กรุณาเลือกสินค้า`);
          }
          const qty =
            ap.actualQuantity != null && ap.actualQuantity !== ""
              ? ap.actualQuantity
              : ap.quantityUsed;
          if (qty == null || qty === "" || Number(qty) <= 0) {
            errors.push(`รอบที่ ${rNum} สินค้าเพิ่มเติมรายการที่ ${pIdx + 1}: กรุณาระบุจำนวนที่ใช้จริง`);
          }
        });
      }
    });
  }

  // 3. Backward-compatible validation for crop condition if round not used
  if (!rounds || rounds.length === 0) {
    if (!actualState.t7CropCondition?.trim()) {
      errors.push("สภาพแปลง / สภาพพืช (สมบูรณ์, มีปัญหา, ปานกลาง, ทรุดโทรม)");
    }
  }

  // 4. If final completion (COMPLETED status)
  if (actualState.t7PlotStatus === "COMPLETED") {
    if (!actualState.t7FinalYieldKg && !actualState.t7FinalSummaryNotes?.trim() && !actualState.t7Notes?.trim()) {
      // Optional advisory or note
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    error: errors[0],
  };
}
