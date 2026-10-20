"use client";

import { useState, useCallback } from "react";
import type {
  Type3UnplannedItem,
  Type3UnplannedProductItem,
} from "../types/unplanned.types";
import type { ProductOption, StoreOption } from "../../shared/types";
import {
  validateType3UnplannedForm,
  type Type3UnplannedValidationResult,
} from "../application/unplanned-validation";

export interface UseType3UnplannedFormOptions {
  initialItems?: Type3UnplannedItem[];
  customersList?: StoreOption[];
  productsList?: ProductOption[];
}

export function useType3UnplannedForm({
  initialItems,
  customersList = [],
  productsList = [],
}: UseType3UnplannedFormOptions = {}) {
  const createDefaultProduct = useCallback(
    (prefix = "p0"): Type3UnplannedProductItem => ({
      id: prefix,
      productId: "",
      productName: "",
      targetQuantity: 1,
      actualQuantity: 1,
      unitPrice: 0,
      actualTotal: 0,
      unclosedReason: "",
      notes: "",
    }),
    [],
  );

  const createDefaultItem = useCallback(
    (id = "1"): Type3UnplannedItem => ({
      id,
      storeId: "",
      storeName: "",
      isSubDealer: false,
      subDealerStore: "",
      notes: "",
      products: [createDefaultProduct(`p-${id}-0`)],
    }),
    [createDefaultProduct],
  );

  const [items, setItems] = useState<Type3UnplannedItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createDefaultItem()];
  });

  const addItem = useCallback(() => {
    const newId = String(Date.now());
    setItems((prev) => [...prev, createDefaultItem(newId)]);
  }, [createDefaultItem]);

  const updateItem = useCallback(
    (id: string, field: keyof Type3UnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const updated: Type3UnplannedItem = { ...it, [field]: val };

          if (field === "storeId" && val) {
            const foundStore = customersList.find((c) => c.id === val);
            if (foundStore) {
              updated.storeName = foundStore.name;
            }
          }

          return updated;
        }),
      );
    },
    [customersList],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((it) => it.id !== id);
      });
    },
    [],
  );

  const addProduct = useCallback(
    (itemId: string) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const newProd = createDefaultProduct(`p-${itemId}-${Date.now()}`);
          return {
            ...it,
            products: [...it.products, newProd],
          };
        }),
      );
    },
    [createDefaultProduct],
  );

  const updateProduct = useCallback(
    (
      itemId: string,
      prodId: string,
      field: keyof Type3UnplannedProductItem,
      val: any,
      productOption?: ProductOption,
    ) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const updatedProducts = it.products.map((p) => {
            if (p.id !== prodId) return p;
            const updated = { ...p, [field]: val };

            if (field === "productName" || field === "productId") {
              const found =
                productOption ||
                productsList.find(
                  (pr) => pr.id === val || pr.name === val,
                );
              if (found) {
                updated.productId = found.id;
                updated.productName = found.name;
                if (found.price != null && updated.unitPrice === 0) {
                  updated.unitPrice = Number(found.price);
                }
              }
            }

            const q = Number(updated.actualQuantity) || 0;
            const u = Number(updated.unitPrice) || 0;
            updated.actualTotal = q * u;

            return updated;
          });

          return {
            ...it,
            products: updatedProducts,
          };
        }),
      );
    },
    [productsList],
  );

  const removeProduct = useCallback((itemId: string, prodId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (it.products.length <= 1) return it;
        return {
          ...it,
          products: it.products.filter((p) => p.id !== prodId),
        };
      }),
    );
  }, []);

  const validate = useCallback((): Type3UnplannedValidationResult => {
    return validateType3UnplannedForm({ items });
  }, [items]);

  const resetForm = useCallback(() => {
    setItems([createDefaultItem()]);
  }, [createDefaultItem]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    addProduct,
    updateProduct,
    removeProduct,
    validate,
    resetForm,
  };
}
