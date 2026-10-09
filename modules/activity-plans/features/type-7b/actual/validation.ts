import type { ImageFile, Type7bSprayingRoundItem } from "../../shared/actual-view/types";

export interface Type7bActualValidationInput {
  activityResultStatus?: string;
  t7PlannedProductId?: string | null;
  t7ActualProductId?: string | null;
  t7ChangeReason?: string;
  actualStartDate?: string;
  t7DaysAfterSpray?: number | string;
  t7CropImages?: ImageFile[];
  t7bSprayingRounds?: Type7bSprayingRoundItem[];
  t7PlotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "";
  t7FinalSummaryNotes?: string;
}

/**
 * Validates TYPE_7B (ติดตามแปลงสาธิต) actual results
 */
export function validateType7bActual(
  input: Type7bActualValidationInput,
): { isValid: boolean; error?: string } {
  // Validate Type 7 Product Change
  const isT7ProductChanged =
    Boolean(input.t7ActualProductId) &&
    Boolean(input.t7PlannedProductId) &&
    input.t7ActualProductId !== input.t7PlannedProductId;

  if (isT7ProductChanged && (!input.t7ChangeReason || !input.t7ChangeReason.trim())) {
    return {
      isValid: false,
      error: "กรุณาระบุเหตุผลการเปลี่ยนสินค้าหน้างาน (Work Type 7)",
    };
  }

  if (input.activityResultStatus !== "COMPLETED") {
    return { isValid: true };
  }

  if (!input.actualStartDate) {
    return {
      isValid: false,
      error: "กรุณาระบุวันที่ติดตามจริง (Work Type 7B)",
    };
  }

  if (
    input.t7DaysAfterSpray === undefined ||
    input.t7DaysAfterSpray === null ||
    input.t7DaysAfterSpray === ""
  ) {
    return {
      isValid: false,
      error: "กรุณาระบุจำนวนวันหลังฉีดพ่น (Work Type 7B)",
    };
  }

  if (input.t7CropImages && input.t7CropImages.length > 5) {
    return {
      isValid: false,
      error: "รูปผลหลังการฉีดพ่น (รูปภาพสภาพพืช) สามารถแนบได้สูงสุด 5 รูป (Work Type 7B)",
    };
  }

  if (input.t7bSprayingRounds && input.t7bSprayingRounds.length > 0) {
    for (const sr of input.t7bSprayingRounds) {
      if (!sr.productRates || sr.productRates.length === 0) {
        return {
          isValid: false,
          error: `รอบการฉีดพ่นที่ ${sr.roundNumber} ต้องมีรายการผลิตภัณฑ์อย่างน้อย 1 รายการ`,
        };
      }
      for (const pr of sr.productRates) {
        if (pr.isAdditional && (!pr.productId || !pr.productName)) {
          return {
            isValid: false,
            error: `กรุณาเลือกสินค้าเพิ่มเติมในรอบที่ ${sr.roundNumber}`,
          };
        }
        if (
          pr.quantityUsed === undefined ||
          pr.quantityUsed === null ||
          pr.quantityUsed === "" ||
          isNaN(Number(pr.quantityUsed)) ||
          Number(pr.quantityUsed) < 0
        ) {
          return {
            isValid: false,
            error: `กรุณาระบุจำนวนที่ใช้ยาในรอบนี้ของ ${pr.productName || "สินค้า"} ในรอบที่ ${sr.roundNumber}`,
          };
        }
      }
      if (sr.sprayMethod === "TANK_MIXED" && sr.hasExternalChemicals) {
        if (!sr.externalProducts || sr.externalProducts.length === 0) {
          return {
            isValid: false,
            error: `กรุณาระบุสารเคมีภายนอกอย่างน้อย 1 รายการ หรือยกเลิกการเลือกมียาภายนอก ในรอบที่ ${sr.roundNumber}`,
          };
        }
        if (sr.externalProducts.length > 4) {
          return {
            isValid: false,
            error: `สามารถระบุสารเคมีภายนอกได้สูงสุด 4 รายการ ในรอบที่ ${sr.roundNumber}`,
          };
        }
      }
      if (!sr.sprayEquipment) {
        return {
          isValid: false,
          error: `กรุณาเลือกอุปกรณ์ที่ใช้ฉีดพ่นในรอบที่ ${sr.roundNumber}`,
        };
      }
      if (
        sr.sprayEquipment === "อื่นๆ ระบุ.." &&
        (!sr.otherEquipment || !sr.otherEquipment.trim())
      ) {
        return {
          isValid: false,
          error: `กรุณาระบุอุปกรณ์ฉีดพ่นอื่นๆ ในรอบที่ ${sr.roundNumber}`,
        };
      }
      if (!sr.productResponse) {
        return {
          isValid: false,
          error: `กรุณาเลือกผลหลังการฉีดพ่นในรอบที่ ${sr.roundNumber}`,
        };
      }
      if (
        sr.productResponse === "พบปัญหา" &&
        (!sr.problemDetail || !sr.problemDetail.trim())
      ) {
        return {
          isValid: false,
          error: `กรุณาระบุรายละเอียดปัญหาที่พบหลังการฉีดพ่นในรอบที่ ${sr.roundNumber}`,
        };
      }
      if (sr.plotImages && sr.plotImages.length > 5) {
        return {
          isValid: false,
          error: `รูปการฉีดพ่นในรอบที่ ${sr.roundNumber} สามารถแนบได้สูงสุด 5 รูป`,
        };
      }
    }
  }

  if (
    input.t7PlotStatus === "FAILED" &&
    (!input.t7FinalSummaryNotes || !input.t7FinalSummaryNotes.trim())
  ) {
    return {
      isValid: false,
      error: "กรุณาระบุรายละเอียดสาเหตุที่ยุติการทดลอง (Work Type 7B)",
    };
  }

  return { isValid: true };
}
