"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Type14PlotItem,
  Type14WithdrawnProductLine,
  FollowUpPlanOption,
} from "../../shared/types";
import type {
  Type14PlanInput,
  Type14ValidationResult,
} from "../types/planned.types";
import { hydrateType14PlannedData } from "../application/planned-mapper";
import { validateType14FormValues } from "../application/planned-validation";

export interface UseType14PlannedFormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
  defaultProvince?: string;
  defaultDistrict?: string;
  availablePlans?: FollowUpPlanOption[];
}

export interface UseType14PlannedFormResult {
  data: Type14PlanInput;
  setData: React.Dispatch<React.SetStateAction<Type14PlanInput>>;
  updateField: <K extends keyof Type14PlanInput>(
    field: K,
    val: Type14PlanInput[K],
  ) => void;
  mode: "EXISTING_PLOT" | "NEW_PLOT";
  setMode: (mode: "EXISTING_PLOT" | "NEW_PLOT") => void;
  hasProductWithdrawal: boolean;
  setHasProductWithdrawal: (val: boolean) => void;
  withdrawnProducts: Type14WithdrawnProductLine[];
  setWithdrawnProducts: (val: Type14WithdrawnProductLine[]) => void;
  plots: Type14PlotItem[];
  setPlots: (val: Type14PlotItem[]) => void;
  validateType14: () => Type14ValidationResult;
  mapType14Payload: (
    customers?: any[],
    products?: any[],
  ) => {
    type14Data?: {
      sourceActivityPlanId?: string | null;
      mode: "EXISTING_PLOT" | "NEW_PLOT";
      hasProducts: boolean;
      hasProductWithdrawal: boolean;
      notes?: string | null;
      plots: any[];
      products: any[];
      withdrawnProducts: any[];
    };
    type14Plots?: Type14PlotItem[];
    planStores: Array<{
      workTypeCode: string;
      visitPurpose?: "FARMER" | "STORE" | null;
      storeId: string;
      storeName: string;
      province: string | null;
      remarks: string;
      notes: string;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
      storeId?: string | null;
    }>;
  };
}

