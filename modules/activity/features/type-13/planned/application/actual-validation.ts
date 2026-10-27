import { z } from "zod";
import type { Type13PlotActualState } from "../types/actual.types";
import type { Type13ValidationResult } from "../types/planned.types";

/**
 * Validates TYPE 13 (ฉีดแปลงแฮตแทค) plots and spraying rounds actual execution.
 */
export function validateType13Actual(
  input:
    | Type13PlotActualState[]
    | { type13Plots?: Type13PlotActualState[]; plots?: Type13PlotActualState[] }
    | any,
): Type13ValidationResult {
  const plots: Type13PlotActualState[] = Array.isArray(input)
    ? input
    : input?.type13Plots || input?.plots || [];

  if (!plots || plots.length === 0) {
    return {
      isValid: false,
      error: "ต้องมีแปลงอย่างน้อย 1 แปลงสำหรับการบันทึกผล (TYPE_13)",
    };
  }

  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (
      p.actualPlotsCount == null ||
      String(p.actualPlotsCount).trim() === "" ||
      Number(p.actualPlotsCount) <= 0
    ) {
      return {
        isValid: false,
        error: `แปลงที่ ${i + 1}: กรุณาระบุจำนวนแปลงที่ฉีดพ่นจริง`,
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
            error: `แปลงที่ ${i + 1}: กรุณาระบุจำนวนที่ใช้จริงสำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
          };
        }
        if (!prod.actualRate || !String(prod.actualRate).trim()) {
          return {
            isValid: false,
            error: `แปลงที่ ${i + 1}: กรุณาระบุอัตราการใช้สำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
          };
        }
      }
    }

    if (p.afterSprayImages && p.afterSprayImages.length > 20) {
      return {
        isValid: false,
        error: `แปลงที่ ${i + 1}: อัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้าน`,
      };
    }
  }

  return { isValid: true };
}

// ── TYPE_13 Actual Zod Schemas ─────────────────────────────
export const type13SprayProductSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  productName: z.string().optional().nullable(),
  actualRate: z.string().min(1, "กรุณาระบุอัตราการฉีดพ่นจริง"),
  quantityUsed: z.coerce.number().min(0, "จำนวนที่ใช้ต้องไม่ติดลบ"),
  unit: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
});

export const type13SprayExternalSchema = z.object({
  company: z.string().min(1, "กรุณาระบุบริษัท"),
  productName: z.string().min(1, "กรุณาระบุชื่อยา/สารเคมี"),
  activeIngredient: z.string().optional().nullable(),
  formula: z.string().min(1, "กรุณาเลือกสูตรยา"),
  customFormula: z.string().optional().nullable(),
  applicationRate: z.string().min(1, "กรุณาระบุอัตราการใช้"),
});

export const type13SprayingRoundSchema = z.object({
  id: z.string().optional(),
  demoPlotId: z.string().min(1),
  roundNumber: z.number().min(1),
  sprayDate: z.union([z.string(), z.date()]),
  sprayMethod: z.enum(["SINGLE", "TANK_MIXED"]),
  sprayEquipment: z.string().min(1, "กรุณาระบุอุปกรณ์ที่ใช้"),
  otherEquipment: z.string().optional().nullable(),
  productResponse: z.string().min(1, "กรุณาระบุผลหลังการฉีดพ่น"),
  problemDetail: z.string().optional().nullable(),
  products: z.array(type13SprayProductSchema),
  externalProducts: z.array(type13SprayExternalSchema).optional().default([]),
  attachments: z
    .array(z.any())
    .max(20, "รูปภาพต้องไม่เกิน 20 รูปต่อหมู่บ้าน")
    .optional()
    .default([]),
});

export const type13PlotActualSchema = z.object({
  demoPlotId: z.string().min(1),
  latitude: z.string().min(1, "กรุณาระบุละติจูด (Latitude) ของแปลง"),
  longitude: z.string().min(1, "กรุณาระบุลองจิจูด (Longitude) ของแปลง"),
  sprayRounds: z
    .array(type13SprayingRoundSchema)
    .min(1, "ต้องมีรอบการฉีดพ่นอย่างน้อย 1 รอบ"),
});
