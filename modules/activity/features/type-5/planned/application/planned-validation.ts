import { z } from "zod";
import type {
  ValidateType5Options,
  Type5ValidationResult,
  Type5SurveyItem,
} from "../types/planned.types";

export const type5SurveyItemSchema = z.object({
  storeName: z.string().min(1, "กรุณาระบุชื่อร้านค้า"),
  comparedProduct: z.string().min(1, "กรุณาระบุสินค้าที่นำไปเปรียบเทียบ"),
});

/**
 * Validate Type 5 Planned Form Items
 */
export function validateType5FormItems(
  options: ValidateType5Options,
): Type5ValidationResult {
  const { items = [], selectedWorkTypes = [] } = options;

  const isType5Selected = selectedWorkTypes.some(
    (wt) => wt === "TYPE_5" || wt === "สำรวจตลาดของคู่แข่ง",
  );

  if (!isType5Selected) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุรายการสำรวจตลาดของคู่แข่งอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.storeId && !item.storeName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุร้านค้าในรายการที่ ${i + 1}`,
      };
    }

    if (!item.productId && !item.comparedProduct?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุสินค้าเปรียบเทียบในรายการที่ ${i + 1}`,
      };
    }
  }

  return { isValid: true };
}
