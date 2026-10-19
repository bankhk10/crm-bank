"use client";

import { useState, useCallback } from "react";
import type {
  Type2UnplannedItem,
  Type2UnplannedProductItem,
} from "../types/unplanned.types";
import {
  validateType2UnplannedItem,
  type Type2UnplannedValidationResult,
} from "../application/unplanned-validation";

export interface UseType2UnplannedFormOptions {
  initialItems?: Type2UnplannedItem[];
  defaultProvince?: string;
}

export function useType2UnplannedForm({
  initialItems,
  defaultProvince = "",
}: UseType2UnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type2UnplannedItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [
      {
        id: "1",
        visitPurpose: "FARMER",
        province: defaultProvince,
        isUnregisteredFarmer: false,
        storeId: "",
        customerName: "",
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        notes: "",
        products: [
          {
            id: "p0",
            productName: "",
            notes: "",
            usageResult: "พืชตอบสนองดี",
            followupDetail: "",
            problemDetail: "",
          },
        ],
        images: [],
      },
    ];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        visitPurpose: "FARMER",
        province: defaultProvince,
        isUnregisteredFarmer: false,
        storeId: "",
        customerName: "",
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        notes: "",
        products: [
          {
            id: `p-${Date.now()}-0`,
            productName: "",
            notes: "",
            usageResult: "พืชตอบสนองดี",
            followupDetail: "",
            problemDetail: "",
          },
        ],
        images: [],
      },
    ]);
  }, [defaultProvince]);

  const updateItem = useCallback(
    (id: string, field: keyof Type2UnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const addProductToItem = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          products: [
            ...it.products,
            {
              id: `p-${Date.now()}`,
              productName: "",
              notes: "",
              usageResult: "พืชตอบสนองดี",
              followupDetail: "",
              problemDetail: "",
              isAdditional: false,
            },
          ],
        };
      }),
    );
  }, []);

  const updateProductInItem = useCallback(
    (
      itemId: string,
      prodId: string,
      field: keyof Type2UnplannedProductItem,
      val: any,
    ) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            products: it.products.map((p) =>
              p.id === prodId ? { ...p, [field]: val } : p,
            ),
          };
        }),
      );
    },
    [],
  );

  const deleteProductFromItem = useCallback(
    (itemId: string, prodId: string) => {
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
    },
    [],
  );

  const validate = useCallback(
    (
      customersList: Array<{ id: string; name: string }> = [],
    ): Type2UnplannedValidationResult => {
      for (const item of items) {
        const res = validateType2UnplannedItem({ item, customersList });
        if (!res.isValid) return res;
      }
      return { isValid: true };
    },
    [items],
  );

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
