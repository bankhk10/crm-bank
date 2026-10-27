import { z } from "zod";
import type {
  ValidateType13Params,
  Type13ValidationResult,
} from "../types/planned.types";

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
      t === "TYPE_13" ||
      t === "ฉีดแปลงแฮตแทค" ||
      t.includes("ฉีดแปลงแฮตแทค"),
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

    if (plot.hasProductWithdrawal) {
      const prods = plot.withdrawnProducts || [];
      if (prods.length === 0) {
        return {
          isValid: false,
          error: `กรุณาเพิ่มรายการสินค้าที่ต้องการเบิกอย่างน้อย 1 รายการ สำหรับ${plotLabel}`,
        };
      }

      for (let j = 0; j < prods.length; j++) {
        const p = prods[j];
        if (!p.productId?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือกสินค้าสำหรับรายการที่ ${j + 1} (${plotLabel})`,
          };
        }
        if (!p.quantity || Number(p.quantity) <= 0) {
          return {
            isValid: false,
            error: `กรุณาระบุจำนวนสินค้าที่มากกว่า 0 สำหรับรายการที่ ${j + 1} (${plotLabel})`,
          };
        }
      }
    }
  }

  const anyPlotWithdrawal = type13Plots.some((p) => p.hasProductWithdrawal);
  if (!anyPlotWithdrawal && hasProductWithdrawal) {
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

// ── TYPE_13 Plan Zod Schemas ─────────────────────────────
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
