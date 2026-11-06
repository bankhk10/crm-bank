import { OTHER_CROP_OPTIONS } from "../../shared/constants";
import type {
  Type7aPlanItem,
  Type7aValidationResult,
  ValidateType7aOptions,
} from "../types/planned.types";

/**
 * Validate Type 7A Plan Items before saving
 */
export function validateType7aFormItems(
  plots: Type7aPlanItem[],
  options: ValidateType7aOptions = {},
): Type7aValidationResult {
  const errors: string[] = [];

  if (!plots || plots.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลแปลงสาธิตอย่างน้อย 1 แปลง",
      errors: ["กรุณาระบุข้อมูลแปลงสาธิตอย่างน้อย 1 แปลง"],
    };
  }

  plots.forEach((plot, index) => {
    const idx = index + 1;

    // 1. Plot Name
    if (!plot.plotName || !plot.plotName.trim()) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุชื่อแปลงสาธิต`);
    }

    // 2. Dealer Store / Owner Name
    if (!plot.storeId && !plot.ownerName && !plot.farmerName) {
      errors.push(`แปลงที่ ${idx}: กรุณาเลือกร้านค้า Dealer`);
    }

    // 3. Crop Category & Crop Name
    if (!plot.cropName && !plot.cropCategory && !plot.customCropName) {
      errors.push(`แปลงที่ ${idx}: กรุณาเลือกหมวดพืชและชื่อพืช`);
    } else if (plot.cropCategory && !plot.cropName) {
      errors.push(`แปลงที่ ${idx}: กรุณาเลือกชื่อพืช`);
    }

    // 3.1 Custom Crop Name when "อื่นๆ" is selected
    if (
      OTHER_CROP_OPTIONS.includes((plot.cropName || "") as any) &&
      (!plot.customCropName || !plot.customCropName.trim())
    ) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุชื่อพืชเพิ่มเติม`);
    }

    // 4. Area (ไร่) or Tree Count (จำนวนต้น) based on cropCategory
    if (plot.cropCategory === "พืชสวน") {
      if (plot.treeCount == null || Number(plot.treeCount) <= 0) {
        errors.push(`แปลงที่ ${idx}: กรุณาระบุจำนวนต้น`);
      }
    } else if (
      plot.cropCategory === "ผักและพืชล้มลุก" ||
      plot.cropCategory === "พืชไร่"
    ) {
      if (plot.areaRai == null || Number(plot.areaRai) <= 0) {
        errors.push(`แปลงที่ ${idx}: กรุณาระบุพื้นที่ (ไร่)`);
      }
    }

    // 5. Products check (optional)
    if (options.checkProducts) {
      const prods = plot.demoProducts || plot.products || [];
      if (prods.length === 0) {
        errors.push(
          `แปลงที่ ${idx}: กรุณาระบุสินค้าที่นำไปทดสอบสาธิตอย่างน้อย 1 รายการ`,
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors[0],
    errors,
  };
}
