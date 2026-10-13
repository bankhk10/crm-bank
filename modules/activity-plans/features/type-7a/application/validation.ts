import { z } from "zod";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  ValidateType7aOptions,
  Type7aValidationResult,
  Type7aActualValidationInput,
} from "../types";

export type {
  ValidateType7aOptions,
  Type7aValidationResult,
  Type7aActualValidationInput,
};

/**
 * Pure validation function for TYPE 7A (New Demo Plot) form items.
 * Validates plot name, dealer customer type, location, crop, area/tree count, product category, objective, and products.
 */
export function validateType7aFormItems({
  items = [],
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: ValidateType7aOptions): Type7aValidationResult {
  const hasType7ASelected = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_7A",
  );
  if (!hasType7ASelected) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการทำแปลงสาธิตอย่างน้อย 1 รายการ",
    };
  }

  const item = items[0];
  if (!item.plotName?.trim()) {
    return {
      isValid: false,
      error: "กรุณากรอกชื่อแปลงสาธิต",
    };
  }

  const dealerId =
    item.storeId ||
    customersList.find((c) => c.name === item.ownerName)?.id;
  if (!dealerId) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงสาธิต",
    };
  }

  const dealer = customersList.find((c) => c.id === dealerId);
  if (dealer?.customerType && dealer.customerType !== "DEALER") {
    return {
      isValid: false,
      error: "ร้านค้าของแปลงสาธิตต้องเป็นประเภทร้านค้าตัวแทนจำหน่าย (DEALER) เท่านั้น",
    };
  }

  if (!item.province?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกจังหวัดของแปลงสาธิต",
    };
  }

  if (!item.district?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกอำเภอของแปลงสาธิต",
    };
  }

  if (!item.cropCategory?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกหมวดพืช",
    };
  }

  if (!item.cropName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกหรือระบุชื่อพืช",
    };
  }

  const isCustomCrop = [
    "ผักและพืชล้มลุกอื่นๆ",
    "พืชไร่อื่นๆ",
    "พืชสวนอื่นๆ",
  ].includes(item.cropName);
  if (isCustomCrop && !item.customCropName?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุชื่อพืชเพิ่มเติม",
    };
  }

  const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
    item.cropCategory,
  );
  if (isRaiUnit && (!item.areaRai || item.areaRai <= 0)) {
    return {
      isValid: false,
      error: "กรุณาระบุพื้นที่ (ไร่) ให้มากกว่า 0",
    };
  }
  if (!isRaiUnit && (!item.treeCount || item.treeCount <= 0)) {
    return {
      isValid: false,
      error: "กรุณาระบุจำนวนต้นให้มากกว่า 0",
    };
  }

  if (!item.objective?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุวัตถุประสงค์การทำแปลง",
    };
  }

  if (item.hasProductWithdrawal) {
    const selectedCatId = item.categoryId || item.chemicalGroupId;
    if (!selectedCatId?.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกหมวดสินค้า",
      };
    }

    const prods = (item.demoProducts || []).filter(
      (p) => p.productId || p.productName,
    );
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาระบุสินค้าที่จะสาธิตอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      if (!p.quantity || p.quantity <= 0) {
        return {
          isValid: false,
          error: `จำนวนสินค้าที่จะสาธิตต้องมากกว่า 0 (รายการที่ ${i + 1})`,
        };
      }
      const matchedProd = productsList.find(
        (prod) => prod.id === p.productId || prod.name === p.productName,
      );
      if (
        matchedProd &&
        matchedProd.categoryId &&
        matchedProd.categoryId !== selectedCatId &&
        matchedProd.productGroupId &&
        matchedProd.productGroupId !== selectedCatId
      ) {
        return {
          isValid: false,
          error: `สินค้า "${p.productName}" ไม่อยู่ในหมวดสินค้าที่เลือก (รายการที่ ${i + 1})`,
        };
      }
    }
  }

  return { isValid: true };
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
    if (!p.productId && !p.productName) {
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

// ── TYPE_7A ("ทำแปลงสาธิตใหม่") Zod Schemas ───────────────────────────
export const type7aPlotProductSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  quantity: z.coerce.number().optional().nullable(),
  targetQuantity: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
});

export const type7aPlotItemSchema = z.object({
  id: z.string().optional(),
  plotName: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  storeId: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  cropCategory: z.string().optional().nullable(),
  cropName: z.string().optional().nullable(),
  customCropName: z.string().optional().nullable(),
  areaRai: z.coerce.number().optional().nullable(),
  treeCount: z.coerce.number().int().optional().nullable(),
  objective: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  chemicalGroupId: z.string().optional().nullable(),
  hasProducts: z.boolean().optional().default(false),
  demoPlotId: z.string().optional().nullable(),
  demoProducts: z.array(type7aPlotProductSchema).optional().default([]),
  products: z.array(type7aPlotProductSchema).optional().default([]),
});

