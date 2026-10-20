import { useState, useCallback } from "react";
import type {
  Type5SurveyItem,
  Type5ValidationResult,
} from "../types/planned.types";
import type { CustomerOption, ProductOption } from "../../shared/types";
import { validateType5FormItems } from "../application/planned-validation";
import { mapType5FormToPayload } from "../application/planned-mapper";

export interface UseType5PlannedFormOptions {
  initialItems?: Type5SurveyItem[];
  customersList?: CustomerOption[];
  productsList?: ProductOption[];
  selectedWorkTypes?: string[];
}

export type UseType5FormOptions = UseType5PlannedFormOptions;

export interface UseType5PlannedFormResult {
  type5Items: Type5SurveyItem[];
  setType5Items: React.Dispatch<React.SetStateAction<Type5SurveyItem[]>>;
  addType5Row: () => void;
  updateType5Row: (
    id: string,
    field: keyof Type5SurveyItem,
    val: any,
  ) => void;
  deleteType5Row: (id: string) => void;
  resetType5Form: () => void;
  validateType5: () => Type5ValidationResult;
  mapType5Payload: (
    customers?: CustomerOption[],
    products?: ProductOption[],
  ) => ReturnType<typeof mapType5FormToPayload>;
}

export type UseType5FormResult = UseType5PlannedFormResult;

export function useType5PlannedForm({
  initialItems,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType5PlannedFormOptions = {}): UseType5PlannedFormResult {
  const createDefaultItem = useCallback(
    (id = "1"): Type5SurveyItem => ({
      id,
      storeId: "",
      storeName: "",
      productId: "",
      comparedProduct: "",
      detail: "",
    }),
    [],
  );

  const [type5Items, setType5Items] = useState<Type5SurveyItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createDefaultItem()];
  });

  const addType5Row = useCallback(() => {
    const newId = Date.now().toString();
    setType5Items((prev) => [...prev, createDefaultItem(newId)]);
  }, [createDefaultItem]);

  const updateType5Row = useCallback(
    (id: string, field: keyof Type5SurveyItem, val: any) => {
      setType5Items((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated: Type5SurveyItem = { ...item, [field]: val };

          // If store is selected by storeId, auto-fill storeName
          if (field === "storeId") {
            const foundStore = customersList.find((c) => c.id === val);
            if (foundStore) {
              updated.storeName =
                foundStore.shopName || foundStore.name || "";
            }
          }

          // If product is selected by productId, auto-fill comparedProduct
          if (field === "productId") {
            const foundProd = productsList.find((p) => p.id === val);
            if (foundProd) {
              updated.comparedProduct = foundProd.name;
            }
          }

          return updated;
        }),
      );
    },
    [customersList, productsList],
  );

  const deleteType5Row = useCallback((id: string) => {
    setType5Items((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.length > 0
        ? filtered
        : [
            {
              id: Date.now().toString(),
              storeId: "",
              storeName: "",
              productId: "",
              comparedProduct: "",
              detail: "",
            },
          ];
    });
  }, []);

  const resetType5Form = useCallback(() => {
    setType5Items([createDefaultItem()]);
  }, [createDefaultItem]);

  const validateType5 = useCallback(() => {
    return validateType5FormItems({
      items: type5Items,
      customersList,
      productsList,
      selectedWorkTypes,
    });
  }, [type5Items, customersList, productsList, selectedWorkTypes]);

  const mapType5Payload = useCallback(
    (
      custs: CustomerOption[] = customersList,
      prods: ProductOption[] = productsList,
    ) => {
      return mapType5FormToPayload(type5Items, custs, prods);
    },
    [type5Items, customersList, productsList],
  );

  return {
    type5Items,
    setType5Items,
    addType5Row,
    updateType5Row,
    deleteType5Row,
    resetType5Form,
    validateType5,
    mapType5Payload,
  };
}

// Backward-compatible alias
export const useType5Form = useType5PlannedForm;
