import type { Type1VisitItem } from "../shared/types";

export interface ValidateType1Options {
  item?: Type1VisitItem;
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type1ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 1 (Visit Farmer / Store) form item.
 * Validates client-side form state according to purpose (FARMER vs STORE)
 * and registered vs unregistered farmer rules.
 */
export function validateType1FormItem({
  item,
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType1Options): Type1ValidationResult {
  const isSelected =
    selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
    selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer");

  if (!isSelected) return { isValid: true };

  const purpose = item?.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item?.storeId ||
      customersList.find((c) => c.name === item?.customerName)?.id;
    if (!sId) {
      return { isValid: false, error: "กรุณาเลือกร้านค้า" };
    }
  } else {
    // purpose === "FARMER"
    if (!item || !item.province?.trim()) {
      return { isValid: false, error: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร" };
    }
    if (item.isUnregisteredFarmer) {
      if (!item.unregisteredFarmerName?.trim()) {
        return { isValid: false, error: "กรุณากรอกชื่อ - สกุล เกษตรกร" };
      }
      if (item.unregisteredFarmerPhone?.trim()) {
        const cleanedPhone = item.unregisteredFarmerPhone.replace(
          /[-\s]/g,
          "",
        );
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
        return { isValid: false, error: "กรุณาเลือกเกษตรกร" };
      }
    }
  }

  return { isValid: true };
}
