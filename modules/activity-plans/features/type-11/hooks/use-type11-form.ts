import { useState } from "react";
import type { Type11StoreItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType11FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType11FormResult {
  type11Stores: Type11StoreItem[];
  setType11Stores: React.Dispatch<React.SetStateAction<Type11StoreItem[]>>;
  validateType11: () => { isValid: boolean; error?: string };
  mapType11Payload: (customers: any[]) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      notes: string;
    }>;
  };
}

export function useType11Form({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType11FormOptions): UseType11FormResult {
  const [type11Stores, setType11Stores] = useState<Type11StoreItem[]>(() => {
    if (Array.isArray(initDetails?.type11Stores))
      return initDetails.type11Stores;
    const type11FromStores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_11",
    );
    if (type11FromStores && type11FromStores.length > 0) {
      return type11FromStores.map((s: any) => ({
        storeId: s.storeId,
        storeName: s.store?.name || s.storeName || "",
      }));
    }
    if (Array.isArray(initDetails)) {
      const item = initDetails.find((i: any) => i.itemType === "TYPE_11");
      if (item && item.customerName) {
        const sMatch = customersList.find((c) => c.name === item.customerName);
        return [{ storeId: sMatch?.id || "", storeName: item.customerName }];
      }
    }
    return [];
  });

  const validateType11 = (): { isValid: boolean; error?: string } => {
    return { isValid: true };
  };

  const mapType11Payload = (customers: any[]) => {
    if (!selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน")) {
      return { planStores: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      notes: string;
    }> = [];

    if (Array.isArray(type11Stores)) {
      type11Stores.forEach((st) => {
        const sId =
          st.storeId ||
          customers.find((c) => c.name === st.storeName)?.id;
        if (sId) {
          planStores.push({
            workTypeCode: "TYPE_11",
            storeId: sId,
            storeName: st.storeName || null,
            notes: "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
          });
        }
      });
    }

    return { planStores };
  };

  return {
    type11Stores,
    setType11Stores,
    validateType11,
    mapType11Payload,
  };
}