export function useType14PlannedForm({
  initial = {},
  selectedWorkTypes = [],
  defaultProvince = "",
  defaultDistrict = "",
  availablePlans = [],
}: UseType14PlannedFormOptions = {}): UseType14PlannedFormResult {
  const [data, setData] = useState<Type14PlanInput>(() =>
    hydrateType14PlannedData(
      initial,
      defaultProvince,
      defaultDistrict,
      availablePlans,
    ),
  );

  const [prevInitial, setPrevInitial] = useState(initial);

  useEffect(() => {
    // Only re-hydrate from initial if initial actually contains real Type 14 data (e.g. async load in edit mode)
    const hasInitialT14Data =
      Boolean(initial?.type14) ||
      Boolean(initial?.type14Targets && initial.type14Targets.length > 0) ||
      Boolean(initial?.type14Plots && initial.type14Plots.length > 0);

    if (hasInitialT14Data && initial !== prevInitial) {
      setPrevInitial(initial);
      const hydrated = hydrateType14PlannedData(
        initial,
        defaultProvince,
        defaultDistrict,
        availablePlans,
      );
      setData(hydrated);
    }
  }, [initial, prevInitial, defaultProvince, defaultDistrict, availablePlans]);

  const updateField = useCallback(
    <K extends keyof Type14PlanInput>(field: K, val: Type14PlanInput[K]) => {
      setData((prev) => ({
        ...prev,
        [field]: val,
      }));
    },
    [],
  );

  const setMode = useCallback((mode: "EXISTING_PLOT" | "NEW_PLOT") => {
    setData((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  const setHasProductWithdrawal = useCallback((val: boolean) => {
    setData((prev) => ({
      ...prev,
      hasProductWithdrawal: val,
    }));
  }, []);

  const setWithdrawnProducts = useCallback(
    (val: Type14WithdrawnProductLine[]) => {
      setData((prev) => ({
        ...prev,
        withdrawnProducts: val,
      }));
    },
    [],
  );

  const setPlots = useCallback((plots: Type14PlotItem[]) => {
    setData((prev) => ({
      ...prev,
      plots,
      selectedPlotIds: plots.map((p) => p.demoPlotId || p.id).filter(Boolean),
    }));
  }, []);

  const validateType14 = useCallback((): Type14ValidationResult => {
    const isType14Active = selectedWorkTypes.some(
      (t) =>
        t === "TYPE_14" ||
        t.includes("TYPE_14") ||
        t.includes("ติดตามแปลงแฮตแทค") ||
        t.includes("ติดตามแปลงแฮตแทค") ||
        t.includes("ติดตามแปลง"),
    );

    if (!isType14Active) {
      return { isValid: true };
    }

    return validateType14FormValues(data);
  }, [selectedWorkTypes, data]);

  const mapType14Payload = useCallback(
    (customers: any[] = [], products: any[] = []) => {
      const isType14Active = selectedWorkTypes.some(
        (t) =>
          t === "TYPE_14" ||
          t.includes("TYPE_14") ||
          t.includes("ติดตามแปลงแฮตแทค") ||
          t.includes("ติดตามแปลงแฮตแทค") ||
          t.includes("ติดตามแปลง"),
      );

      if (!isType14Active) {
        return {
          type14Data: undefined,
          type14Plots: undefined,
          planStores: [],
          planProducts: [],
        };
      }

      const planStores: any[] = [];
      const seenStores = new Set<string>();

      // Register primary store if present
      if (data.storeId && !seenStores.has(data.storeId)) {
        seenStores.add(data.storeId);
        const matchedCust = customers.find((c) => c.id === data.storeId);
        planStores.push({
          workTypeCode: "TYPE_14",
          visitPurpose: "STORE",
          storeId: data.storeId,
          storeName:
            data.dealerName || matchedCust?.name || "Dealer ติดตามแปลงแฮตแทค",
          province: data.province || matchedCust?.province || null,
          remarks: `Dealer ติดตามแปลงแฮตแทค (${data.name || "แปลงแฮตแทค"})`,
          notes: `แปลงแฮตแทค: ${data.name || "แปลงแฮตแทค"}`,
        });
      }

      // Also register store from any explicit plots
      if (data.plots && data.plots.length > 0) {
        data.plots.forEach((p, idx) => {
          if (p.storeId && !seenStores.has(p.storeId)) {
            seenStores.add(p.storeId);
            const matchedCust = customers.find((c) => c.id === p.storeId);
            planStores.push({
              workTypeCode: "TYPE_14",
              visitPurpose: "STORE",
              storeId: p.storeId,
              storeName:
                p.dealerName ||
                matchedCust?.name ||
                `Dealer แปลงที่ ${idx + 1}`,
              province: p.province || matchedCust?.province || null,
              remarks: `Dealer ติดตามแปลงแฮตแทค (${p.name || `แปลงที่ ${idx + 1}`})`,
              notes: `แปลงแฮตแทค: ${p.name || `แปลงที่ ${idx + 1}`}`,
            });
          }
        });
      }

      const planProducts: any[] = [];
      if (
        data.hasProductWithdrawal &&
        data.withdrawnProducts &&
        data.withdrawnProducts.length > 0
      ) {
        data.withdrawnProducts.forEach((p) => {
          if (p.productId) {
            const matchedProd = products.find(
              (prod) => prod.id === p.productId,
            );
            planProducts.push({
              workTypeCode: "TYPE_14",
              productId: p.productId,
              productName: p.productName || matchedProd?.name || null,
              targetQuantity: p.quantity != null ? Number(p.quantity) : 1,
              isPriceOverridden: false,
              storeId: data.storeId || null,
            });
          }
        });
      }

      const resolvedPlots: Type14PlotItem[] =
        data.plots && data.plots.length > 0
          ? data.plots
          : [
              {
                id: data.demoPlotId || "plot-1",
                demoPlotId: data.demoPlotId || null,
                name: data.name || "แปลงแฮตแทค",
                plotName: data.name || "แปลงแฮตแทค",
                storeId: data.storeId || "",
                dealerName: data.dealerName || null,
                ownerName: data.ownerName || null,
                cropCategory: data.cropCategory || null,
                cropName: data.cropName || null,
                areaRai: data.areaRai != null ? Number(data.areaRai) : null,
                treeCount:
                  data.treeCount != null ? Number(data.treeCount) : null,
                province: data.province || "",
                district: data.district || "",
                latitude: data.latitude || null,
                longitude: data.longitude || null,
              },
            ];

      const plotIds = (data.selectedPlotIds && data.selectedPlotIds.length > 0)
        ? data.selectedPlotIds
        : (data.type13TargetIds && data.type13TargetIds.length > 0)
          ? data.type13TargetIds
          : resolvedPlots.map((p) => p.type13TargetId || p.demoPlotId || p.id).filter(Boolean);

      const type14Data = {
        selectedPlanId: data.selectedPlanId || null,
        sourceActivityPlanId: data.selectedPlanId || null,
        mode: data.mode,
        selectedPlotIds: plotIds,
        type13TargetIds: plotIds,
        demoPlotIds: plotIds,
        name: data.name || resolvedPlots[0]?.name || "แปลงแฮตแทค",
        dealerName: data.dealerName || resolvedPlots[0]?.dealerName || null,
        ownerName: data.ownerName || resolvedPlots[0]?.ownerName || null,
        province: data.province || resolvedPlots[0]?.province || "",
        district: data.district || resolvedPlots[0]?.district || "",
        hasProducts: Boolean(data.hasProductWithdrawal),
        hasProductWithdrawal: Boolean(data.hasProductWithdrawal),
        notes: data.notes || null,
        plots: resolvedPlots.map((p, idx) => ({
          ...p,
          plotIndex: idx + 1,
        })),
        products: data.hasProductWithdrawal ? data.withdrawnProducts || [] : [],
        withdrawnProducts: data.hasProductWithdrawal
          ? data.withdrawnProducts || []
          : [],
      };

      return {
        type14Data,
        type14Plots: resolvedPlots,
        planStores,
        planProducts,
      };
    },
    [selectedWorkTypes, data],
  );

  return {
    data,
    setData,
    updateField,
    mode: data.mode,
    setMode,
    hasProductWithdrawal: Boolean(data.hasProductWithdrawal),
    setHasProductWithdrawal,
    withdrawnProducts: data.withdrawnProducts || [],
    setWithdrawnProducts,
    plots: data.plots || [],
    setPlots,
    validateType14,
    mapType14Payload,
  };
}

export const useType14Form = useType14PlannedForm;
