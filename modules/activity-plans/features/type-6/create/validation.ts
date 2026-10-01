import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type6IssueItem } from "../shared/types";

export interface ValidateType6Options {
  items?: Type6IssueItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type6ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 6 (Complaints & Issue Resolution) form items.
 * Validates customer/store selection, issue type, and details when 'อื่นๆ ระบุ' is selected.
 */
export function validateType6FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType6Options): Type6ValidationResult {
  const hasType6 = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_6",
  );
  if (!hasType6) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการตรวจสอบเรื่องร้องเรียน / แก้ปัญหาอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    if (item.isManualCustomer) {
      const manualName = (
        item.manualCustomerName ||
        item.customerName ||
        ""
      ).trim();
      if (!manualName) {
        return {
          isValid: false,
          error: `กรุณากรอกชื่อลูกค้า / ร้านค้า (รายการที่ ${rowNum})`,
        };
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า / Key Farmer (รายการที่ ${rowNum})`,
        };
      }
    }

    if (!item.issueType?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกประเภทปัญหา (รายการที่ ${rowNum})`,
      };
    }

    if (item.issueType === "อื่นๆ ระบุ" && !item.detail?.trim()) {
      return {
        isValid: false,
        error: `กรุณากรอกรายละเอียดสำหรับประเภทปัญหา "อื่นๆ ระบุ" (รายการที่ ${rowNum})`,
      };
    }
  }

  return { isValid: true };
}
