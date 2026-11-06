"use client";

import { useState, useCallback } from "react";
import type {
  Type9UnplannedItem,
  Type9UnplannedValidationResult,
  UseType9UnplannedFormOptions,
  UseType9UnplannedFormResult,
} from "../types/unplanned.types";
import type { Type9ProductItem } from "../../shared/types";
import { validateType9UnplannedItems } from "../application/unplanned-validation";

export type { UseType9UnplannedFormOptions, UseType9UnplannedFormResult };

function createEmptyType9UnplannedItem(): Type9UnplannedItem {
  return {
    id: `t9-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isUnregisteredSubdealer: false,
    subdealerId: "",
    subdealerName: "",
    subDealerStore: "",
    province: "",
    district: "",
    parentDealerId: "",
    parentDealerName: "",
    targetSales: 0,
    actualSales: "",
    actualAttendees: "",
    products: [
      {
        id: `p-${Date.now()}`,
        productName: "",
        quantityCases: 0,
        pricePerCase: 0,
      },
    ],
    productSalesDetails: [],
    notes: "",
    images: [],
  };
}

export function useType9UnplannedForm({
  initialItems = [],
}: UseType9UnplannedFormOptions = {}): UseType9UnplannedFormResult {
  const [items, setItems] = useState<Type9UnplannedItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createEmptyType9UnplannedItem()];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyType9UnplannedItem()]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type9UnplannedItem | string, val: any) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return { ...item, [field]: val };
        }),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const addProductItem = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentProducts = item.products || [];
        const newProduct: Type9ProductItem = {
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productName: "",
          quantityCases: 0,
          pricePerCase: 0,
        };
        return {
          ...item,
          products: [...currentProducts, newProduct],
        };
      }),
    );
  }, []);

  const updateProductItem = useCallback(
    (
      itemId: string,
      prodId: string,
      field: keyof Type9ProductItem,
      val: any,
    ) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const currentProducts = (item.products || []).map((p) => {
            if (p.id !== prodId) return p;
            return { ...p, [field]: val };
          });
          return {
            ...item,
            products: currentProducts,
          };
        }),
      );
    },
    [],
  );

  const deleteProductItem = useCallback((itemId: string, prodId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentProducts = (item.products || []).filter(
          (p) => p.id !== prodId,
        );
        return {
          ...item,
          products: currentProducts,
        };
      }),
    );
  }, []);

  const validate = useCallback((): Type9UnplannedValidationResult => {
    return validateType9UnplannedItems(items);
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    addProductItem,
    updateProductItem,
    deleteProductItem,
    validate,
    setItems,
  };
}
