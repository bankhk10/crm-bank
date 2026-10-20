"use client";

import { useState, useCallback } from "react";
import type { Type7aPlanItem } from "../types/planned.types";
import { hydrateType7aPlannedData } from "../application/planned-mapper";
import { validateType7aFormItems } from "../application/planned-validation";

export interface UseType7aPlannedFormOptions {
  initial?: any;
}

export function useType7aPlannedForm(options: UseType7aPlannedFormOptions = {}) {
  const [type7aPlots, setType7aPlots] = useState<Type7aPlanItem[]>(() => {
    const hydrated = hydrateType7aPlannedData(options.initial);
    if (hydrated.length > 0) return hydrated;

    return [
      {
        id: `plot-${Date.now()}-0`,
        plotName: "",
        farmerName: "",
        ownerName: "",
        storeId: null,
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: null,
        treeCount: null,
        objective: "",
        notes: "",
        hasProducts: true,
        demoProducts: [],
        products: [],
      },
    ];
  });

  const addType7aRow = useCallback(() => {
    setType7aPlots((prev) => [
      ...prev,
      {
        id: `plot-${Date.now()}-${prev.length}`,
        plotName: "",
        farmerName: "",
        ownerName: "",
        storeId: null,
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: null,
        treeCount: null,
        objective: "",
        notes: "",
        hasProducts: true,
        demoProducts: [],
        products: [],
      },
    ]);
  }, []);

  const updateType7aRow = useCallback(
    (id: string, field: keyof Type7aPlanItem, val: any) => {
      setType7aPlots((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
      );
    },
    [],
  );

  const deleteType7aRow = useCallback((id: string) => {
    setType7aPlots((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  const addProductToDemoPlot = useCallback((plotId: string) => {
    setType7aPlots((prev) =>
      prev.map((plot) => {
        if (plot.id !== plotId) return plot;
        const currentProds = plot.demoProducts || plot.products || [];
        const newProds = [
          ...currentProds,
          {
            id: `prod-${Date.now()}-${currentProds.length}`,
            productId: "",
            productName: "",
            quantity: 1,
            targetQuantity: 1,
            unit: "ขวด",
          },
        ];
        return {
          ...plot,
          demoProducts: newProds,
          products: newProds,
        };
      }),
    );
  }, []);

  const updateProductInDemoPlot = useCallback(
    (plotId: string, prodIndex: number, field: string, val: any) => {
      setType7aPlots((prev) =>
        prev.map((plot) => {
          if (plot.id !== plotId) return plot;
          const currentProds = [...(plot.demoProducts || plot.products || [])];
          if (currentProds[prodIndex]) {
            currentProds[prodIndex] = {
              ...currentProds[prodIndex],
              [field]: val,
            };
          }
          return {
            ...plot,
            demoProducts: currentProds,
            products: currentProds,
          };
        }),
      );
    },
    [],
  );

  const deleteProductFromDemoPlot = useCallback(
    (plotId: string, prodIndex: number) => {
      setType7aPlots((prev) =>
        prev.map((plot) => {
          if (plot.id !== plotId) return plot;
          const currentProds = (plot.demoProducts || plot.products || []).filter(
            (_, idx) => idx !== prodIndex,
          );
          return {
            ...plot,
            demoProducts: currentProds,
            products: currentProds,
          };
        }),
      );
    },
    [],
  );

  const validate = useCallback(() => {
    return validateType7aFormItems(type7aPlots);
  }, [type7aPlots]);

  return {
    type7aPlots,
    type7aItems: type7aPlots, // Alias for backward compatibility
    setType7aPlots,
    addType7aRow,
    updateType7aRow,
    deleteType7aRow,
    addProductToDemoPlot,
    updateProductInDemoPlot,
    deleteProductFromDemoPlot,
    validate,
  };
}

export const useType7aForm = useType7aPlannedForm;
