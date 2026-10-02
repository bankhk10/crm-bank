import type { Type14SprayRoundState } from "./types";

export interface Type14ActualValidationInput {
  demoPlotId?: string;
  rounds?: Type14SprayRoundState[];
}

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) tracking rounds and supplemental drug items
 */
export function validateType14Actual(
  input: Type14ActualValidationInput,
): { isValid: boolean; error?: string } {
  const { demoPlotId, rounds } = input;

  // 1. Required Plot & Rounds validations
  if (!demoPlotId || !demoPlotId.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงที่ต้องการติดตาม",
    };
  }
  if (!rounds || rounds.length === 0) {
    return {
      isValid: false,
      error: "ต้องมีรอบการฉีดพ่นอย่างน้อย 1 รอบ",
    };
  }

  // 2. Validate Each Round
  for (const round of rounds) {
    const rNum = round.roundNumber;
    if (!round.actualVisitDate) {
      return {
        isValid: false,
        error: `กรุณาระบุวันที่ติดตามจริง ในรอบที่ ${rNum}`,
      };
    }
    if (
      round.daysAfterSpray === "" ||
      isNaN(Number(round.daysAfterSpray)) ||
      Number(round.daysAfterSpray) < 0
    ) {
      return {
        isValid: false,
        error: `กรุณาระบุจำนวนวันหลังฉีดพ่น (ตัวเลขตั้งแต่ 0 ขึ้นไป) ในรอบที่ ${rNum}`,
      };
    }
    if (!round.trackingResult || !round.trackingResult.trim()) {
      return {
        isValid: false,
        error: `กรุณากรอกผลการติดตาม ในรอบที่ ${rNum}`,
      };
    }

    // Validate Group B Supplemental Products in this round
    for (const prod of round.supplementalProducts || []) {
      const used = Number(prod.quantityUsed) || 0;
      if (used > 0 || (prod.actualRate && prod.actualRate.trim() !== "")) {
        if (prod.supplementalStatus !== "APPROVED") {
          return {
            isValid: false,
            error: `รายการเบิกยาใหม่ "${prod.productName}" ในรอบที่ ${rNum} ยังไม่ได้รับการอนุมัติ (APPROVED) ไม่สามารถบันทึกการใช้จริงได้`,
          };
        }
      }
    }

    // Validate Group C Actual-only Products in this round
    const actualOnly = round.actualOnlyProducts || [];
    for (let i = 0; i < actualOnly.length; i++) {
      const prod = actualOnly[i];
      if (!prod.productId || !prod.productId.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกตัวยาสำหรับยานอกแผนรายการที่ ${i + 1} ในรอบที่ ${rNum}`,
        };
      }
      if (
        prod.quantityUsed === "" ||
        isNaN(Number(prod.quantityUsed)) ||
        Number(prod.quantityUsed) < 0
      ) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนที่ใช้จริงของยานอกแผน "${prod.productName || "รายการที่ " + (i + 1)}" ในรอบที่ ${rNum}`,
        };
      }
    }
  }

  return { isValid: true };
}
