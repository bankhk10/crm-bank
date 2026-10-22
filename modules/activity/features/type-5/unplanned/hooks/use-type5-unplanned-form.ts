"use client";

import { useState, useCallback, useEffect } from "react";
import type { Type5UnplannedItem } from "../types/unplanned.types";

export interface UseType5UnplannedFormOptions {
  initialItems?: Type5UnplannedItem[];
}

export function useType5UnplannedForm(options: UseType5UnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type5UnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems;
    }
    return [
      {
        id: `type5-unplanned-${Date.now()}-0`,
        storeId: "",
        storeName: "",
        productId: "",
        comparedProduct: "",
        detail: "",
        competitorBrand: "",
        competitorProduct: "",
        posPrice: null,
        dealerPrice: null,
        subdealerPrice: null,
        farmerPrice: null,
        sellingPoints: "",
        bottleImages: [],
        promotionalImages: [],
      },
    ];
  });

  useEffect(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      setItems(options.initialItems);
    }
  }, [options.initialItems]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: `type5-unplanned-${Date.now()}-${prev.length}`,
        storeId: "",
        storeName: "",
        productId: "",
        comparedProduct: "",
        detail: "",
        competitorBrand: "",
        competitorProduct: "",
        posPrice: null,
        dealerPrice: null,
        subdealerPrice: null,
        farmerPrice: null,
        sellingPoints: "",
        bottleImages: [],
        promotionalImages: [],
      },
    ]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type5UnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
  };
}
