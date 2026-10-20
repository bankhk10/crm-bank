import { useState, useCallback } from "react";
import type {
  Type4CollectItem,
  Type4ValidationResult,
} from "../types/planned.types";
import type { StoreOption } from "../../shared/types";
import { validateType4FormItems } from "../application/planned-validation";
import { mapType4FormToPayload } from "../application/planned-mapper";

export interface UseType4FormOptions {
  initialItems?: Type4CollectItem[];
  customersList?: StoreOption[];
  selectedWorkTypes?: string[];
}

export interface UseType4FormResult {
  type4Items: Type4CollectItem[];
  setType4Items: React.Dispatch<React.SetStateAction<Type4CollectItem[]>>;
  addType4Row: () => void;
  updateType4Row: (
    id: string,
    field: keyof Type4CollectItem,
    val: any,
  ) => void;
  deleteType4Row: (id: string) => void;
  resetType4Form: () => void;
  validateType4: () => Type4ValidationResult;
  mapType4Payload: (
    custs?: StoreOption[],
  ) => ReturnType<typeof mapType4FormToPayload>;
  totalAllAmount: number;
  totalCollectAmount: number;
  totalBillingAmount: number;
}

export function useType4Form({
  initialItems,
  customersList = [],
  selectedWorkTypes = [],
}: UseType4FormOptions = {}): UseType4FormResult {
  const createDefaultItem = useCallback(
    (id = "1"): Type4CollectItem => ({
      id,
      collectType: "COLLECT",
      customerName: "",
      collectAmount: 0,
      detail: "",
      invoiceNo: "",
    }),
    [],
  );

  const [type4Items, setType4Items] = useState<Type4CollectItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createDefaultItem()];
  });

  const addType4Row = useCallback(() => {
    const newId = Date.now().toString();
    setType4Items((prev) => [...prev, createDefaultItem(newId)]);
  }, [createDefaultItem]);

  const updateType4Row = useCallback(
    (id: string, field: keyof Type4CollectItem, val: any) => {
      setType4Items((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated: Type4CollectItem = { ...item, [field]: val };

          // If store is selected by storeId, auto-fill customerName
          if (field === "storeId") {
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

  const deleteType4Row = useCallback((id: string) => {
    setType4Items((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.length > 0
        ? filtered
        : [
            {
              id: Date.now().toString(),
              collectType: "COLLECT",
              customerName: "",
              collectAmount: 0,
              detail: "",
              invoiceNo: "",
            },
          ];
    });
  }, []);

  const resetType4Form = useCallback(() => {
    setType4Items([createDefaultItem()]);
  }, [createDefaultItem]);

  const validateType4 = useCallback(() => {
    return validateType4FormItems({
      items: type4Items,
      customersList,
      selectedWorkTypes,
    });
  }, [type4Items, customersList, selectedWorkTypes]);

  const mapType4Payload = useCallback(
    (custs: StoreOption[] = customersList) => {
      return mapType4FormToPayload(type4Items, custs);
    },
    [type4Items, customersList],
  );

  const totalAllAmount = type4Items.reduce(
    (sum, item) => sum + (Number(item.collectAmount) || 0),
    0,
  );

  const totalCollectAmount = type4Items
    .filter((item) => item.collectType !== "BILLING")
    .reduce((sum, item) => sum + (Number(item.collectAmount) || 0), 0);

  const totalBillingAmount = type4Items
    .filter((item) => item.collectType === "BILLING")
    .reduce((sum, item) => sum + (Number(item.collectAmount) || 0), 0);

  return {
    type4Items,
    setType4Items,
    addType4Row,
    updateType4Row,
    deleteType4Row,
    resetType4Form,
    validateType4,
    mapType4Payload,
    totalAllAmount,
    totalCollectAmount,
    totalBillingAmount,
  };
}
