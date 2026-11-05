import { z } from "zod";
import type {
  Type14UnplannedItem,
  Type14UnplannedValidationResult,
} from "../types/unplanned.types";

/**
 * Validates Type 14 Unplanned plot setup and tracking execution data (2-in-1 Plan + Actual)
 */
export function validateType14UnplannedItem(
  item: Type14UnplannedItem,
): Type14UnplannedValidationResult {
  if (!item) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลการติดตามแปลงแฮตแทค (TYPE_14)",
    };
  }

  const mode = item.mode || "EXISTING_PLOT";
  const plots = item.plots && item.plots.length > 0 ? item.plots : [item];

  // 1. Validation for Existing Plot Mode
  if (mode === "EXISTING_PLOT") {
    const hasSourcePlan = Boolean(item.selectedPlanId);
    const hasExistingPlots =
      plots.length > 0 &&
      plots.some(
        (p: any) =>
          p.type13TargetId ||
          p.demoPlotId ||
          (p.name && !p.name.includes("default")),
      );

    if (!hasSourcePlan && !hasExistingPlots) {
      return {
        isValid: false,
        error: "กรุณาเลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) เพื่อติดตามผล (TYPE_14)",
      };
    }
  }

  // 2. Validation for New Plot Mode
  if (mode === "NEW_PLOT") {
    const primaryPlot = plots[0] || item;

    if (!primaryPlot.name?.trim() && !primaryPlot.plotName?.trim()) {
      return { isValid: false, error: "กรุณาระบุชื่อแปลงแฮตแทค (TYPE_14)" };
    }

    if (!primaryPlot.storeId?.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงแฮตแทค (TYPE_14)",
      };
    }

    if (!primaryPlot.province?.trim()) {
      return { isValid: false, error: "กรุณาระบุจังหวัดของแปลงแฮตแทค (TYPE_14)" };
    }

    if (!primaryPlot.district?.trim()) {
      return { isValid: false, error: "กรุณาระบุอำเภอของแปลงแฮตแทค (TYPE_14)" };
    }
  }

  // 3. Validation for Actual Outcome fields on each plot
  for (let i = 0; i < plots.length; i++) {
    const p: any = plots[i];
    const plotLabel = `แปลงที่ ${i + 1}`;

    // Actual plots count
    if (
      p.actualPlotsCount == null ||
      String(p.actualPlotsCount).trim() === "" ||
      Number(p.actualPlotsCount) <= 0
    ) {
      return {
        isValid: false,
        error: `${plotLabel}: กรุณาระบุจำนวนแปลงที่ติดตามจริง (TYPE_14)`,
      };
    }

    // Actual visit date
    const visitDate = p.actualVisitDate || item.actualVisitDate;
    if (!visitDate || !String(visitDate).trim()) {
      return {
        isValid: false,
        error: `${plotLabel}: กรุณาระบุวันที่ติดตามผลแปลงแฮตแทค (TYPE_14)`,
      };
    }

    // Products validation
    if (p.products && p.products.length > 0) {
      for (let j = 0; j < p.products.length; j++) {
        const prod = p.products[j];
        if (prod.productId) {
          if (
            prod.actualQuantity == null ||
            String(prod.actualQuantity).trim() === "" ||
            Number(prod.actualQuantity) < 0
          ) {
            return {
              isValid: false,
              error: `${plotLabel}: กรุณาระบุจำนวนที่ใช้จริงสำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
            };
          }
          if (!prod.actualRate || !String(prod.actualRate).trim()) {
            return {
              isValid: false,
              error: `${plotLabel}: กรุณาระบุอัตราการใช้สำหรับสินค้า "${prod.productName || `ลำดับที่ ${j + 1}`}"`,
            };
          }
        }
      }
    }

    // Images count validation (max 20 per plot)
    const images = p.afterSprayImages || p.images || [];
    if (images.length > 20) {
      return {
        isValid: false,
        error: `${plotLabel}: อัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้าน (TYPE_14)`,
      };
    }
  }

  return { isValid: true };
}

export const type14UnplannedSchema = z.object({
  mode: z.enum(["EXISTING_PLOT", "NEW_PLOT"]).default("EXISTING_PLOT"),
  selectedPlanId: z.string().nullable().optional(),
  name: z.string().optional(),
  storeId: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  actualPlotsCount: z.union([z.number(), z.string()]).optional(),
  actualVisitDate: z.string().optional(),
  trackingResult: z.string().optional(),
});
