import { useState } from "react";
import type {
  Type7bUnplannedItem,
  Type7bUnplannedValidationResult,
} from "../types/unplanned.types";
import type { Type7bWithdrawnProductLine } from "../../shared/types";
import { validateType7bUnplannedItems } from "../application/unplanned-validation";
import { mapType7bUnplannedToPayload } from "../application/unplanned-mapper";

export interface UseType7bUnplannedFormOptions {
  initialItems?: Type7bUnplannedItem[];
}

const defaultItem: Type7bUnplannedItem = {
  id: "1",
  demoPlotId: null,
  plotName: "",
  farmerName: "",
  province: "",
  district: "",
  cropCategory: "",
  cropName: "",
  areaRai: null,
  treeCount: null,
  dealerName: "",
  cropCondition: "สมบูรณ์",
  growthStage: "",
  productResponse: "พืชตอบสนองดี",
  cropProblemDescription: "",
  sprayMethod: "",
  sprayEquipment: "",
  nextSprayDate: "",
  notes: "",
  objective: "",
  hasProductWithdrawal: false,
  withdrawnProducts: [],
  photos: [],
  plotStatus: "IN_PROGRESS",
};

export function useType7bUnplannedForm(options: UseType7bUnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type7bUnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems;
    }
    return [{ ...defaultItem, id: Date.now().toString() }];
  });

  const addItem = () => {
    const newItem: Type7bUnplannedItem = {
      ...defaultItem,
      id: Date.now().toString(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (
    id: string,
    field: keyof Type7bUnplannedItem | string,
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

  const addWithdrawnProduct = (itemId: string) => {
    const newProd: Type7bWithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          hasProductWithdrawal: true,
          withdrawnProducts: [...(item.withdrawnProducts || []), newProd],
        };
      }),
    );
  };

  const updateWithdrawnProduct = (
    itemId: string,
    prodId: string,
    field: keyof Type7bWithdrawnProductLine,
    val: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.withdrawnProducts || []).map((p) =>
          p.id === prodId ? { ...p, [field]: val } : p,
        );
        return { ...item, withdrawnProducts: updated };
      }),
    );
  };

  const deleteWithdrawnProduct = (itemId: string, prodId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.withdrawnProducts || []).filter((p) => p.id !== prodId);
        return { ...item, withdrawnProducts: updated };
      }),
    );
  };

  const validate = (): Type7bUnplannedValidationResult => {
    return validateType7bUnplannedItems(items);
  };

  const mapPayload = () => {
    return mapType7bUnplannedToPayload(items);
  };

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    addWithdrawnProduct,
    updateWithdrawnProduct,
    deleteWithdrawnProduct,
    validate,
    mapPayload,
  };
}
