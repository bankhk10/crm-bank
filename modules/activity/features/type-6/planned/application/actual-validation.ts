import type { Type6ActualValidationInput } from "../types/actual.types";

export type { Type6ActualValidationInput };

/**
 * Validates TYPE_6 (ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา) actual results
 */
export function validateType6Actual(
  input: Type6ActualValidationInput,
): { isValid: boolean; error?: string } {
  const {
    t6PurchaseChannel,
    t6StoreId,
    t6ProductId,
    t6LotNumber,
    t6IssueType,
    t6Detail,
    items,
  } = input;

  // Multi-item validation
  if (items && Array.isArray(items) && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const prefix =
        items.length > 1
          ? `รายการที่ ${i + 1}${it.customerName ? ` (${it.customerName})` : ""}: `
          : "";

      if (!it.purchaseChannel) {
        return {
          isValid: false,
          error: `${prefix}กรุณาระบุช่องทางการซื้อสินค้า`,
        };
      }
      if (it.purchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && !it.storeId) {
        return {
          isValid: false,
          error: `${prefix}กรุณาเลือกร้านค้าตัวแทนจำหน่าย`,
        };
      }
      if (!it.productId) {
        return {
          isValid: false,
          error: `${prefix}กรุณาเลือกชื่อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน`,
        };
      }
      if (!it.lotNumber?.trim()) {
        return {
          isValid: false,
          error: `${prefix}กรุณาระบุเลข Lot`,
        };
      }
      if (!it.issueType) {
        return {
          isValid: false,
          error: `${prefix}กรุณาเลือกประเภทปัญหา`,
        };
      }
      if (it.issueType === "อื่นๆ ระบุ" && !it.detail?.trim()) {
        return {
          isValid: false,
          error: `${prefix}กรุณาระบุรายละเอียดปัญหา`,
        };
      }
    }
    return { isValid: true };
  }

  // Single-item fallback
  if (!t6PurchaseChannel) {
    return {
      isValid: false,
      error: "กรุณาระบุช่องทางการซื้อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน",
    };
  }
  if (t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && !t6StoreId) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้าตัวแทนจำหน่าย",
    };
  }
  if (!t6ProductId) {
    return {
      isValid: false,
      error: "กรุณาเลือกชื่อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน",
    };
  }
  if (!t6LotNumber?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุเลข Lot",
    };
  }
  if (!t6IssueType) {
    return {
      isValid: false,
      error: "กรุณาเลือกประเภทปัญหา",
    };
  }
  if (t6IssueType === "อื่นๆ ระบุ" && !t6Detail?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุรายละเอียดปัญหา",
    };
  }

  return { isValid: true };
}
