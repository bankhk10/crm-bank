import { useState } from "react";
import {
  DEMO_PRODUCTS,
  isFieldDayItem,
} from "@/modules/activity-plans/constants";
import type { Type5SurveyItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType5FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType5FormResult {
  type5Items: Type5SurveyItem[];
  setType5Items: React.Dispatch<React.SetStateAction<Type5SurveyItem[]>>;
  addType5Row: () => void;
  updateType5Row: (
    id: string,
    field: keyof Type5SurveyItem,
    val: any,
  ) => void;
  deleteType5Row: (id: string) => void;
  validateType5: () => { isValid: boolean; error?: string };
  mapType5Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName?: string | null;
      notes?: string | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      isPriceOverridden?: boolean;
    }>;
  };
}

export function useType5Form({
  initial = {},
  initDetails,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType5FormOptions): UseType5FormResult {
  const [type5Items, setType5Items] = useState<Type5SurveyItem[]>(() => {
    if (
      initDetails?.type5Items &&
      Array.isArray(initDetails.type5Items) &&
      initDetails.type5Items.length > 0
    ) {
      return initDetails.type5Items;
    }
    const type5Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_5",
    );
    const type5Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_5",
    );
    if (
      (type5Stores && type5Stores.length > 0) ||
      (type5Prods && type5Prods.length > 0)
    ) {
      const count = Math.max(type5Stores?.length || 0, type5Prods?.length || 0);
      return Array.from({ length: count }).map((_, idx) => {
        const s = type5Stores?.[idx];
        const p = type5Prods?.[idx];
        return {
          id: s?.id || p?.id || String(idx + 1),
          storeId: s?.storeId || "",
          storeName: s?.store?.name || s?.storeName || "",
          productId: p?.productId || "",
          comparedProduct:
            p?.product?.name || p?.productName || DEMO_PRODUCTS[0] || "",
          detail: s?.notes || "",
        };
      });
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_5" ||
            item.surveyCompetitorProduct ||
            item.surveyStoreName),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          storeId: item.storeId,
          productId: item.productId,
          storeName: item.surveyStoreName || item.storeName || "",
          comparedProduct:
            item.surveyCompetitorProduct || DEMO_PRODUCTS[0] || "",
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        storeName: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        detail: "",
      },
    ];
  });

  const addType5Row = () => {
    setType5Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        storeName: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        detail: "",
      },
    ]);
  };

  const updateType5Row = (
    id: string,
    field: keyof Type5SurveyItem,
    val: any,
  ) => {
    setType5Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType5Row = (id: string) => {
    setType5Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType5 = () => {
    return { isValid: true };
  };

  const mapType5Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName?: string | null;
      notes?: string | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      isPriceOverridden?: boolean;
    }> = [];

    type5Items.forEach((item) => {
      const sId =
        item.storeId ||
        customers.find((c) => c.name === item.storeName)?.id;
      const pId =
        item.productId ||
        products.find((p) => p.name === item.comparedProduct)?.id;

      if (sId) {
        planStores.push({
          workTypeCode: "TYPE_5",
          storeId: sId,
          storeName: item.storeName || null,
          notes: item.detail || null,
        });
      }
      if (pId) {
        planProducts.push({
          workTypeCode: "TYPE_5",
          storeId: sId || null,
          productId: pId,
          productName: item.comparedProduct || null,
          isPriceOverridden: false,
        });
      }
    });

    return { planStores, planProducts };
  };

  return {
    type5Items,
    setType5Items,
    addType5Row,
    updateType5Row,
    deleteType5Row,
    validateType5,
    mapType5Payload,
  };
}
