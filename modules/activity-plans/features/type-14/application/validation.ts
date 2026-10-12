import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  ValidateType14Params,
  Type14ValidationResult,
  Type14ActualValidationInput,
} from "../types";

export type { ValidateType14Params, Type14ValidationResult, Type14ActualValidationInput };

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) plan form values.
 */
export function validateType14FormValues({
  selectedWorkTypes,
  type14Data,
}: ValidateType14Params): Type14ValidationResult {
  const hasType14Selected = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_14" ||
      t === "ติดตามแปลงแฮทแทค" ||
      t === "TYPE_14",
  );
  if (!hasType14Selected) {
    return { isValid: true };
  }

  if (
    !type14Data.selectedPlanId?.trim() &&
    !type14Data.demoPlotId?.trim() &&
    (!type14Data.selectedPlotIds || type14Data.selectedPlotIds.length === 0)
  ) {
    return {
      isValid: false,
      error: "กรุณาเลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง (TYPE_14)",
    };
  }
  const hasPlotSelected =
    type14Data.demoPlotId?.trim() ||
    (type14Data.selectedPlotIds && type14Data.selectedPlotIds.length > 0);
  if (!hasPlotSelected) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงแฮตแทคที่ต้องการติดตามอย่างน้อย 1 แปลง (TYPE_14)",
    };
  }

  if (type14Data.hasProductWithdrawal) {
    const prods = type14Data.withdrawnProducts || [];
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการสินค้าที่ต้องการเบิกอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      if (!p.productId?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้าสำหรับรายการที่ ${i + 1}`,
        };
      }
      if (!p.quantity || Number(p.quantity) <= 0) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนสินค้าที่มากกว่า 0 สำหรับรายการที่ ${i + 1}`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) tracking rounds actual execution.
 */
export function validateType14Actual(
  input: Type14ActualValidationInput,
): Type14ValidationResult {
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
