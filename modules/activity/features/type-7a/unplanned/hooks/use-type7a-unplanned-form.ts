"use client";

import { useState, useCallback } from "react";
import type { Type7aUnplannedItem } from "../types/unplanned.types";
import { hydrateType7aUnplannedData } from "../application/unplanned-mapper";
import { validateType7aUnplannedItems } from "../application/unplanned-validation";

export interface UseType7aUnplannedFormOptions {
  initialItems?: Type7aUnplannedItem[];
}

export function useType7aUnplannedForm(options: UseType7aUnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type7aUnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems;
    }
    return [
      {
        id: `type7a-unplanned-${Date.now()}-0`,
        plotName: "",
        farmerName: "",
        storeId: null,
        province: "",
        district: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: null,
        objective: "",
        notes: "",
        latitude: null,
        longitude: null,
        demoProducts: [],
        initialPhotos: [],
      },
    ];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: `type7a-unplanned-${Date.now()}-${prev.length}`,
        plotName: "",
        farmerName: "",
        storeId: null,
        province: "",
        district: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: null,
        objective: "",
        notes: "",
        latitude: null,
        longitude: null,
        demoProducts: [],
        initialPhotos: [],
      },
    ]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type7aUnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  const addProductToItem = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentProds = item.demoProducts || [];
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
          ...item,
          demoProducts: newProds,
        };
      }),
    );
  }, []);

  const updateProductInItem = useCallback(
    (itemId: string, prodIndex: number, field: string, val: any) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const currentProds = [...(item.demoProducts || [])];
          if (currentProds[prodIndex]) {
            currentProds[prodIndex] = {
              ...currentProds[prodIndex],
              [field]: val,
            };
          }
          return {
            ...item,
            demoProducts: currentProds,
          };
        }),
      );
    },
    [],
  );

  const deleteProductFromItem = useCallback(
    (itemId: string, prodIndex: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const currentProds = (item.demoProducts || []).filter(
            (_, idx) => idx !== prodIndex,
          );
          return {
            ...item,
            demoProducts: currentProds,
          };
        }),
      );
    },
    [],
  );

  const validate = useCallback(() => {
    return validateType7aUnplannedItems(items);
  }, [items]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    addProductToItem,
    updateProductInItem,
    deleteProductFromItem,
    validate,
  };
}
