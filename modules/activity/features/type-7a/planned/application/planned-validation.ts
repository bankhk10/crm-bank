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

    // 2. Farmer / Owner Name
    if (!plot.ownerName && !plot.farmerName) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุหรือเลือกชื่อเจ้าของแปลง / เกษตรกร`);
    }

    // 3. Crop
    if (!plot.cropName && !plot.cropCategory && !plot.customCropName) {
      errors.push(`แปลงที่ ${idx}: กรุณาระบุชนิดพืชที่ต้องการทดสอบ`);
    }

    // 4. Products check (optional)
    if (options.checkProducts) {
      const prods = plot.demoProducts || plot.products || [];
      if (prods.length === 0) {
        errors.push(`แปลงที่ ${idx}: กรุณาระบุสินค้าที่นำไปทดสอบสาธิตอย่างน้อย 1 รายการ`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors[0],
    errors,
  };
}
