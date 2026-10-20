import { z } from "zod";
import type { Type14PlanInput, Type14ValidationResult } from "../types/planned.types";

/**
 * Validates TYPE_14 (ติดตามแปลงแฮทแทค) plan form values.
 */
export function validateType14FormValues(
  type14Data: Type14PlanInput,
): Type14ValidationResult {
  if (!type14Data) {
    return {
      isValid: false,
      error: "กรุณากรอกข้อมูลติดตามแปลงแฮทแทค (TYPE_14)",
    };
  }

  // 1. Existing plot mode validation
  if (type14Data.mode === "EXISTING_PLOT") {
    const hasPlots =
      (type14Data.selectedPlotIds && type14Data.selectedPlotIds.length > 0) ||
      (type14Data.demoPlotIds && type14Data.demoPlotIds.length > 0) ||
      Boolean(type14Data.demoPlotId);

    if (!hasPlots) {
      return {
        isValid: false,
        error: "กรุณาเลือกแปลงแฮตแทคที่ต้องการติดตามอย่างน้อย 1 แปลง (TYPE_14)",
      };
    }
  }

  // 2. New plot mode validation
  if (type14Data.mode === "NEW_PLOT") {
    if (!type14Data.name?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุชื่อแปลงแฮตแทค (TYPE_14)",
      };
    }
    if (!type14Data.storeId) {
      return {
        isValid: false,
        error: "กรุณาเลือกร้านค้า / Dealer ผู้รับผิดชอบ (TYPE_14)",
      };
    }
    if (!type14Data.province?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุจังหวัดของแปลงแฮตแทค (TYPE_14)",
      };
    }
  }

  // 3. Product withdrawal validation
  if (type14Data.hasProductWithdrawal) {
    if (!type14Data.withdrawnProducts || type14Data.withdrawnProducts.length === 0) {
      return {
        isValid: false,
        error: "กรุณาระบุรายการสินค้าที่ต้องการเบิกสำหรับการติดตามแปลง (TYPE_14)",
      };
    }
    for (let i = 0; i < type14Data.withdrawnProducts.length; i++) {
      const p = type14Data.withdrawnProducts[i];
      if (!p.productId) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้าในรายการเบิกที่ ${i + 1}`,
        };
      }
      if (Number(p.quantity) <= 0) {
        return {
          isValid: false,
          error: `จำนวนสินค้าในรายการที่ ${i + 1} ต้องมากกว่า 0`,
        };
      }
    }
  }

  return { isValid: true };
}

// ── TYPE_14 Zod Schemas ──────────────────────────────────────────────
export const type14WithdrawnProductSchema = z.object({
  productId: z.string().min(1, "กรุณาเลือกสินค้า"),
  productName: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "จำนวนต้องมากกว่า 0"),
  unit: z.string().optional(),
});

export const type14PlanInputSchema = z.object({
  mode: z.enum(["EXISTING_PLOT", "NEW_PLOT"]).default("EXISTING_PLOT"),
  selectedPlanId: z.string().optional().nullable(),
  demoPlotId: z.string().optional().nullable(),
  selectedPlotIds: z.array(z.string()).optional(),
  demoPlotIds: z.array(z.string()).optional(),
  name: z.string().optional(),
  storeId: z.string().optional(),
  dealerName: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  cropCategory: z.string().optional().nullable(),
  cropName: z.string().optional().nullable(),
  areaRai: z.coerce.number().optional().nullable(),
  treeCount: z.coerce.number().optional().nullable(),
  province: z.string().optional(),
  district: z.string().optional(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  hasProductWithdrawal: z.boolean().default(false),
  withdrawnProducts: z.array(type14WithdrawnProductSchema).optional(),
});
