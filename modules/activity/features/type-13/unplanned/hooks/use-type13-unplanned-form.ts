"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Type13UnplannedItem } from "../types/unplanned.types";
import {
  validateType13UnplannedItem,
  validateType13UnplannedItems,
} from "../application/unplanned-validation";
import {
  hydrateType13UnplannedData,
  hydrateType13UnplannedItems,
  mapType13UnplannedToPayload,
} from "../application/unplanned-mapper";
import type {
  Type13ImageFile,
  DealerOption,
  ProductOption,
} from "../../shared/types";

export interface UseType13UnplannedFormOptions {
  initial?: any;
  dealers?: DealerOption[];
  products?: ProductOption[];
}

export function useType13UnplannedForm(
  options: UseType13UnplannedFormOptions = {},
) {
  const [items, setItems] = useState<Type13UnplannedItem[]>(() =>
    hydrateType13UnplannedItems(options.initial),
  );

  const initialPayloadRef = useRef<any>(options.initial);
  const isHydratedRef = useRef(false);

  // Sync hydration when initialData loads asynchronously (e.g. Unplanned Edit mode)
  useEffect(() => {
    if (!options.initial) return;

    const hasSignificantData =
      Boolean(options.initial.type13Targets?.length) ||
      Boolean(options.initial.type13UnplannedItems?.length) ||
      Boolean(options.initial.type13Plots?.length) ||
      Boolean(options.initial.type13Data?.plots?.length) ||
      Boolean(options.initial.type13?.plots?.length) ||
      Boolean(options.initial.type13Products?.length) ||
      Boolean(options.initial.storeId) ||
      Boolean(options.initial.id && options.initial.id !== "unplanned");

    if (hasSignificantData || !isHydratedRef.current) {
      initialPayloadRef.current = options.initial;
      const hydrated = hydrateType13UnplannedItems(options.initial);
      setItems(hydrated);
      isHydratedRef.current = true;
    }
  }, [options.initial]);

  // Add new village / plot (Max 10)
  const addItem = useCallback(() => {
    setItems((prev) => {
      if (prev.length >= 10) return prev;
      const nextIndex = prev.length + 1;
      const firstItem = prev[0];
      const newItem: Type13UnplannedItem = {
        id: `unplanned-plot-${Date.now()}-${nextIndex}`,
        name: `แปลงที่ ${nextIndex}`,
        plotName: `แปลงที่ ${nextIndex}`,
        storeId: firstItem?.storeId || "",
        dealerName: firstItem?.dealerName || "",
        province: firstItem?.province || "",
        district: firstItem?.district || "",
        subdistrict: "",
        village: "",
        actualPlotsCount: 1,
        objective: "",
        notes: "",
        products: [],
        images: [],
        afterSprayImages: [],
      };
      return [...prev, newItem];
    });
  }, []);

  // Delete village / plot (Min 1)
  const deleteItem = useCallback((index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Update item (supports both index-based update and single item update)
  const updateItem = useCallback(
    (
      indexOrUpdated: number | Type13UnplannedItem,
      maybeUpdated?: Type13UnplannedItem,
    ) => {
      if (typeof indexOrUpdated === "number") {
        const index = indexOrUpdated;
        const updated = maybeUpdated!;
        setItems((prev) => {
          const next = [...prev];
          next[index] = updated;
          return next;
        });
      } else {
        const updated = indexOrUpdated;
        setItems((prev) => {
          if (prev.length === 0) return [updated];
          const next = [...prev];
          next[0] = updated;
          return next;
        });
      }
    },
    [],
  );

  const updateItemSingle = useCallback((updated: Type13UnplannedItem) => {
    setItems((prev) => {
      if (prev.length === 0) return [updated];
      const next = [...prev];
      next[0] = updated;
      return next;
    });
  }, []);

  // Validate all items
  const validate = useCallback(() => {
    return validateType13UnplannedItems(items);
  }, [items]);

  // Upload images helper
  const uploadImages = useCallback(
    async (
      files: File[],
      itemIndex: number = 0,
    ): Promise<Type13ImageFile[]> => {
      if (!files || files.length === 0) return [];

      const uploaded: Type13ImageFile[] = files.map((file, idx) => ({
        id: `local-${Date.now()}-${idx}`,
        url: typeof window !== "undefined" ? URL.createObjectURL(file) : "",
        name: file.name,
        size: file.size,
        type: file.type,
        rawFile: file,
        file,
      }));

      setItems((prev) => {
        const next = [...prev];
        const target = next[itemIndex] || next[0];
        if (target) {
          const updatedImages = [...(target.images || []), ...uploaded];
          next[itemIndex] = {
            ...target,
            images: updatedImages,
            afterSprayImages: updatedImages,
          };
        }
        return next;
      });

      return uploaded;
    },
    [],
  );

  // Map to payload
  const getPayload = useCallback(() => {
    return mapType13UnplannedToPayload(items);
  }, [items]);

  return {
    items,
    setItems,
    item: items[0] || hydrateType13UnplannedData(options.initial),
    setItem: updateItemSingle,
    updateItem,
    updateItemSingle,
    addItem,
    deleteItem,
    validate,
    uploadImages,
    getPayload,
  };
}
