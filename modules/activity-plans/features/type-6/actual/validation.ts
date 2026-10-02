export interface Type6ActualValidationInput {
  t6PurchaseChannel?: string;
  t6StoreId?: string | null;
  t6ProductId?: string | null;
  t6LotNumber?: string;
  t6IssueType?: string;
  t6Detail?: string;
}

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
  } = input;

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
