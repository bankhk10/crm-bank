import type {
  Type7bUnplannedItem,
  Type7bUnplannedValidationResult,
} from "../types/unplanned.types";

export type { Type7bUnplannedValidationResult };

/**
 * Validates Type 7B Unplanned Activity Items (aligned with Type 7B Actual Form)
 */
export function validateType7bUnplannedItems(
  items: Type7bUnplannedItem[],
): Type7bUnplannedValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการติดตามแปลงสาธิตอย่างน้อย 1 แปลง",
      errors: ["กรุณาระบุข้อมูลการติดตามแปลงสาธิตอย่างน้อย 1 แปลง"],
    };
  }

  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prefix = `แปลงที่ ${i + 1}`;

    // 1. Plot Information Validation
    if (!item.plotName?.trim() && !item.demoPlotId) {
      errors.push(`${prefix}: กรุณาเลือกหรือระบุชื่อแปลงสาธิต`);
    }

    if (!item.farmerName?.trim()) {
      errors.push(`${prefix}: กรุณาระบุชื่อเจ้าของแปลง (เกษตรกร)`);
    }

    if (!item.cropName?.trim()) {
      errors.push(`${prefix}: กรุณาระบุพืชเป้าหมาย`);
    }

    // 2. Section 1: Tracking Details Validation
    if (item.daysAfterSpray != null && Number(item.daysAfterSpray) < 0) {
      errors.push(`${prefix}: จำนวนวันหลังฉีดพ่นต้องไม่ต่ำกว่า 0 วัน`);
    }

    // 3. Section 2: Multiple Spraying Rounds Validation
    const rounds = item.sprayingRounds || [];
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const round = rounds[rIdx];
      const rNum = round.roundNumber || rIdx + 1;
      const rPrefix = `${prefix} (รอบที่ ${rNum})`;

      // 1. สินค้าที่ใช้ในการปฏิบัติงาน (Products Used)
      const additionalProds = round.additionalProducts || [];
      for (let aIdx = 0; aIdx < additionalProds.length; aIdx++) {
        const ap = additionalProds[aIdx];
        if (!ap.productId?.trim()) {
          errors.push(`${rPrefix}: กรุณาเลือกสินค้าลำดับที่ ${aIdx + 1}`);
        }
        const qty = ap.actualQuantity ?? ap.quantityUsed;
        if (qty == null || qty === "" || Number(qty) < 0) {
          errors.push(`${rPrefix}: กรุณาระบุจำนวนที่ใช้จริงของสินค้าลำดับที่ ${aIdx + 1}`);
        }
        const rate = ap.applicationRate || ap.actualRate;
        if (!rate?.trim()) {
          errors.push(`${rPrefix}: กรุณาระบุอัตราการใช้ของสินค้าลำดับที่ ${aIdx + 1}`);
        }
      }

      // ตรวจสอบ baseline products หากมีส่งเข้ามา (เพื่อรองรับ backward compatibility)
      const baselineProds = round.baselineProducts || [];
      for (let pIdx = 0; pIdx < baselineProds.length; pIdx++) {
        const bp = baselineProds[pIdx];
        if (bp.productId) {
          const qty = bp.actualQuantity ?? bp.quantityUsed;
          if (qty == null || qty === "" || Number(qty) < 0) {
            errors.push(`${rPrefix}: กรุณาระบุจำนวนที่ใช้จริงของ "${bp.productName || 'สินค้าตามแผน'}"`);
          }
          const rate = bp.applicationRate || bp.actualRate;
          if (!rate?.trim()) {
            errors.push(`${rPrefix}: กรุณาระบุอัตราการใช้ของ "${bp.productName || 'สินค้าตามแผน'}"`);
          }
        }
      }

      // 2. Spray Method & Tank-mixed External Chemicals
      if (round.sprayMethod === "TANK_MIXED" && round.hasExternalChemicals) {
        const exts = round.externalProducts || [];
        for (let eIdx = 0; eIdx < exts.length; eIdx++) {
          const ext = exts[eIdx];
          if (!ext.productName?.trim()) {
            errors.push(`${rPrefix}: กรุณาระบุชื่อสินค้าของยาภายนอกลำดับที่ ${eIdx + 1}`);
          }
          if (ext.formula === "อื่นๆ" && !ext.customFormula?.trim()) {
            errors.push(`${rPrefix}: กรุณาระบุสูตรเพิ่มเติมของยาภายนอกลำดับที่ ${eIdx + 1}`);
          }
          if (!ext.applicationRate?.trim()) {
            errors.push(`${rPrefix}: กรุณาระบุอัตราการใช้ของยาภายนอกลำดับที่ ${eIdx + 1}`);
          }
        }
      }

      // 3. Spray Equipment
      if (
        (round.sprayEquipment === "อื่นๆ (ระบุ)" || round.sprayEquipment === "อื่นๆ ระบุ...") &&
        !round.otherEquipment?.trim()
      ) {
        errors.push(`${rPrefix}: กรุณาระบุอุปกรณ์การฉีดพ่นเพิ่มเติม`);
      }
    }

    // Legacy withdrawn products validation
    if (item.hasProductWithdrawal && item.withdrawnProducts) {
      for (let j = 0; j < item.withdrawnProducts.length; j++) {
        const prod = item.withdrawnProducts[j];
        if (!prod.productId) {
          errors.push(`${prefix} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาเลือกสินค้า`);
        }
        if (prod.quantity == null || Number(prod.quantity) <= 0) {
          errors.push(`${prefix} สินค้าเบิกลำดับที่ ${j + 1}: กรุณาระบุจำนวนสินค้าที่ถูกต้อง`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    error: errors[0],
  };
}
