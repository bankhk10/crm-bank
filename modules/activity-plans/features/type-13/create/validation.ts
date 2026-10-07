import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type13PlotItem } from "../shared/types";

export interface ValidateType13Params {
  selectedWorkTypes: string[];
  type13Plots: Type13PlotItem[];
}

export function validateType13FormValues({
  selectedWorkTypes,
  type13Plots,
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

  return { isValid: true };
}
