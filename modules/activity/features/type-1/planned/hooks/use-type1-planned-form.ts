"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Type1PlannedItem } from "../types/planned.types";
import {
  validateType1PlannedItem,
  type PlannedValidationResult,
} from "../application/planned-validation";

export interface UseType1PlannedFormOptions {
  initialItems?: Type1PlannedItem[];
  defaultProvince?: string;
}

export function useType1PlannedForm({
  initialItems,
  defaultProvince = "",
}: UseType1PlannedFormOptions = {}) {
  const [items, setItems] = useState<Type1PlannedItem[]>(() => {
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
        topic: "แจ้งข่าวสาร",
        notes: "",
        detail: "",
      },
    ];
  });

  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (!isHydratedRef.current && initialItems && initialItems.length > 0) {
      const hasRealData = initialItems.some(
        (it) =>
          it.storeId ||
          it.customerName ||
          it.unregisteredFarmerName ||
          (it.notes && it.notes.trim() !== "") ||
          (it.detail && it.detail.trim() !== ""),
      );
      if (hasRealData) {
        setItems(initialItems);
        isHydratedRef.current = true;
      }
    }
  }, [initialItems]);

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
        topic: "แจ้งข่าวสาร",
        notes: "",
        detail: "",
      },
    ]);
  }, [defaultProvince]);

  const updateItem = useCallback(
    (id: string, field: keyof Type1PlannedItem, val: any) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const updated = { ...it, [field]: val };
          if (field === "notes") {
            updated.detail = val;
          } else if (field === "detail") {
            updated.notes = val;
          }
          return updated;
        }),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev; // Keep at least one item
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const validate = useCallback(
    (customersList: Array<{ id: string; name: string }> = []): PlannedValidationResult => {
      for (const item of items) {
        const res = validateType1PlannedItem({ item, customersList });
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
    validate,
  };
}
