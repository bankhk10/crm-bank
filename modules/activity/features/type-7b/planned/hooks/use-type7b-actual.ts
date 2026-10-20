import { useState, useCallback } from "react";
import type { Type7bActualRecord } from "../types/actual.types";
import { validateType7bActual } from "../application/actual-validation";

export function useType7bActual(initialData?: Type7bActualRecord) {
  const [actualState, setActualState] = useState<Type7bActualRecord>(() => ({
    t7CropCondition: initialData?.t7CropCondition || "สมบูรณ์",
    t7GrowthStage: initialData?.t7GrowthStage || "",
    t7CropProblemDescription: initialData?.t7CropProblemDescription || "",
    t7ProductResponse: initialData?.t7ProductResponse || "พืชตอบสนองดี",
    t7ProblemDescription: initialData?.t7ProblemDescription || "",
    t7SprayMethod: initialData?.t7SprayMethod || "",
    t7SprayEquipment: initialData?.t7SprayEquipment || "",
    t7OtherEquipment: initialData?.t7OtherEquipment || "",
    t7NextFollowUpDate: initialData?.t7NextFollowUpDate || "",
    t7NextSprayDate: initialData?.t7NextSprayDate || "",
    t7DaysAfterSpray: initialData?.t7DaysAfterSpray || "",
    t7CropAgeValue: initialData?.t7CropAgeValue || "",
    t7CropAgeUnit: initialData?.t7CropAgeUnit || "วัน",
    t7CropImages: initialData?.t7CropImages || [],
    t7PlotImages: initialData?.t7PlotImages || [],
    t7PlotStatus: initialData?.t7PlotStatus || "IN_PROGRESS",
    t7FinalYieldKg: initialData?.t7FinalYieldKg || "",
    t7ControlYieldKg: initialData?.t7ControlYieldKg || "",
    t7FarmerSatisfaction: initialData?.t7FarmerSatisfaction || 5,
    t7CommercialPotential: initialData?.t7CommercialPotential || "สูง (เกษตรกรสนใจมาก)",
    t7FinalSummaryNotes: initialData?.t7FinalSummaryNotes || "",
    t7PlotName: initialData?.t7PlotName || "",
    t7FarmerName: initialData?.t7FarmerName || "",
    ...initialData,
  }));

  const handleUpdateField = useCallback(
    (field: keyof Type7bActualRecord | string, value: any) => {
      setActualState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const validate = useCallback(() => {
    return validateType7bActual(actualState);
  }, [actualState]);

  return {
    actualState,
    setActualState,
    handleUpdateField,
    validate,
  };
}
