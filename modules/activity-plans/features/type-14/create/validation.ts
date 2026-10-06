import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type14PlanInput } from "../shared/types";

export interface ValidateType14Params {
  selectedWorkTypes: string[];
  type14Data: Type14PlanInput;
}

export function validateType14FormValues({
  selectedWorkTypes,
  type14Data,
}: ValidateType14Params): { isValid: boolean; error?: string } {
  const hasType14Selected = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_14" || t === "ติดตามแปลงแฮทแทค" || t === "TYPE_14",
  );
  if (!hasType14Selected) {
    return { isValid: true };
  }

  if (!type14Data.selectedPlanId?.trim() && !type14Data.demoPlotId?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง (TYPE_14)",
    };
  }
  if (!type14Data.demoPlotId?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงแฮตแทคที่ต้องการติดตาม (TYPE_14)",
    };
  }
  if (!type14Data.storeId?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกร้านค้าตัวแทนจำหน่าย (Dealer) สำหรับแปลงแฮตแทค",
    };
  }
  if (!type14Data.province?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุจังหวัดของแปลงแฮตแทค",
    };
  }
  if (!type14Data.district?.trim()) {
    return {
      isValid: false,
      error: "กรุณาระบุอำเภอของแปลงแฮตแทค",
    };
  }

  if (type14Data.hasProductWithdrawal) {
    const prods = type14Data.withdrawnProducts || [];
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการสินค้าที่ต้องการเบิกอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      if (!p.productId?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้าสำหรับรายการที่ ${i + 1}`,
        };
      }
      if (!p.quantity || Number(p.quantity) <= 0) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนสินค้าที่มากกว่า 0 สำหรับรายการที่ ${i + 1}`,
        };
      }
    }
  }

  return { isValid: true };
}
