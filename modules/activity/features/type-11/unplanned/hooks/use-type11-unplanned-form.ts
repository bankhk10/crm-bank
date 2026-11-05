"use client";

import { useState, useCallback } from "react";
import type {
  Type11UnplannedItem,
  UseType11UnplannedFormOptions,
  UseType11UnplannedFormResult,
  Type11UnplannedValidationResult,
} from "../types/unplanned.types";

export type { UseType11UnplannedFormOptions, UseType11UnplannedFormResult };
import type { Type11StockItem } from "../../shared/types";
import { validateType11UnplannedItems } from "../application/unplanned-validation";

export function useType11UnplannedForm({
  initialItems = [],
  customersList = [],
  productsList = [],
}: UseType11UnplannedFormOptions = {}): UseType11UnplannedFormResult {
  const [items, setItems] = useState<Type11UnplannedItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [
      {
        id: crypto.randomUUID(),
        storeId: null,
        storeName: "",
        stockItems: [],
        nextAction: "",
        remarks: "",
        images: [],
      },
    ];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        storeId: null,
        storeName: "",
        stockItems: [],
        nextAction: "",
        remarks: "",
        images: [],
      },
    ]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type11UnplannedItem | string, value: any) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        }),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: crypto.randomUUID(),
            storeId: null,
            storeName: "",
            stockItems: [],
            nextAction: "",
            remarks: "",
            images: [],
          },
        ];
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const addStockItem = useCallback((itemId: string, selectedProductId?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const matchedProd = selectedProductId
          ? productsList.find((p) => p.id === selectedProductId || p.name === selectedProductId)
          : undefined;

        const newStockItem: Type11StockItem = {
          id: crypto.randomUUID(),
          storeId: item.storeId,
          storeName: item.storeName,
          productId: matchedProd?.id || selectedProductId || undefined,
          productName: matchedProd?.name || selectedProductId || "",
          productCode: matchedProd?.productCode || undefined,
          remainingQty: "",
          stockStatus: "ปกติ",
          reorderOpportunity: "",
          remarks: "",
        };

        return {
          ...item,
          stockItems: [...(item.stockItems || []), newStockItem],
        };
      }),
    );
  }, [productsList]);

  const updateStockItem = useCallback(
    (
      itemId: string,
      stockItemId: string,
      field: keyof Type11StockItem,
      value: any,
    ) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const updatedStock = (item.stockItems || []).map((si) => {
            if (si.id === stockItemId) {
              return { ...si, [field]: value };
            }
            return si;
          });
          return { ...item, stockItems: updatedStock };
        }),
      );
    },
    [],
  );

  const deleteStockItem = useCallback((itemId: string, stockItemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          stockItems: (item.stockItems || []).filter((si) => si.id !== stockItemId),
        };
      }),
    );
  }, []);

  const validate = useCallback((): Type11UnplannedValidationResult => {
    return validateType11UnplannedItems(items);
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    validate,
    setItems,
  };
}
