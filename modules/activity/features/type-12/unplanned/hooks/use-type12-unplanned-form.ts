import { useState, useCallback } from "react";
import type { Type12UnplannedItem } from "../types/unplanned.types";
import { validateType12UnplannedItem } from "../application/unplanned-validation";
import {
  hydrateType12UnplannedData,
  mapType12UnplannedToPayload,
} from "../application/unplanned-mapper";
import type { Type12ImageFile } from "../../shared/types";

export interface UseType12UnplannedFormOptions {
  initial?: any;
}

export function useType12UnplannedForm(options: UseType12UnplannedFormOptions = {}) {
  const [item, setItem] = useState<Type12UnplannedItem>(() =>
    hydrateType12UnplannedData(options.initial),
  );

  const updateItem = useCallback((updated: Type12UnplannedItem) => {
    setItem(updated);
  }, []);

  const validate = useCallback(() => {
    return validateType12UnplannedItem(item);
  }, [item]);

  const uploadImages = useCallback(async (files: File[]): Promise<Type12ImageFile[]> => {
    if (!files || files.length === 0) return [];

    const uploaded: Type12ImageFile[] = files.map((file, idx) => ({
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
    return mapType12UnplannedToPayload(item);
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
