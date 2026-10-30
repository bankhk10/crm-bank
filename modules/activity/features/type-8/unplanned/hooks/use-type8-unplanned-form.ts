"use client";

import { useState } from "react";
import type {
  Type8UnplannedItem,
  Type8UnplannedValidationResult,
} from "../types/unplanned.types";
import type { Type8PromotionalProductLine } from "../../shared/types";
import { validateType8UnplannedItems } from "../application/unplanned-validation";
import { mapType8UnplannedToPayload } from "../application/unplanned-mapper";

export interface UseType8UnplannedFormOptions {
  initialItems?: Type8UnplannedItem[];
}

const defaultItem: Type8UnplannedItem = {
  id: "1",
  topic: "",
  meetingTarget: "FARMER",
  farmerChannel: "DEALER",
  customerId: null,
  customerName: null,
  subdealerId: null,
  subdealerName: null,
  isNewSubdealer: false,
  venueType: "OTHER",
  location: "",
  meetingDate: "",
  meetingTime: "",
  expectedAttendees: "",
  actualAttendees: "",
  promotions: [],
  productSalesDetails: [],
  feedbackQnA: "",
  notes: "",
  registrationImages: [],
  images: [],
};

export function useType8UnplannedForm(options: UseType8UnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type8UnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems;
    }
    return [{ ...defaultItem, id: Date.now().toString() }];
  });

  const addItem = () => {
    const newItem: Type8UnplannedItem = {
      ...defaultItem,
      id: Date.now().toString(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (
    id: string,
    field: keyof Type8UnplannedItem | string,
    val: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [{ ...defaultItem, id: Date.now().toString() }];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const addPromotion = (itemId: string) => {
    const newPromo: Type8PromotionalProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      notes: "",
    };
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          promotions: [...(item.promotions || []), newPromo],
        };
      }),
    );
  };

  const updatePromotion = (
    itemId: string,
    promoId: string,
    field: keyof Type8PromotionalProductLine,
    val: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.promotions || []).map((p) =>
          p.id === promoId ? { ...p, [field]: val } : p,
        );
        return { ...item, promotions: updated };
      }),
    );
  };

  const deletePromotion = (itemId: string, promoId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.promotions || []).filter((p) => p.id !== promoId);
        return { ...item, promotions: updated };
      }),
    );
  };

  const validate = (): Type8UnplannedValidationResult => {
    return validateType8UnplannedItems(items);
  };

  const mapPayload = () => {
    return mapType8UnplannedToPayload(items);
  };

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    addPromotion,
    updatePromotion,
    deletePromotion,
    validate,
    mapPayload,
  };
}
