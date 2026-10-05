import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type8MeetingItem } from "../shared/types";

export interface ValidateType8Options {
  items?: Type8MeetingItem[];
  selectedWorkTypes?: string[];
}

export interface Type8ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pure validation function for TYPE 8 (Meeting & Seminar) form items.
 * Validates target audience (dealer/subdealer/farmer), topic, attendee count, target products limit, and promotion products.
 */
export function validateType8FormItems({
  items = [],
  selectedWorkTypes = [],
}: ValidateType8Options): Type8ValidationResult {
  const isType8Selected = selectedWorkTypes.some(
    (wt) => getWorkTypeCode(wt) === "TYPE_8",
  );
  if (!isType8Selected) return { isValid: true };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    // 1. Validate Target Audience
    if (item.meetingTarget === "DEALER") {
      if (!item.dealerId) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer สำหรับการจัดประชุม (รายการที่ ${rowNum})`,
        };
      }
    } else if (item.meetingTarget === "SUBDEALER") {
      if (item.isUnregisteredSubdealer) {
        if (!item.subDealerStore || !item.subDealerStore.trim()) {
          return {
            isValid: false,
            error: `กรุณากรอกชื่อร้านค้า Subdealer (รายการที่ ${rowNum})`,
          };
        }
        if (!item.dealerId) {
          return {
            isValid: false,
            error: `กรุณาเลือก Dealer ต้นสังกัดของร้านค้า Subdealer (รายการที่ ${rowNum})`,
          };
        }
      } else {
        if (!item.subdealerId) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้า Subdealer จาก Customer Master (รายการที่ ${rowNum})`,
          };
        }
      }
    } else {
      // FARMER
      if (item.farmerChannel === "SUBDEALER") {
        if (item.isUnregisteredSubdealer) {
          if (!item.subDealerStore || !item.subDealerStore.trim()) {
            return {
              isValid: false,
              error: `กรุณากรอกชื่อร้านค้า Subdealer สำหรับการจัดประชุมฟาร์มเมอร์ (รายการที่ ${rowNum})`,
            };
          }
          if (!item.dealerId) {
            return {
              isValid: false,
              error: `กรุณาเลือก Dealer ต้นสังกัดของร้าน Subdealer (รายการที่ ${rowNum})`,
            };
          }
        } else {
          if (!item.subdealerId) {
            return {
              isValid: false,
              error: `กรุณาเลือกร้านค้า Subdealer จาก Customer Master สำหรับการจัดประชุมฟาร์มเมอร์ (รายการที่ ${rowNum})`,
            };
          }
        }
      } else {
        // DEALER channel
        if (!item.dealerId) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้า Dealer สำหรับการจัดประชุมฟาร์มเมอร์ (รายการที่ ${rowNum})`,
          };
        }
      }
    }

    // 2. Validate Topic
    if (!item.topic || !item.topic.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุหัวข้อที่จะประชุม (รายการที่ ${rowNum})`,
      };
    }

    // 3. Validate Attendees
    if (item.attendeesCount == null || Number(item.attendeesCount) < 1) {
      return {
        isValid: false,
        error: `เป้าหมายผู้เข้าร่วมต้องมีอย่างน้อย 1 คน (รายการที่ ${rowNum})`,
      };
    }

    // 4. Validate Target Products limit
    if (item.targetProducts && item.targetProducts.length > 5) {
      return {
        isValid: false,
        error: `สินค้าเป้าหมายต้องไม่เกิน 5 รายการ (รายการที่ ${rowNum})`,
      };
    }

    // 5. Validate Promotional Products (if any rows added)
    if (item.promotionProducts && item.promotionProducts.length > 0) {
      for (let pIdx = 0; pIdx < item.promotionProducts.length; pIdx++) {
        const promo = item.promotionProducts[pIdx];
        if (!promo.notes || !promo.notes.trim()) {
          return {
            isValid: false,
            error: `กรุณาระบุรายละเอียดโปรโมชัน ลำดับที่ ${pIdx + 1} (รายการที่ ${rowNum})`,
          };
        }
      }
    }
  }

  return { isValid: true };
}
