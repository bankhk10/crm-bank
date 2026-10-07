import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type13PlotItem, Type13WithdrawnProductLine } from "../shared/types";

export interface ValidateType13Params {
  selectedWorkTypes: string[];
  type13Plots: Type13PlotItem[];
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type13WithdrawnProductLine[];
}

export function validateType13FormValues({
  selectedWorkTypes,
  type13Plots,
  hasProductWithdrawal,
  withdrawnProducts,
}: ValidateType13Params): { isValid: boolean; error?: string } {
  const hasType13Selected = selectedWorkTypes.some(
    (t) => getWorkTypeCode(t) === "TYPE_13" || t === "ฉีดแปลงแฮตแทค" || t === "TYPE_13",
  );
  if (!hasType13Selected) {
    return { isValid: true };
  }

  if (!type13Plots || type13Plots.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง",
    };
  }

  if (type13Plots.length > 10) {
    return {
      isValid: false,
      error: "เพิ่มแปลงแฮตแทคได้สูงสุดไม่เกิน 10 แปลง",
    };
  }

  for (let i = 0; i < type13Plots.length; i++) {
    const plot = type13Plots[i];
    const plotNum = i + 1;
    const plotLabel = `แปลงที่ ${plotNum}`;

    if (!plot.storeId?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกร้านค้า Dealer สำหรับ ${plotLabel}`,
      };
    }
    if (!plot.province?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกจังหวัดสำหรับ ${plotLabel}`,
      };
    }
    if (!plot.district?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกอำเภอสำหรับ ${plotLabel}`,
      };
    }
  }

  if (hasProductWithdrawal) {
    const prods = withdrawnProducts || [];
    if (prods.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการสินค้าที่ต้องการเบิกอย่างน้อย 1 รายการ (TYPE_13)",
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
