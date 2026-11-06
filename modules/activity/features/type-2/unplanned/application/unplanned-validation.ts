import { z } from "zod";
import type { Type2UnplannedItem } from "../types/unplanned.types";

export interface ValidateType2UnplannedOptions {
  item?: Type2UnplannedItem;
  items?: Type2UnplannedItem[];
  customersList?: Array<{ id: string; name: string }>;
}

export interface Type2UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a single unplanned Type 2 item on the client side
 */
export function validateType2UnplannedItem({
  item,
  customersList = [],
}: ValidateType2UnplannedOptions): Type2UnplannedValidationResult {
  if (!item) return { isValid: true };

  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  // 1. Target validation
  if (purpose === "STORE") {
    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;
    if (!sId) {
      return { isValid: false, error: "กรุณาเลือกร้านค้าสำหรับติดตามผลการใช้สินค้า" };
    }
  } else {
    // purpose === "FARMER"
    if (!item.province?.trim()) {
      return { isValid: false, error: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร" };
    }
    if (item.isUnregisteredFarmer) {
      if (!item.unregisteredFarmerName?.trim()) {
        return { isValid: false, error: "กรุณากรอกชื่อ - สกุล เกษตรกร" };
      }
      if (item.unregisteredFarmerPhone?.trim()) {
        const cleanedPhone = item.unregisteredFarmerPhone.replace(/[-\s]/g, "");
        if (!/^\d{9,10}$/.test(cleanedPhone)) {
          return {
            isValid: false,
            error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก",
          };
        }
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId) {
        return { isValid: false, error: "กรุณาเลือกเกษตรกรจากรายชื่อ" };
      }
    }
  }

  // 2. Products validation
  if (!item.products || item.products.length === 0) {
    return {
      isValid: false,
      error: `กรุณาเพิ่มสินค้าที่ต้องการติดตามผลอย่างน้อย 1 รายการ (${item.customerName || item.unregisteredFarmerName || "เป้าหมาย"})`,
    };
  }

  for (let pIdx = 0; pIdx < item.products.length; pIdx++) {
    const p = item.products[pIdx];
    const row = pIdx + 1;
    if (!p.productName?.trim() && !p.productId?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุชื่อสินค้า (สินค้าลำดับที่ ${row})`,
      };
    }

    if (p.usageResult === "พบปัญหา" && !p.problemDetail?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุรายละเอียดปัญหาที่พบ สำหรับสินค้า "${p.productName || `ลำดับที่ ${row}`}"`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Zod schema for Unplanned Type 2 validation
 */
export const type2UnplannedProductLineSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  notes: z.string().optional().nullable(),
  usageResult: z
    .enum(["พืชตอบสนองดี", "ลูกค้าพึงพอใจ", "พบปัญหา", ""])
    .optional()
    .nullable(),
  followupDetail: z.string().optional().nullable(),
  problemDetail: z.string().optional().nullable(),
  isAdditional: z.boolean().optional(),
});

export const type2UnplannedItemSchema = z
  .object({
    visitPurpose: z.enum(["FARMER", "STORE"]).default("FARMER"),
    storeId: z.string().optional().nullable(),
    customerName: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().default(false),
    unregisteredFarmerName: z.string().optional().nullable(),
    unregisteredFarmerPhone: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    products: z
      .array(type2UnplannedProductLineSchema)
      .min(1, "กรุณาเพิ่มสินค้าที่ต้องการติดตามอย่างน้อย 1 รายการ"),
  })
  .superRefine((data, ctx) => {
    const purpose = data.visitPurpose || "FARMER";
    if (purpose === "FARMER") {
      if (!data.province || !data.province.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร",
          path: ["province"],
        });
      }
      if (data.isUnregisteredFarmer) {
        if (!data.unregisteredFarmerName || !data.unregisteredFarmerName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาระบุชื่อ - สกุล เกษตรกร",
            path: ["unregisteredFarmerName"],
          });
        }
      } else {
        if (!data.storeId || !data.storeId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือกเกษตรกรจากรายชื่อ",
            path: ["storeId"],
          });
        }
      }
    } else if (purpose === "STORE") {
      if (!data.storeId || !data.storeId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้า",
          path: ["storeId"],
        });
      }
    }

    // Check problem details
    data.products.forEach((p, idx) => {
      if (p.usageResult === "พบปัญหา" && (!p.problemDetail || !p.problemDetail.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `กรุณาระบุรายละเอียดปัญหาที่พบ สำหรับสินค้า "${p.productName}"`,
          path: ["products", idx, "problemDetail"],
        });
      }
    });
  });
