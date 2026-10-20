import { z } from "zod";
import type { Type3ProductSaleDetail } from "../types/actual.types";

export interface ValidateType3ActualOptions {
  productSalesDetails?: Type3ProductSaleDetail[];
  soldProducts?: string;
  actualSales?: string | number;
  actualQuantity?: string | number;
  unclosedReason?: string;
  status?: string;
}

export interface Type3ActualValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Zod Schema for Type 3 Actual Product Sale Detail
 */
export const type3ActualProductDetailSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  customer: z.string().optional(),
  storeId: z.string().optional(),
  qty: z.union([z.string(), z.number()]).optional(),
  unitPrice: z.coerce.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ").optional(),
  actualQty: z.coerce.number().min(0, "จำนวนที่ขายได้ต้องไม่ติดลบ"),
  actualSales: z.coerce.number().min(0, "ยอดขายจริงต้องไม่ติดลบ").optional(),
  unclosedReason: z.string().optional(),
  isAdditional: z.boolean().optional(),
});

/**
 * Validates Type 3 actual sales outcome.
 */
export function validateType3Actual({
  productSalesDetails = [],
}: ValidateType3ActualOptions): Type3ActualValidationResult {
  if (productSalesDetails.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุรายการเสนอขายสินค้าอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < productSalesDetails.length; i++) {
    const item = productSalesDetails[i];
    const itemNum = i + 1;

    if (!item.productName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุชื่อสินค้า (รายการที่ ${itemNum})`,
      };
    }

    const actualQty = Number(item.actualQty ?? 0);
    if (isNaN(actualQty) || actualQty < 0) {
      return {
        isValid: false,
        error: `จำนวนสินค้าที่ขายได้ต้องไม่ติดลบ (รายการที่ ${itemNum})`,
      };
    }

    const targetQty = Number(item.qty ?? 0);
    // If target quantity exists and actual quantity is less than target, or 0, recommend or require reason
    if (targetQty > 0 && actualQty < targetQty && !item.unclosedReason?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุเหตุผลที่ปิดการขายไม่ได้/ได้ไม่ครบสำหรับ ${item.productName} (รายการที่ ${itemNum})`,
      };
    }
  }

  return { isValid: true };
}
