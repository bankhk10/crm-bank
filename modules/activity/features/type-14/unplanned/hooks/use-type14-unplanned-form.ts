"use client";

import { useState, useCallback } from "react";
import type { Type14UnplannedItem } from "../types/unplanned.types";
import { validateType14UnplannedItem } from "../application/unplanned-validation";
import {
  hydrateType14UnplannedData,
  mapType14UnplannedToPayload,
} from "../application/unplanned-mapper";
import type {
  Type14ImageFile,
  Type14PlotActualState,
  Type14ActualProductState,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";

export interface UseType14UnplannedFormOptions {
  initial?: any;
  dealers?: DealerCustomerOption[];
  products?: ProductOption[];
}

export function useType14UnplannedForm(
  options: UseType14UnplannedFormOptions = {},
) {
  const [item, setItem] = useState<Type14UnplannedItem>(() =>
    hydrateType14UnplannedData(options.initial),
  );

  const updateItem = useCallback((updated: Type14UnplannedItem) => {
    setItem(updated);
  }, []);

  const updatePlotField = useCallback(
    (plotIdx: number, field: keyof Type14PlotActualState, value: any) => {
      setItem((prev) => {
        const plots = [...(prev.plots || [])];
        if (plots[plotIdx]) {
          plots[plotIdx] = { ...plots[plotIdx], [field]: value };
          if (field === "actualPlotsCount" && plotIdx === 0) {
            return { ...prev, plots, actualPlotsCount: value };
          }
        }
        return { ...prev, plots };
      });
    },
    [],
  );

  const updatePlotProduct = useCallback(
    (
      plotIdx: number,
      prodIdx: number,
      field: keyof Type14ActualProductState,
      value: any,
    ) => {
      setItem((prev) => {
        const plots = [...(prev.plots || [])];
        if (plots[plotIdx]) {
          const prods = [...(plots[plotIdx].products || [])];
          if (prods[prodIdx]) {
            prods[prodIdx] = { ...prods[prodIdx], [field]: value };
            if (field === "actualQuantity") {
              prods[prodIdx].quantityUsed = value;
            }
          }
          plots[plotIdx] = { ...plots[plotIdx], products: prods };
        }
        return { ...prev, plots };
      });
    },
    [],
  );

  const addPlotProduct = useCallback(
    (plotIdx: number, newProd?: Partial<Type14ActualProductState>) => {
      setItem((prev) => {
        const plots = [...(prev.plots || [])];
        if (plots[plotIdx]) {
          const prods = [...(plots[plotIdx].products || [])];
          prods.push({
            productId: newProd?.productId || "",
            productName: newProd?.productName || "",
            unit: newProd?.unit || "ขวด",
            actualQuantity: newProd?.actualQuantity ?? 1,
            quantityUsed: newProd?.quantityUsed ?? 1,
            extraQuantity: newProd?.extraQuantity || "",
            extraUnit: newProd?.extraUnit || "ซีซี",
            actualRate: newProd?.actualRate || "",
            detail: newProd?.detail || "",
          });
          plots[plotIdx] = { ...plots[plotIdx], products: prods };
        }
        return { ...prev, plots };
      });
    },
    [],
  );

  const removePlotProduct = useCallback(
    (plotIdx: number, prodIdx: number) => {
      setItem((prev) => {
        const plots = [...(prev.plots || [])];
        if (plots[plotIdx]) {
          const prods = (plots[plotIdx].products || []).filter(
            (_, idx) => idx !== prodIdx,
          );
          plots[plotIdx] = { ...plots[plotIdx], products: prods };
        }
        return { ...prev, plots };
      });
    },
    [],
  );

  const validate = useCallback(() => {
    return validateType14UnplannedItem(item);
  }, [item]);

  const uploadImages = useCallback(
    async (files: File[], plotIdx = 0): Promise<Type14ImageFile[]> => {
      if (!files || files.length === 0) return [];

      const uploaded: Type14ImageFile[] = files.map((file, idx) => ({
        id: `local-t14-${Date.now()}-${idx}`,
        url: typeof window !== "undefined" ? URL.createObjectURL(file) : "",
        name: file.name,
        size: file.size,
        type: file.type,
        rawFile: file,
        file,
      }));

      setItem((prev) => {
        const plots = [...(prev.plots || [])];
        if (plots[plotIdx]) {
          const existingImages = plots[plotIdx].afterSprayImages || [];
          plots[plotIdx] = {
            ...plots[plotIdx],
            afterSprayImages: [...existingImages, ...uploaded],
          };
        }
        return {
          ...prev,
          plots,
          images: plotIdx === 0 ? [...(prev.images || []), ...uploaded] : prev.images,
        };
      });

      return uploaded;
    },
    [],
  );

  const getPayload = useCallback(() => {
    return mapType14UnplannedToPayload(item);
  }, [item]);

  return {
    item,
    setItem,
    updateItem,
    updatePlotField,
    updatePlotProduct,
    addPlotProduct,
    removePlotProduct,
    validate,
    uploadImages,
    getPayload,
  };
}