export const type7aDemoPlotProductInputSchema = z.object({
  id: z.string().optional().nullable(),
  productId: z.string().min(1, "กรุณาเลือกสินค้าสาธิต"),
  productName: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0.01, "จำนวนสินค้าต้องมากกว่า 0"),
  plannedQuantity: z.coerce.number().optional().nullable(),
  remainingQuantity: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  applicationRate: z.string().optional().nullable().default("-"),
  isAdditional: z.boolean().optional().nullable(),
});

export const type7aDemoPlotExternalProductInputSchema = z.object({
  company: z.string().min(1, "กรุณาระบุบริษัท"),
  productName: z.string().min(1, "กรุณาระบุชื่อยา/เคมี"),
  activeIngredient: z.string().optional().nullable(),
  formula: z.string().min(1, "กรุณาเลือกสูตรยา"),
  customFormula: z.string().optional().nullable(),
  applicationRate: z.string().min(1, "กรุณาระบุอัตราการใช้"),
});

export const type7aDemoPlotInputSchema = z
  .object({
    customerId: z.string().optional().nullable(),
    farmerCustomerId: z.string().optional().nullable(),
    ownerName: z.string().min(1, "กรุณาระบุชื่อเกษตรกรเจ้าของแปลง"),
    ownerPhone: z.string().optional().nullable(),
    ownerProvince: z.string().optional().nullable(),
    ownerDistrict: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().default(false),
    province: z.string().min(1, "กรุณาเลือกจังหวัด"),
    district: z.string().optional().nullable(),
    latitude: z.coerce.number({ required_error: "กรุณาระบุละติจูด" }),
    longitude: z.coerce.number({ required_error: "กรุณาระบุลองจิจูด" }),
    plotName: z.string().min(1, "กรุณากรอกชื่อแปลงสาธิต"),
    dealerName: z.string().optional().nullable(),
    cropCategory: z.string().min(1, "กรุณาระบุหมวดพืช"),
    cropName: z.string().min(1, "กรุณาระบุชื่อพืช"),
    customCropName: z.string().optional().nullable(),
    areaRai: z.coerce.number().optional().nullable(),
    treeCount: z.coerce.number().int().optional().nullable(),
    objective: z.string().optional().nullable(),
    experimentDetail: z.string().optional().nullable(),
    mainCropInfo: z.string().optional().nullable(),
    plantingDate: z.coerce.date().optional().nullable(),
    initialSprayDate: z.coerce.date().optional().nullable(),
    nextSprayDate: z.coerce.date().optional().nullable(),
    sprayMethod: z.enum(["SINGLE", "TANK_MIXED"]),
    hasExternalChemicals: z.boolean().default(false),
    demoProducts: z
      .array(type7aDemoPlotProductInputSchema)
      .min(1, "กรุณาระบุสินค้าสาธิตอย่างน้อย 1 รายการ"),
    externalProducts: z
      .array(type7aDemoPlotExternalProductInputSchema)
      .max(4, "ยาภายนอกระบุได้สูงสุด 4 รายการ")
      .optional()
      .default([]),
    irrigations: z.array(z.string()).default([]),
    usageMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    cropAgeValue: z.coerce.number().int().optional().nullable(),
    cropAgeUnit: z.string().default("วัน"),
    growthStage: z.string().optional().nullable(),
    cropCondition: z.string().optional().nullable(),
    productResponse: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isUnregisteredFarmer) {
        return (
          typeof data.ownerName === "string" &&
          data.ownerName.trim().length > 0 &&
          typeof data.ownerProvince === "string" &&
          data.ownerProvince.trim().length > 0 &&
          typeof data.ownerDistrict === "string" &&
          data.ownerDistrict.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "กรณีไม่มีเกษตรกรในระบบ กรุณากรอกชื่อ จังหวัด และอำเภอของเกษตรกร",
      path: ["ownerDistrict"],
    },
  )
  .refine(
    (data) => {
      if (data.sprayMethod === "TANK_MIXED" && data.hasExternalChemicals) {
        for (const ep of data.externalProducts || []) {
          if (
            ep.formula === "อื่นๆ" &&
            (!ep.customFormula || !ep.customFormula.trim())
          ) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: "กรณีเลือกสูตรยา 'อื่นๆ' กรุณาระบุรายละเอียด",
      path: ["externalProducts"],
    },
  );

export type Type7aPlotProduct = z.infer<typeof type7aPlotProductSchema>;
export type Type7aPlotItem = z.infer<typeof type7aPlotItemSchema>;
