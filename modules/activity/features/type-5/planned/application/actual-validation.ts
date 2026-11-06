import { z } from "zod";
import type { Type5SurveyRecord } from "../types/actual.types";

export const type5SurveyRecordSchema = z.object({
  competitorBrand: z.string().min(1, "กรุณาระบุแบรนด์คู่แข่ง"),
  competitorProduct: z.string().min(1, "กรุณาระบุสินค้าคู่แข่ง"),
});

export interface Type5ActualValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateType5Actual(
  records: Type5SurveyRecord[],
): Type5ActualValidationResult {
  if (!records || records.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.competitorBrand?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุแบรนด์คู่แข่งในรายการที่ ${i + 1}`,
      };
    }
    if (!r.competitorProduct?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุสินค้าคู่แข่งในรายการที่ ${i + 1}`,
      };
    }
  }

  return { isValid: true };
}
