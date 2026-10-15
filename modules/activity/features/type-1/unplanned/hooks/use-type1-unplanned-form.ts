import { useState, useCallback } from "react";
import type { Type1UnplannedItem } from "../types/unplanned.types";
import {
  validateType1UnplannedItem,
  type UnplannedValidationResult,
} from "../application/unplanned-validation";

export interface UseType1UnplannedFormOptions {
  initialItems?: Type1UnplannedItem[];
  defaultProvince?: string;
}

export function useType1UnplannedForm({
  initialItems,
  defaultProvince = "",
}: UseType1UnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type1UnplannedItem[]>(() => {
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
        detail: "",
        discussionResult: "",
        productAdvice: "",
        advisedProducts: [],
        salesOpportunity: "",
        nextMeetingDate: "",
        farmerHomeAddress: "",
        plotLatitude: "",
        plotLongitude: "",
        plotImages: [],
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
        topic: "แจ้งข่าวสาร",
        detail: "",
        discussionResult: "",
        productAdvice: "",
        advisedProducts: [],
        salesOpportunity: "",
        nextMeetingDate: "",
        farmerHomeAddress: "",
        plotLatitude: "",
        plotLongitude: "",
        plotImages: [],
      },
    ]);
  }, [defaultProvince]);

  const updateItem = useCallback(
    (id: string, field: keyof Type1UnplannedItem, val: any) => {
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

  const validate = useCallback(
    (customersList: Array<{ id: string; name: string }> = []): UnplannedValidationResult => {
      for (const item of items) {
        const res = validateType1UnplannedItem({ item, customersList });
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
