"use client";

import { useState, useCallback } from "react";
import type { Type4UnplannedItem } from "../types/unplanned.types";
import type { StoreOption } from "../../shared/types";
import {
  validateType4UnplannedForm,
  type Type4UnplannedValidationResult,
} from "../application/unplanned-validation";
import { mapType4UnplannedToPayload } from "../application/unplanned-mapper";

export interface UseType4UnplannedFormOptions {
  initialItems?: Type4UnplannedItem[];
  customersList?: StoreOption[];
}

export function useType4UnplannedForm({
  initialItems,
  customersList = [],
}: UseType4UnplannedFormOptions = {}) {
  const createDefaultItem = useCallback(
    (id = "1"): Type4UnplannedItem => ({
      id,
      customerName: "",
      collectType: "COLLECT",
      targetAmount: 0,
      receivedAmount: 0,
      billingStatus: "",
      billingDetail: "",
      collectDetail: "",
      notes: "",
      images: [],
    }),
    [],
  );

  const [items, setItems] = useState<Type4UnplannedItem[]>(() => {
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
    (id: string, field: keyof Type4UnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const updated: Type4UnplannedItem = { ...it, [field]: val };

          if (field === "storeId" && val) {
            const foundStore = customersList.find((c) => c.id === val);
            if (foundStore) {
              updated.customerName = foundStore.name;
            }
          }

          return updated;
        }),
      );
    },
    [customersList],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const validate = useCallback((): Type4UnplannedValidationResult => {
    return validateType4UnplannedForm(items, customersList);
  }, [items, customersList]);

  const resetForm = useCallback(() => {
    setItems([createDefaultItem()]);
  }, [createDefaultItem]);

  const mapPayload = useCallback(() => {
    return mapType4UnplannedToPayload(items, customersList);
  }, [items, customersList]);

  const totalTargetAmount = items
    .filter((it) => it.collectType !== "BILLING")
    .reduce((sum, it) => sum + (Number(it.targetAmount) || 0), 0);

  const totalReceivedAmount = items
    .filter((it) => it.collectType !== "BILLING")
    .reduce((sum, it) => sum + (Number(it.receivedAmount) || 0), 0);

  const totalRemainingAmount = Math.max(
    0,
    totalTargetAmount - totalReceivedAmount,
  );

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    validate,
    resetForm,
    mapPayload,
    totalTargetAmount,
    totalReceivedAmount,
    totalRemainingAmount,
  };
}
