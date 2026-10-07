import type { Type14SprayRoundState } from "./types";

export interface Type14ActualValidationInput {
  demoPlotId?: string;
  rounds?: Type14SprayRoundState[];
}

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) tracking rounds
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

    // Validate Products in this round
    const roundProducts = round.products || [];
    for (let i = 0; i < roundProducts.length; i++) {
      const prod = roundProducts[i];
      if (!prod.productId || !prod.productId.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้าสำหรับรายการที่ ${i + 1} ในรอบที่ ${rNum}`,
        };
      }
      if (
        prod.quantityUsed === "" ||
        isNaN(Number(prod.quantityUsed)) ||
        Number(prod.quantityUsed) < 0
      ) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนที่ใช้จริงของสินค้า "${prod.productName || "รายการที่ " + (i + 1)}" ในรอบที่ ${rNum}`,
        };
      }
    }
  }

  return { isValid: true };
}
