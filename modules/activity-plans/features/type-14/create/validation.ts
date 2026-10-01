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

  if (!type14Data.demoPlotId?.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงแฮตแทคเดิม (TYPE_14)",
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

  return { isValid: true };
}
