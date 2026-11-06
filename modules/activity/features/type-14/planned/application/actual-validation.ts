import { z } from "zod";
import type { Type14PlotActualState, Type14SprayRoundState } from "../../shared/types";
import type { Type14ValidationResult } from "../types/planned.types";

/**
 * Validates TYPE_14 (ติดตามแปลงแฮตแทค) actual execution (plot-based, matching TYPE_13).
 */
export function validateType14Actual(
  input:
    | Type14PlotActualState[]
    | {
        plots?: Type14PlotActualState[];
        type14Plots?: Type14PlotActualState[];
        rounds?: Type14SprayRoundState[];
        sprayRounds?: Type14SprayRoundState[];
      }
    | any,
): Type14ValidationResult {
  const plots: Type14PlotActualState[] = Array.isArray(input)
    ? input
    : input?.plots || input?.type14Plots || input?.type14Actual?.plots || [];

  if (plots && plots.length > 0) {
    for (let pIdx = 0; pIdx < plots.length; pIdx++) {
      const p = plots[pIdx];
      if (
        p.actualPlotsCount == null ||
        String(p.actualPlotsCount).trim() === "" ||
        Number(p.actualPlotsCount) <= 0
      ) {
        return {
          isValid: false,
          error: `แปลงที่ ${pIdx + 1}: กรุณาระบุจำนวนแปลงที่ติดตามจริง (TYPE_14)`,
        };
      }

      if (p.products && p.products.length > 0) {
        for (let j = 0; j < p.products.length; j++) {
          const prod = p.products[j];
          if (
            prod.actualQuantity == null ||
            String(prod.actualQuantity).trim() === "" ||
            Number(prod.actualQuantity) < 0
          ) {
            return {
              isValid: false,
              error: `แปลงที่ ${pIdx + 1}: กรุณาระบุจำนวนที่ใช้จริงสำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
            };
          }
          if (!prod.actualRate || !String(prod.actualRate).trim()) {
            return {
              isValid: false,
              error: `แปลงที่ ${pIdx + 1}: กรุณาระบุอัตราการใช้สำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
            };
          }
        }
      }

      if (p.afterSprayImages && p.afterSprayImages.length > 20) {
        return {
          isValid: false,
          error: `แปลงที่ ${pIdx + 1}: อัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้าน (TYPE_14)`,
        };
      }
    }

    return { isValid: true };
  }

  // Legacy fallback if rounds were explicitly provided without plots
  const rounds: Type14SprayRoundState[] =
    input?.rounds || input?.sprayRounds || [];

  if (rounds && rounds.length > 0) {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      if (!round.actualVisitDate?.trim()) {
        return {
          isValid: false,
          error: `กรุณาระบุวันที่ติดตามผลในรอบที่ ${round.roundNumber || i + 1} (TYPE_14)`,
        };
      }
    }
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "ต้องมีแปลงอย่างน้อย 1 แปลงสำหรับการบันทึกผล (TYPE_14)",
  };
}

// ── TYPE_14 Actual Zod Schemas ──────────────────────────────────────
export const type14TrackingProductSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  productName: z.string().optional().nullable(),
  actualRate: z.string().min(1, "กรุณาระบุอัตราการใช้จริง"),
  quantityUsed: z.coerce.number().min(0, "จำนวนที่ใช้ต้องไม่ติดลบ"),
  unit: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  extraQuantity: z.union([z.number(), z.string()]).optional().nullable(),
  extraUnit: z.string().optional().nullable(),
});

export const type14TrackingRoundSchema = z.object({
  id: z.string().optional(),
  roundNumber: z.number().min(1),
  actualVisitDate: z.string().min(1, "กรุณาระบุวันที่ติดตามผล"),
  daysAfterSpray: z.string().optional(),
  trackingResult: z.string().optional().nullable(),
  productResponse: z.string().optional().nullable(),
  additionalNotes: z.string().optional(),
  products: z.array(type14TrackingProductSchema).optional(),
});

export const type14PlotActualSchema = z.object({
  id: z.string().optional(),
  targetId: z.string().optional(),
  type13TargetId: z.string().optional().nullable(),
  actualPlotsCount: z.coerce.number().min(1, "จำนวนแปลงต้องมากกว่า 0"),
  daysAfterSpray: z.union([z.number(), z.string()]).optional().nullable(),
  trackingResult: z.string().optional().nullable(),
  productResponse: z.string().optional().nullable(),
  plotStatus: z.enum(["IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
  closureNotes: z.string().optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
  products: z.array(type14TrackingProductSchema).optional(),
});
