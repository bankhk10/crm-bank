import type { Type5SurveyItem } from "../shared/types";

export interface ValidateType5Options {
  items?: Type5SurveyItem[];
  customersList?: Array<{ id: string; name: string }>;
  productsList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type5ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 5 (Competitor Market Survey) form items.
 * Validates store selection and compared product selection.
 */
export function validateType5FormItems({
  items = [],
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: ValidateType5Options): Type5ValidationResult {
  if (!selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง")) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการสำรวจตลาดของคู่แข่งอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.storeName)?.id;

    if (!sId && !item.storeName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกร้านค้า (รายการที่ ${rowNum})`,
      };
    }

    const pId =
      item.productId ||
      productsList.find((p) => p.name === item.comparedProduct)?.id;

    if (!pId && !item.comparedProduct?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกสินค้าที่นำไปเปรียบเทียบ (รายการที่ ${rowNum})`,
      };
    }
  }

  return { isValid: true };
}
