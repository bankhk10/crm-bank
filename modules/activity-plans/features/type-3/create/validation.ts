import type { Type3SalesItem } from "../shared/types";

export interface ValidateType3Options {
  items?: Type3SalesItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type3ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 3 (Product Sales) form items.
 * Validates Dealer/Subdealer store selection and product lines.
 */
export function validateType3FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType3Options): Type3ValidationResult {
  if (!selectedWorkTypes.includes("เสนอขายสินค้า")) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการเสนอขายสินค้าอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    if (item.isSubDealer) {
      if (!item.subDealerStore?.trim()) {
        return {
          isValid: false,
          error: `กรุณาระบุชื่อร้าน Subdealer (รายการที่ ${rowNum})`,
        };
      }
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId && !item.customerName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือก Dealer ต้นสังกัด (รายการที่ ${rowNum})`,
        };
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId && !item.customerName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer (รายการที่ ${rowNum})`,
        };
      }
    }

    const prodList =
      item.products && item.products.length > 0
        ? item.products
        : [
            {
              id: "fallback-p",
              productName: item.productName || "",
              quantity: item.quantity != null ? item.quantity : 1,
            },
          ];

    if (prodList.length === 0) {
      return {
        isValid: false,
        error: `กรุณาเพิ่มสินค้าที่ต้องการเสนอขาย (รายการที่ ${rowNum})`,
      };
    }

    for (let pIdx = 0; pIdx < prodList.length; pIdx++) {
      const prod = prodList[pIdx];
      const prodNum = pIdx + 1;
      const suffix = prodList.length > 1 ? `, สินค้าที่ ${prodNum}` : "";

      if (!prod.productName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้า (รายการที่ ${rowNum}${suffix})`,
        };
      }

      const qty = Number(prod.quantity);
      if (isNaN(qty) || qty <= 0) {
        return {
          isValid: false,
          error: `จำนวนสินค้าต้องมากกว่า 0 (รายการที่ ${rowNum}${suffix})`,
        };
      }
    }
  }

  return { isValid: true };
}
