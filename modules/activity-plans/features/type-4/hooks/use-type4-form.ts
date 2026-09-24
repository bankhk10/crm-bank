import { useState } from "react";
import { isFieldDayItem } from "@/modules/activity-plans/constants";
import type { Type4CollectItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType4FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
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
  validateType4: () => { isValid: boolean; error?: string };
  mapType4Payload: (customers: any[]) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName?: string | null;
      targetAmount?: number | null;
      remarks?: string | null;
      notes?: string | null;
    }>;
  };
}

export function useType4Form({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType4FormOptions): UseType4FormResult {
  const [type4Items, setType4Items] = useState<Type4CollectItem[]>(() => {
    if (
      initDetails?.type4Items &&
      Array.isArray(initDetails.type4Items) &&
      initDetails.type4Items.length > 0
    ) {
      return initDetails.type4Items;
    }
    const type4Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_4",
    );
    if (type4Stores && type4Stores.length > 0) {
      return type4Stores.map((s: any, idx: number) => ({
        id: s.id || String(idx + 1),
        collectType:
          s.remarks === "BILLING" || s.remarks === "วางบิล"
            ? "BILLING"
            : "COLLECT",
        storeId: s.storeId,
        customerName: s.store?.name || s.storeName || "",
        collectAmount: s.targetAmount != null ? Number(s.targetAmount) : 0,
        detail: s.notes || "",
      }));
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_4" ||
            (item.collectAmount != null && !item.visitTopic)),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          collectType:
            item.collectType === "BILLING" ||
            item.collectType === "วางบิล" ||
            item.remarks === "BILLING" ||
            item.remarks === "วางบิล"
              ? "BILLING"
              : "COLLECT",
          storeId: item.storeId,
          customerName: item.customerName || "",
          collectAmount: item.collectAmount ? Number(item.collectAmount) : 0,
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        collectType: "COLLECT",
        customerName: "",
        collectAmount: 0,
        detail: "",
      },
    ];
  });

  const addType4Row = () => {
    setType4Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        collectType: "COLLECT",
        customerName: "",
        collectAmount: 0,
        detail: "",
      },
    ]);
  };

  const updateType4Row = (
    id: string,
    field: keyof Type4CollectItem,
    val: any,
  ) => {
    setType4Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType4Row = (id: string) => {
    setType4Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType4 = () => {
    return { isValid: true };
  };

  const mapType4Payload = (customers: any[]) => {
    if (!selectedWorkTypes.includes("วางบิล / เก็บเงิน")) {
      return { planStores: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName?: string | null;
      targetAmount?: number | null;
      remarks?: string | null;
      notes?: string | null;
    }> = [];

    type4Items.forEach((item) => {
      const sId =
        item.storeId ||
        customers.find((c) => c.name === item.customerName)?.id;
      if (sId) {
        planStores.push({
          workTypeCode: "TYPE_4",
          storeId: sId,
          storeName: item.customerName || null,
          targetAmount:
            item.collectAmount != null ? Number(item.collectAmount) : null,
          remarks: item.collectType === "BILLING" ? "BILLING" : "COLLECT",
          notes: item.detail || null,
        });
      }
    });

    return { planStores };
  };

  return {
    type4Items,
    setType4Items,
    addType4Row,
    updateType4Row,
    deleteType4Row,
    validateType4,
    mapType4Payload,
  };
}
