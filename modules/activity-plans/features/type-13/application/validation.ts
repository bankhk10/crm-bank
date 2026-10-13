import { z } from "zod";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type13PlotItem,
  Type13WithdrawnProductLine,
  Type13PlotActualState,
  ValidateType13Params,
  Type13ValidationResult,
} from "../types";

export type { ValidateType13Params, Type13ValidationResult };

/**
 * Validates TYPE 13 (ฉีดแปลงแฮตแทค) plan form values.
 */
export function validateType13FormValues({
  selectedWorkTypes,
  type13Plots,
  hasProductWithdrawal,
  withdrawnProducts,
}: ValidateType13Params): Type13ValidationResult {
  const hasType13Selected = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_13" ||
      t === "ฉีดแปลงแฮตแทค" ||
      t === "TYPE_13",
  );
  if (!hasType13Selected) {
    return { isValid: true };
  }

  if (!type13Plots || type13Plots.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง",
    };
  }

  if (type13Plots.length > 10) {
    return {
      isValid: false,
      error: "เพิ่มแปลงแฮตแทคได้สูงสุดไม่เกิน 10 แปลง",
    };
  }

  for (let i = 0; i < type13Plots.length; i++) {
    const plot = type13Plots[i];
    const plotNum = i + 1;
    const plotLabel = `แปลงที่ ${plotNum}`;

    if (!plot.storeId?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกร้านค้า Dealer สำหรับ ${plotLabel}`,
      };
    }
    if (!plot.province?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกจังหวัดสำหรับ ${plotLabel}`,
      };
    }
    if (!plot.district?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกอำเภอสำหรับ ${plotLabel}`,
      };
    }
  }

  if (hasProductWithdrawal) {
    const prods = withdrawnProducts || [];
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการสินค้าที่ต้องการเบิกอย่างน้อย 1 รายการ (TYPE_13)",
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
 * Validates TYPE 13 (ฉีดแปลงแฮตแทค) plots and spraying rounds actual execution.
 */
export function validateType13Actual(
  plots: Type13PlotActualState[],
): Type13ValidationResult {
  if (!plots || plots.length === 0) {
    return {
      isValid: false,
      error: "ต้องมีแปลงอย่างน้อย 1 แปลงสำหรับการบันทึกผล (TYPE_13)",
    };
  }

  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (!p.plotName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุชื่อแปลง (แปลงที่ ${i + 1})`,
      };
    }
    if (!p.latitude?.trim() || !p.longitude?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุพิกัด Latitude และ Longitude ให้ครบถ้วน (${p.plotName})`,
      };
    }
  }

  return { isValid: true };
}

// ── TYPE_13 ("ฉีดแปลงแฮตแทค") Zod Schemas ─────────────────────────────
export const type13ProductLineSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "กรุณาเลือกตัวยา/ผลิตภัณฑ์"),
  productName: z.string().optional().nullable(),
  quantity: z.number().min(1, "จำนวนต้องอย่างน้อย 1"),
  unit: z.string().optional().nullable(),
});

export const type13PlotItemSchema = z.object({
  id: z.string(),
  demoPlotId: z.string().optional().nullable(),
  name: z.string().optional().default(""),
  storeId: z.string().min(1, "กรุณาเลือกร้านค้า Dealer"),
  ownerName: z.string().optional().nullable(),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  district: z.string().min(1, "กรุณาเลือกอำเภอ"),
  subdistrict: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  plannedPlotsCount: z.union([z.number(), z.string()]).optional().nullable(),
  products: z.array(type13ProductLineSchema).optional().default([]),
});

export const type13WithdrawnProductInputSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "กรุณาเลือกตัวยา/ผลิตภัณฑ์"),
  productName: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1, "จำนวนต้องอย่างน้อย 1"),
  unit: z.string().optional().nullable(),
});

export const type13PlanInputSchema = z.object({
  hasProducts: z.boolean().optional(),
  hasProductWithdrawal: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  plots: z.array(type13PlotItemSchema).optional().default([]),
  products: z.array(type13WithdrawnProductInputSchema).optional().default([]),
  withdrawnProducts: z
    .array(type13WithdrawnProductInputSchema)
    .optional()
    .default([]),
});

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
    .max(2, "รูปภาพก่อนฉีดพ่นต้องไม่เกิน 2 รูปต่อรอบ")
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

export type Type13ProductLine = z.infer<typeof type13ProductLineSchema>;
export type Type13PlotItemInput = z.infer<typeof type13PlotItemSchema>;
export type Type13PlanInput = z.infer<typeof type13PlanInputSchema>;
export type Type13SprayingRound = z.infer<typeof type13SprayingRoundSchema>;
export type Type13PlotActual = z.infer<typeof type13PlotActualSchema>;
