import type { Type4CollectItem } from "../shared/types";

export interface ValidateType4Options {
  items?: Type4CollectItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type4ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 4 (Collection / Billing) form items.
 * Validates store selection and required collect amount for COLLECT operations.
 */
export function validateType4FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType4Options): Type4ValidationResult {
  if (!selectedWorkTypes.includes("วางบิล / เก็บเงิน")) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการวางบิล / เก็บเงินอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;

    if (!sId && !item.customerName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกร้านค้า / ลูกค้า (รายการที่ ${rowNum})`,
      };
    }

    if (item.collectType !== "BILLING") {
      const amount = Number(item.collectAmount);
      if (item.collectAmount == null || isNaN(amount) || amount <= 0) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนเงินที่ต้องเก็บ (รายการที่ ${rowNum})`,
        };
      }
    }
  }

  return { isValid: true };
}
