import type { ImageFile } from "../../shared/actual-view/types";

export interface Type7aActualValidationInput {
  activityResultStatus?: string;
  t7FarmerProvince?: string;
  t7IsUnregisteredFarmer?: boolean;
  t7FarmerName?: string;
  t7FarmerPhone?: string;
  t7FarmerCustomerId?: string | null;
  t7Latitude?: string | number | null;
  t7Longitude?: string | number | null;
  t7PlotName?: string;
  t7CropCategory?: string;
  t7CropName?: string;
  t7InitialSprayDate?: string;
  t7DemoProducts?: Array<{
    productId: string;
    productName?: string;
    plannedQuantity?: number | string | null;
    quantity: number | string;
    remainingQuantity?: number | string | null;
    unit?: string | null;
    applicationRate: string;
  }>;
  t7SprayMethod?: "SINGLE" | "TANK_MIXED";
  t7HasExternalChemicals?: boolean;
  t7ExternalProducts?: Array<{
    company: string;
    productName: string;
    activeIngredient?: string;
    formula: string;
    customFormula?: string;
    applicationRate: string;
  }>;
  t7InitialPhotos?: ImageFile[];
}

/**
 * Safely parse a numeric string or number into a clean number or null
 */
function parseCleanNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed === "") return null;
  const sanitized = trimmed.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (sanitized === "" || sanitized === "-" || sanitized === ".") return null;
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : num;
}

/**
 * Validates TYPE_7A (ทำแปลงสาธิต) actual results
 */
export function validateType7aActual(input: Type7aActualValidationInput): {
  isValid: boolean;
  error?: string;
} {
  if (input.activityResultStatus !== "COMPLETED") {
    return { isValid: true };
  }

  // 1. Farmer Owner
  if (!input.t7FarmerProvince?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกจังหวัดของเกษตรกรเจ้าของแปลง (Work Type 7A)",
    };
  }
  if (input.t7IsUnregisteredFarmer) {
    if (!input.t7FarmerName?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุชื่อเกษตรกรเจ้าของแปลง (Work Type 7A)",
      };
    }
  } else {
    if (!input.t7FarmerCustomerId && !input.t7FarmerName?.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกเกษตรกรจากระบบ Customer Master (Work Type 7A)",
      };
    }
  }

  // 2. Plot Location (Latitude & Longitude REQUIRED numeric)
  const lat = parseCleanNumber(input.t7Latitude);
  const lng = parseCleanNumber(input.t7Longitude);
  if (lat === null || isNaN(lat)) {
    return {
      isValid: false,
      error: "กรุณาระบุพิกัดละติจูด (Latitude) ของแปลงสาธิตเป็นตัวเลข",
    };
  }
  if (lng === null || isNaN(lng)) {
    return {
      isValid: false,
      error: "กรุณาระบุพิกัดลองจิจูด (Longitude) ของแปลงสาธิตเป็นตัวเลข",
    };
  }

  // 3. Demo Plot Initial Data
  if (!input.t7PlotName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุชื่อแปลงสาธิต (Work Type 7A)",
    };
  }
  if (!input.t7CropCategory?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุหมวดหมู่พืช (Work Type 7A)",
    };
  }
  if (!input.t7CropName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุชื่อพืชที่ทดสอบ (Work Type 7A)",
    };
  }

  // 4. Planting / Spray Date
  if (!input.t7InitialSprayDate) {
    return {
      isValid: false,
      error: "กรุณาระบุวันที่ฉีดพ่น (Work Type 7A)",
    };
  }

  // 5. Demo Products
  if (!input.t7DemoProducts || input.t7DemoProducts.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุสินค้าสาธิตอย่างน้อย 1 รายการ (Work Type 7A)",
    };
  }
  for (const p of input.t7DemoProducts) {
    if (!p.productId) {
      return {
        isValid: false,
        error: "กรุณาเลือกสินค้าสาธิตจากระบบ (Work Type 7A)",
      };
    }
    if (
      p.quantity === undefined ||
      p.quantity === null ||
      p.quantity === "" ||
      isNaN(Number(p.quantity)) ||
      Number(p.quantity) < 0
    ) {
      return {
        isValid: false,
        error: `กรุณาระบุจำนวนที่ใช้จริงของสินค้า ${p.productName || ""}`,
      };
    }
    if (
      p.plannedQuantity !== undefined &&
      p.plannedQuantity !== null &&
      p.plannedQuantity !== ""
    ) {
      const planned = Number(p.plannedQuantity);
      const used = Number(p.quantity);
      if (!isNaN(planned) && !isNaN(used) && used > planned) {
        return {
          isValid: false,
          error: `จำนวนที่ใช้จริงของสินค้า ${p.productName || ""} (${used}) ต้องไม่เกินจำนวนที่เบิก (${planned})`,
        };
      }
    }
    if (!p.applicationRate || !p.applicationRate.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุอัตราการใช้ (Application Rate) ของสินค้า ${p.productName || ""}`,
      };
    }
  }

  // 6. Spray Method & External Chemicals
  if (input.t7SprayMethod === "TANK_MIXED" && input.t7HasExternalChemicals) {
    if (!input.t7ExternalProducts || input.t7ExternalProducts.length === 0) {
      return {
        isValid: false,
        error:
          "กรุณาระบุสารเคมีภายนอกอย่างน้อย 1 รายการ หรือยกเลิกการเลือกมียาภายนอก",
      };
    }
    if (input.t7ExternalProducts.length > 4) {
      return {
        isValid: false,
        error: "สามารถระบุสารเคมีภายนอกได้สูงสุด 4 รายการ",
      };
    }
    for (const ep of input.t7ExternalProducts) {
      if (!ep.company?.trim() || !ep.productName?.trim()) {
        return {
          isValid: false,
          error: "กรุณากรอกชื่อบริษัทและชื่อสินค้าของสารเคมีภายนอกให้ครบถ้วน",
        };
      }
      if (!ep.formula) {
        return {
          isValid: false,
          error: "กรุณาเลือกสูตรยาของสารเคมีภายนอก",
        };
      }
      if (ep.formula === "อื่นๆ" && !ep.customFormula?.trim()) {
        return {
          isValid: false,
          error: "กรุณาระบุรายละเอียดสูตรยาเมื่อเลือก 'อื่นๆ'",
        };
      }
      if (!ep.applicationRate?.trim()) {
        return {
          isValid: false,
          error: "กรุณาระบุอัตราการใช้ของสารเคมีภายนอก",
        };
      }
    }
  }

  // 7. Initial Photos (Max 10)
  if (input.t7InitialPhotos && input.t7InitialPhotos.length > 10) {
    return {
      isValid: false,
      error: "ภาพถ่ายสภาพแปลงเริ่มต้นสามารถแนบได้สูงสุด 10 รูป (Work Type 7A)",
    };
  }

  return { isValid: true };
}
