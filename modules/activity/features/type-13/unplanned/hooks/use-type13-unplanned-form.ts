"use client";

import { useState, useCallback } from "react";
import type { Type13UnplannedItem } from "../types/unplanned.types";
import { validateType13UnplannedItem } from "../application/unplanned-validation";
import {
  hydrateType13UnplannedData,
  mapType13UnplannedToPayload,
} from "../application/unplanned-mapper";
import type { Type13ImageFile, DealerOption, ProductOption } from "../../shared/types";

export interface UseType13UnplannedFormOptions {
  initial?: any;
  dealers?: DealerOption[];
  products?: ProductOption[];
}

export function useType13UnplannedForm(options: UseType13UnplannedFormOptions = {}) {
  const [item, setItem] = useState<Type13UnplannedItem>(() =>
    hydrateType13UnplannedData(options.initial),
  );

  const updateItem = useCallback((updated: Type13UnplannedItem) => {
    setItem(updated);
  }, []);

  const validate = useCallback(() => {
    return validateType13UnplannedItem(item);
  }, [item]);

  const uploadImages = useCallback(async (files: File[]): Promise<Type13ImageFile[]> => {
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

    setItem((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...uploaded],
    }));

    return uploaded;
  }, []);

  const getPayload = useCallback(() => {
    return mapType13UnplannedToPayload(item);
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
