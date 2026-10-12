import { useState } from "react";
import type { Type1VisitItem, CustomerOption, Type1PlanStoreRecord } from "../types";
import { validateType1FormItem } from "../application/validation";
import {
  mapType1FormToPlanStore,
  mapType1DbStoreToFormItem,
} from "../application/mapper";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";

export interface UseType1FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType1FormResult {
  type1Items: Type1VisitItem[];
  setType1Items: React.Dispatch<React.SetStateAction<Type1VisitItem[]>>;
  addType1Row: () => void;
  updateType1Row: (id: string, field: keyof Type1VisitItem, val: any) => void;
  deleteType1Row: (id: string) => void;
  validateType1: () => { isValid: boolean; error?: string };
  mapType1Payload: (customers: any[]) => {
    planStores: Type1PlanStoreRecord[];
  };
}

export function useType1Form({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType1FormOptions): UseType1FormResult {
  const [type1Items, setType1Items] = useState<Type1VisitItem[]>(() => {
    if (
      initDetails?.type1Items &&
      Array.isArray(initDetails.type1Items) &&
      initDetails.type1Items.length > 0
    ) {
      return initDetails.type1Items.map((item: any) => ({
        ...item,
        visitPurpose: item.visitPurpose || "FARMER",
      }));
    }
    const type1Stores = (initial as any)?.stores?.filter(
      (s: any) => getWorkTypeCode(s.workTypeCode) === "TYPE_1",
    );
    if (type1Stores && type1Stores.length > 0) {
      return type1Stores.map((s: any, idx: number) =>
        mapType1DbStoreToFormItem(s, idx),
      );
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.visitTopic ||
            item.itemType === "TYPE_1" ||
            getWorkTypeCode(item.itemType) === "TYPE_1"),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          visitPurpose: item.visitPurpose || "FARMER",
          storeId: item.storeId,
          customerName:
            item.customerName || item.storeName || item.ownerName || "",
          topic: item.visitTopic || item.topic || "แจ้งข่าวสาร",
          detail: item.detail || "",
          province: item.province || "",
          isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
          unregisteredFarmerName: item.unregisteredFarmerName || "",
          unregisteredFarmerPhone: item.unregisteredFarmerPhone || "",
        }));
      }
    }
    return [
      {
        id: "1",
        visitPurpose: "FARMER",
        customerName: "",
        topic: "แจ้งข่าวสาร",
        detail: "",
        province: "",
        isUnregisteredFarmer: false,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
      },
    ];
  });

  const addType1Row = () => {
    const newItem: Type1VisitItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      visitPurpose: "FARMER",
      customerName: "",
      topic: "แจ้งข่าวสาร",
      detail: "",
      province: "",
      isUnregisteredFarmer: false,
      unregisteredFarmerName: "",
      unregisteredFarmerPhone: "",
    };
    setType1Items((prev) => [...prev, newItem]);
  };

  const updateType1Row = (
    id: string,
    field: keyof Type1VisitItem,
    val: any,
  ) => {
    setType1Items((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "visitPurpose") {
          if (val === "STORE") {
            updated.province = "";
            updated.storeId = undefined;
            updated.customerName = "";
            updated.isUnregisteredFarmer = false;
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          } else if (val === "FARMER") {
            updated.storeId = undefined;
            updated.customerName = "";
          }
        }
        if (field === "isUnregisteredFarmer") {
          if (val === true) {
            updated.storeId = undefined;
            updated.customerName = "";
          } else {
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          }
        }
        if (field === "province") {
          updated.storeId = undefined;
          updated.customerName = "";
        }
        return updated;
      }),
    );
  };

  const deleteType1Row = (id: string) => {
    setType1Items((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const validateType1 = () => {
    if (type1Items.length === 0) {
      return { isValid: false, error: "กรุณาระบุเป้าหมายการเข้าพบอย่างน้อย 1 รายการ" };
    }
    for (let i = 0; i < type1Items.length; i++) {
      const res = validateType1FormItem({
        item: type1Items[i],
        customersList,
        selectedWorkTypes,
      });
      if (!res.isValid) {
        return {
          isValid: false,
          error: `เป้าหมายที่ ${i + 1}: ${res.error}`,
        };
      }
    }
    return { isValid: true };
  };

  const mapType1Payload = (customers: CustomerOption[] = customersList) => {
    const isSelected = selectedWorkTypes.some(
      (wt) =>
        getWorkTypeCode(wt) === "TYPE_1" ||
        wt === "เข้าพบเกษตรกร" ||
        wt === "เข้าพบร้านค้า / Key Farmer",
    );

    if (!isSelected || type1Items.length === 0) return { planStores: [] };

    const mappedStores = type1Items
      .map((item) => mapType1FormToPlanStore(item, customers))
      .filter(Boolean) as Type1PlanStoreRecord[];

    return { planStores: mappedStores };
  };

  return {
    type1Items,
    setType1Items,
    addType1Row,
    updateType1Row,
    deleteType1Row,
    validateType1,
    mapType1Payload,
  };
}
