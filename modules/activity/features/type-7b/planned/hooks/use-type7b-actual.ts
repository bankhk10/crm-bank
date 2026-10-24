"use client";

import { useState, useCallback } from "react";
import type {
  Type7bActualRecord,
  Type7bSprayRoundState,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
} from "../types/actual.types";
import type { ImageFile } from "../../shared/types";
import { validateType7bActual } from "../application/actual-validation";

function createDefaultRound(
  roundNumber: number,
  baselineProducts: Type7bBaselineProductItem[] = [],
): Type7bSprayRoundState {
  return {
    id: `round-${Date.now()}-${roundNumber}`,
    roundNumber,
    sprayDate: new Date().toISOString().split("T")[0],
    sprayMethod: "SINGLE",
    sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
    otherEquipment: "",
    productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
    problemDetail: "",
    baselineProducts: baselineProducts.map((p) => ({ ...p })),
    additionalProducts: [],
    roundImages: [],
  };
}

export function useType7bActual(initialData?: Type7bActualRecord) {
  const [actualState, setActualState] = useState<Type7bActualRecord>(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const initialRounds =
      Array.isArray(initialData?.t7SprayingRounds) && initialData!.t7SprayingRounds.length > 0
        ? initialData!.t7SprayingRounds
        : [createDefaultRound(1)];

    return {
      t7VisitDate: initialData?.t7VisitDate || todayStr,
      t7DaysAfterSpray: initialData?.t7DaysAfterSpray ?? 0,
      t7CropImages: initialData?.t7CropImages || [],
      t7SprayingRounds: initialRounds,
      t7NextSprayDate: initialData?.t7NextSprayDate || "",
      t7Notes: initialData?.t7Notes || "",
      t7PlotStatus: initialData?.t7PlotStatus || "IN_PROGRESS",

      // Backward compatibility fields
      t7CropCondition: initialData?.t7CropCondition || "สมบูรณ์",
      t7GrowthStage: initialData?.t7GrowthStage || "",
      t7CropProblemDescription: initialData?.t7CropProblemDescription || "",
      t7ProductResponse: initialData?.t7ProductResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      t7ProblemDescription: initialData?.t7ProblemDescription || "",
      t7SprayMethod: initialData?.t7SprayMethod || "SINGLE",
      t7SprayEquipment: initialData?.t7SprayEquipment || "เป้สะพายหลัง",
      t7OtherEquipment: initialData?.t7OtherEquipment || "",
      t7NextFollowUpDate: initialData?.t7NextFollowUpDate || "",
      t7CropAgeValue: initialData?.t7CropAgeValue || "",
      t7CropAgeUnit: initialData?.t7CropAgeUnit || "วัน",
      t7PlotImages: initialData?.t7PlotImages || [],
      t7FinalYieldKg: initialData?.t7FinalYieldKg || "",
      t7ControlYieldKg: initialData?.t7ControlYieldKg || "",
      t7FarmerSatisfaction: initialData?.t7FarmerSatisfaction || 5,
      t7CommercialPotential: initialData?.t7CommercialPotential || "สูง (เกษตรกรสนใจมาก)",
      t7FinalSummaryNotes: initialData?.t7FinalSummaryNotes || "",
      t7PlotName: initialData?.t7PlotName || "",
      t7FarmerName: initialData?.t7FarmerName || "",
      ...initialData,
    };
  });

  const handleUpdateField = useCallback(
    (field: keyof Type7bActualRecord | string, value: any) => {
      setActualState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  // Initialize or populate baseline products from plan targets
  const initBaselineProducts = useCallback(
    (plannedProducts: Array<{ productId: string; productName?: string; quantity?: number | string; unit?: string }>) => {
      if (!plannedProducts || plannedProducts.length === 0) return;

      setActualState((prev) => {
        const rounds = prev.t7SprayingRounds || [createDefaultRound(1)];
        const formattedBaselines: Type7bBaselineProductItem[] = plannedProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName || "สินค้าตามแผน",
          withdrawnQuantity: p.quantity ?? 1,
          plannedQuantity: p.quantity ?? 1,
          actualQuantity: p.quantity ?? 1,
          extraQuantity: "",
          extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
          applicationRate: "",
          plannedRate: "",
          actualRate: "",
          unit: p.unit || "ขวด",
        }));

        // Check if baselineProducts already set
        const updatedRounds = rounds.map((r) => {
          if (!r.baselineProducts || r.baselineProducts.length === 0) {
            return {
              ...r,
              baselineProducts: formattedBaselines.map((bp) => ({ ...bp })),
            };
          }
          return r;
        });

        return {
          ...prev,
          t7SprayingRounds: updatedRounds,
        };
      });
    },
    [],
  );

  // Add new Spraying Round
  const addSprayingRound = useCallback(() => {
    setActualState((prev) => {
      const currentRounds = prev.t7SprayingRounds || [];
      const newRoundNumber = currentRounds.length + 1;
      const baseProducts = currentRounds[0]?.baselineProducts || [];
      const newRound = createDefaultRound(newRoundNumber, baseProducts);

      return {
        ...prev,
        t7SprayingRounds: [...currentRounds, newRound],
      };
    });
  }, []);

  // Remove a Spraying Round
  const removeSprayingRound = useCallback((roundIdx: number) => {
    setActualState((prev) => {
      const currentRounds = prev.t7SprayingRounds || [];
      if (currentRounds.length <= 1) return prev; // Keep at least 1 round

      const filtered = currentRounds.filter((_, idx) => idx !== roundIdx);
      // Re-index round numbers
      const reindexed = filtered.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));

      return {
        ...prev,
        t7SprayingRounds: reindexed,
      };
    });
  }, []);

  // Update specific field on a round
  const updateSprayingRoundField = useCallback(
    (roundIdx: number, field: string, value: any) => {
      setActualState((prev) => {
        const currentRounds = [...(prev.t7SprayingRounds || [])];
        if (!currentRounds[roundIdx]) return prev;

        currentRounds[roundIdx] = {
          ...currentRounds[roundIdx],
          [field]: value,
        };

        return {
          ...prev,
          t7SprayingRounds: currentRounds,
        };
      });
    },
    [],
  );

  // Add Additional Product to a round
  const addAdditionalProductToRound = useCallback((roundIdx: number) => {
    setActualState((prev) => {
      const currentRounds = [...(prev.t7SprayingRounds || [])];
      if (!currentRounds[roundIdx]) return prev;

      const newProd: Type7bAdditionalProductItem = {
        id: `add-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: "",
        productName: "",
        actualQuantity: 1,
        quantityUsed: 1,
        extraQuantity: "",
        extraUnit: "ซีซี",
        applicationRate: "",
        actualRate: "",
        unit: "ขวด",
      };

      currentRounds[roundIdx] = {
        ...currentRounds[roundIdx],
        additionalProducts: [...(currentRounds[roundIdx].additionalProducts || []), newProd],
      };

      return {
        ...prev,
        t7SprayingRounds: currentRounds,
      };
    });
  }, []);

  // Update Additional Product in a round
  const updateAdditionalProduct = useCallback(
    (roundIdx: number, prodIdx: number, field: string, value: any) => {
      setActualState((prev) => {
        const currentRounds = [...(prev.t7SprayingRounds || [])];
        if (!currentRounds[roundIdx]) return prev;

        const prods = [...(currentRounds[roundIdx].additionalProducts || [])];
        if (!prods[prodIdx]) return prev;

        prods[prodIdx] = {
          ...prods[prodIdx],
          [field]: value,
        };

        // Sync field aliases
        if (field === "actualQuantity") {
          prods[prodIdx].quantityUsed = value;
        } else if (field === "quantityUsed") {
          prods[prodIdx].actualQuantity = value;
        } else if (field === "applicationRate") {
          prods[prodIdx].actualRate = value;
        } else if (field === "actualRate") {
          prods[prodIdx].applicationRate = value;
        }

        currentRounds[roundIdx] = {
          ...currentRounds[roundIdx],
          additionalProducts: prods,
        };

        return {
          ...prev,
          t7SprayingRounds: currentRounds,
        };
      });
    },
    [],
  );

  // Remove Additional Product from a round
  const removeAdditionalProduct = useCallback((roundIdx: number, prodIdx: number) => {
    setActualState((prev) => {
      const currentRounds = [...(prev.t7SprayingRounds || [])];
      if (!currentRounds[roundIdx]) return prev;

      const prods = (currentRounds[roundIdx].additionalProducts || []).filter(
        (_, idx) => idx !== prodIdx,
      );

      currentRounds[roundIdx] = {
        ...currentRounds[roundIdx],
        additionalProducts: prods,
      };

      return {
        ...prev,
        t7SprayingRounds: currentRounds,
      };
    });
  }, []);

  // Update Baseline Product in a round
  const updateBaselineProduct = useCallback(
    (roundIdx: number, prodIdx: number, field: string, value: any) => {
      setActualState((prev) => {
        const currentRounds = [...(prev.t7SprayingRounds || [])];
        if (!currentRounds[roundIdx]) return prev;

        const prods = [...(currentRounds[roundIdx].baselineProducts || [])];
        if (!prods[prodIdx]) return prev;

        prods[prodIdx] = {
          ...prods[prodIdx],
          [field]: value,
        };

        // Sync field aliases
        if (field === "actualQuantity") {
          prods[prodIdx].quantityUsed = value;
        } else if (field === "applicationRate") {
          prods[prodIdx].actualRate = value;
        }

        currentRounds[roundIdx] = {
          ...currentRounds[roundIdx],
          baselineProducts: prods,
        };

        return {
          ...prev,
          t7SprayingRounds: currentRounds,
        };
      });
    },
    [],
  );

  // Update Round Images
  const updateRoundImages = useCallback((roundIdx: number, images: ImageFile[]) => {
    setActualState((prev) => {
      const currentRounds = [...(prev.t7SprayingRounds || [])];
      if (!currentRounds[roundIdx]) return prev;

      currentRounds[roundIdx] = {
        ...currentRounds[roundIdx],
        roundImages: images,
      };

      return {
        ...prev,
        t7SprayingRounds: currentRounds,
      };
    });
  }, []);

  const hydrate = useCallback((parsedData: Type7bActualRecord) => {
    if (!parsedData || Object.keys(parsedData).length === 0) return;
    setActualState((prev) => ({
      ...prev,
      ...parsedData,
      t7SprayingRounds:
        Array.isArray(parsedData.t7SprayingRounds) && parsedData.t7SprayingRounds.length > 0
          ? parsedData.t7SprayingRounds
          : prev.t7SprayingRounds,
    }));
  }, []);

  const validate = useCallback(() => {
    return validateType7bActual(actualState);
  }, [actualState]);

  return {
    actualState,
    setActualState,
    hydrate,
    handleUpdateField,
    initBaselineProducts,
    addSprayingRound,
    removeSprayingRound,
    updateSprayingRoundField,
    addAdditionalProductToRound,
    updateAdditionalProduct,
    removeAdditionalProduct,
    updateBaselineProduct,
    updateRoundImages,
    validate,
  };
}
