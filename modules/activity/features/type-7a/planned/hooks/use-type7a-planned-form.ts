"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Type7aPlanItem } from "../types/planned.types";
import { hydrateType7aPlannedData } from "../application/planned-mapper";
import { validateType7aFormItems } from "../application/planned-validation";

export interface UseType7aPlannedFormOptions {
  initial?: any;
  initialItems?: Type7aPlanItem[];
}

export function useType7aPlannedForm(options: UseType7aPlannedFormOptions = {}) {
  const [type7aPlots, setType7aPlots] = useState<Type7aPlanItem[]>(() => {
    const raw = options.initialItems || options.initial;
    const hydrated = Array.isArray(raw) ? raw : hydrateType7aPlannedData(raw);
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

  const isHydratedRef = useRef(false);
  useEffect(() => {
    const candidate = options.initialItems || options.initial;
    if (!isHydratedRef.current && candidate) {
      const hydrated = Array.isArray(candidate)
        ? candidate
        : hydrateType7aPlannedData(candidate);
      if (hydrated.length > 0) {
        const hasRealData = hydrated.some(
          (p) =>
            Boolean(p.plotName) ||
            Boolean(p.storeId) ||
            Boolean(p.farmerName) ||
            Boolean(p.ownerName) ||
            Boolean(p.cropName) ||
            (p.products && p.products.length > 0) ||
            (p.demoProducts && p.demoProducts.length > 0),
        );
        if (hasRealData) {
          setType7aPlots(hydrated);
          isHydratedRef.current = true;
        }
      }
    }
  }, [options.initial, options.initialItems]);

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
