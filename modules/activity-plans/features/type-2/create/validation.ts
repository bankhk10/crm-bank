import type { Type2ProductFollowupItem } from "../shared/types";

export interface ValidateType2Options {
  items?: Type2ProductFollowupItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type2ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 2 (Product Follow-up) form items.
 * Validates product selection, customer/farmer selection according to purpose
 * (FARMER vs STORE), and registered vs unregistered farmer details.
 */
export function validateType2FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType2Options): Type2ValidationResult {
  if (!selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการติดตามผลการใช้สินค้าอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    if (!item.productName?.trim() && !item.productId?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกสินค้าที่ต้องการติดตามผล (รายการที่ ${rowNum})`,
      };
    }

    const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
    if (purpose === "STORE") {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้าสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
        };
      }
    } else {
      // purpose === "FARMER"
      if (!item.province?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร (รายการที่ ${rowNum})`,
        };
      }
      if (item.isUnregisteredFarmer) {
        if (!item.unregisteredFarmerName?.trim()) {
          return {
            isValid: false,
            error: `กรุณากรอกชื่อ - สกุล เกษตรกร (รายการที่ ${rowNum})`,
          };
        }
        if (!item.unregisteredFarmerPhone?.trim()) {
          return {
            isValid: false,
            error: `กรุณากรอกเบอร์โทรศัพท์เกษตรกร (รายการที่ ${rowNum})`,
          };
        }
        const cleanedPhone = item.unregisteredFarmerPhone.replace(
          /[-\s]/g,
          "",
        );
        if (!/^\d{9,10}$/.test(cleanedPhone)) {
          return {
            isValid: false,
            error: `เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (รายการที่ ${rowNum})`,
          };
        }
      } else {
        const sId =
          item.storeId ||
          customersList.find((c) => c.name === item.customerName)?.id;
        if (!sId) {
          return {
            isValid: false,
            error: `กรุณาเลือกเกษตรกรสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
          };
        }
      }
    }
  }
  return { isValid: true };
}
