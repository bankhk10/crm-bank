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

  const validate = useCallback(() => {
    return validateType14UnplannedItem(item);
  }, [item]);

  const uploadImages = useCallback(
    async (files: File[]): Promise<Type14ImageFile[]> => {
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

      setItem((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploaded],
      }));

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
    validate,
    uploadImages,
    getPayload,
  };
}
