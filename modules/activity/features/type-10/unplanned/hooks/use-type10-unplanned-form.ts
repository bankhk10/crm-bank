"use client";

import { useState, useCallback } from "react";
import type {
  Type10UnplannedItem,
  Type10UnplannedValidationResult,
  UseType10UnplannedFormOptions,
  UseType10UnplannedFormResult,
} from "../types/unplanned.types";
import type { Type10SoldProductItem } from "../../shared/types";
import { validateType10UnplannedItems } from "../application/unplanned-validation";

export type { UseType10UnplannedFormOptions, UseType10UnplannedFormResult };

function createEmptyType10UnplannedItem(): Type10UnplannedItem {
  return {
    id: `t10-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    demoPlotId: null,
    plotName: "",
    farmerName: "",
    location: "",
    cropName: "",
    showcaseProduct: "",
    expectedAttendees: "",
    actualAttendees: "",
    targetBookingSales: "",
    actualSalesOrBooking: "",
    farmerFeedback: "",
    soldProducts: [],
    notes: "",
    images: [],
  };
}

export function useType10UnplannedForm({
  initialItems = [],
}: UseType10UnplannedFormOptions = {}): UseType10UnplannedFormResult {
  const [items, setItems] = useState<Type10UnplannedItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createEmptyType10UnplannedItem()];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyType10UnplannedItem()]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type10UnplannedItem | string, val: any) => {
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

  const addSoldProduct = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentProducts = item.soldProducts || [];
        const newProduct: Type10SoldProductItem = {
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: "",
          productName: "",
          quantity: 1,
          amount: 0,
        };
        return {
          ...item,
          soldProducts: [...currentProducts, newProduct],
        };
      }),
    );
  }, []);

  const updateSoldProduct = useCallback(
    (
      itemId: string,
      prodId: string,
      field: keyof Type10SoldProductItem,
      val: any,
    ) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const currentProducts = (item.soldProducts || []).map((p) => {
            if (p.id !== prodId) return p;
            return { ...p, [field]: val };
          });
          return {
            ...item,
            soldProducts: currentProducts,
          };
        }),
      );
    },
    [],
  );

  const deleteSoldProduct = useCallback((itemId: string, prodId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentProducts = (item.soldProducts || []).filter(
          (p) => p.id !== prodId,
        );
        return {
          ...item,
          soldProducts: currentProducts,
        };
      }),
    );
  }, []);

  const validate = useCallback((): Type10UnplannedValidationResult => {
    return validateType10UnplannedItems(items);
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    addSoldProduct,
    updateSoldProduct,
    deleteSoldProduct,
    validate,
    setItems,
  };
}
