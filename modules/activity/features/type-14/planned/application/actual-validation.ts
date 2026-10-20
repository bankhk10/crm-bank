import { z } from "zod";
import type { Type14SprayRoundState } from "../../shared/types";
import type { Type14ValidationResult } from "../types/planned.types";

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) tracking rounds actual execution.
 */
export function validateType14Actual(
  input:
    | Type14SprayRoundState[]
    | { rounds?: Type14SprayRoundState[]; sprayRounds?: Type14SprayRoundState[] }
    | any,
): Type14ValidationResult {
  const rounds: Type14SprayRoundState[] = Array.isArray(input)
    ? input
    : input?.rounds || input?.sprayRounds || [];

  if (!rounds || rounds.length === 0) {
    return {
      isValid: false,
      error: "กรุณาบันทึกรอบการติดตามแปลงแฮทแทคอย่างน้อย 1 รอบ (TYPE_14)",
    };
  }

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    if (!round.actualVisitDate?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุวันที่ติดตามผลในรอบที่ ${round.roundNumber || i + 1} (TYPE_14)`,
      };
    }

    if (!round.trackingResult?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุผลการติดตามในรอบที่ ${round.roundNumber || i + 1} (TYPE_14)`,
      };
    }
  }

  return { isValid: true };
}

// ── TYPE_14 Actual Zod Schemas ──────────────────────────────────────
export const type14TrackingProductSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  productName: z.string().optional(),
  actualRate: z.string().optional(),
  quantityUsed: z.coerce.number().optional(),
  unit: z.string().optional(),
  detail: z.string().optional(),
});

export const type14TrackingRoundSchema = z.object({
  id: z.string().optional(),
  roundNumber: z.number().min(1),
  actualVisitDate: z.string().min(1, "กรุณาระบุวันที่ติดตามผล"),
  daysAfterSpray: z.string().optional(),
  trackingResult: z.string().min(1, "กรุณาระบุผลการติดตาม"),
  productResponse: z.string().optional(),
  additionalNotes: z.string().optional(),
  products: z.array(type14TrackingProductSchema).optional(),
});
