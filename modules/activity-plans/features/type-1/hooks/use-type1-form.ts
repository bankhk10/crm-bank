import { useState } from "react";
import type { Type1VisitItem } from "@/modules/activity-plans/features/shared/form/types";

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
    planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      remarks?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
    }>;
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
      return initDetails.type1Items.slice(0, 1).map((item: any) => ({
        ...item,
        visitPurpose: item.visitPurpose || "FARMER",
      }));
    }
    const type1Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_1",
    );
    if (type1Stores && type1Stores.length > 0) {
      return type1Stores.slice(0, 1).map((s: any, idx: number) => {
        const rawPurpose = s.visitPurpose;
        const inferredPurpose: "FARMER" | "STORE" = rawPurpose
          ? (rawPurpose as "FARMER" | "STORE")
          : s.isUnregisteredFarmer || s.store?.customerType === "FARMER"
            ? "FARMER"
            : ["DEALER", "SUBDEALER"].includes(s.store?.customerType)
              ? "STORE"
              : "FARMER";

        return {
          id: s.id || String(idx + 1),
          visitPurpose: inferredPurpose,
          storeId: s.storeId || undefined,
          customerName: s.isUnregisteredFarmer
            ? s.unregisteredFarmerName || ""
            : s.store?.name || s.storeName || "",
          topic: s.remarks || "แจ้งข่าวสาร",
          detail: s.notes || "",
          province: s.province || s.store?.province || "",
          isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
          unregisteredFarmerName: s.unregisteredFarmerName || "",
          unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
        };
      });
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.visitTopic || item.itemType === "TYPE_1"),
      );
      if (items.length > 0) {
        return items.slice(0, 1).map((item: any, idx: number) => ({
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
    // 1 Plan : 1 Target (maximum 1 item)
    if (type1Items.length === 0) {
      const newItem: Type1VisitItem = {
        id: Date.now().toString(),
        visitPurpose: "FARMER",
        customerName: "",
        topic: "แจ้งข่าวสาร",
        detail: "",
        province: "",
        isUnregisteredFarmer: false,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
      };
      setType1Items([newItem]);
    }
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
    setType1Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType1 = () => {
    const isSelected =
      selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
      selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer");

    if (!isSelected) return { isValid: true };

    const item = type1Items[0];
    const purpose = item?.visitPurpose === "STORE" ? "STORE" : "FARMER";

    if (purpose === "STORE") {
      const sId =
        item?.storeId ||
        customersList.find((c) => c.name === item?.customerName)?.id;
      if (!sId) {
        return { isValid: false, error: "กรุณาเลือกร้านค้า" };
      }
    } else {
      // purpose === "FARMER"
      if (!item || !item.province?.trim()) {
        return { isValid: false, error: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร" };
      }
      if (item.isUnregisteredFarmer) {
        if (!item.unregisteredFarmerName?.trim()) {
          return { isValid: false, error: "กรุณากรอกชื่อ - สกุล เกษตรกร" };
        }
        if (item.unregisteredFarmerPhone?.trim()) {
          const cleanedPhone = item.unregisteredFarmerPhone.replace(
            /[-\s]/g,
            "",
          );
          if (!/^\d{9,10}$/.test(cleanedPhone)) {
            return {
              isValid: false,
              error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก",
            };
          }
        }
      } else {
        const sId =
          item.storeId ||
          customersList.find((c) => c.name === item.customerName)?.id;
        if (!sId) {
          return { isValid: false, error: "กรุณาเลือกเกษตรกร" };
        }
      }
    }
    return { isValid: true };
  };

  const mapType1Payload = (customers: any[]) => {
    const isSelected =
      selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
      selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer");

    if (!isSelected) return { planStores: [] };

    const item = type1Items[0];
    if (!item) return { planStores: [] };

    const planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      remarks?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
    }> = [];

    const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
    if (purpose === "STORE") {
      const sId =
        item.storeId ||
        customers.find((c) => c.name === item.customerName)?.id;
      if (sId) {
        planStores.push({
          workTypeCode: "TYPE_1",
          visitPurpose: "STORE",
          storeId: sId,
          storeName: item.customerName || null,
          remarks: item.topic || null,
          notes: item.detail || null,
          province: null,
          isUnregisteredFarmer: false,
          unregisteredFarmerName: null,
          unregisteredFarmerPhone: null,
        });
      }
    } else {
      // FARMER
      if (item.isUnregisteredFarmer) {
        planStores.push({
          workTypeCode: "TYPE_1",
          visitPurpose: "FARMER",
          storeId: null,
          storeName: item.unregisteredFarmerName || null,
          remarks: item.topic || null,
          notes: item.detail || null,
          province: item.province || null,
          isUnregisteredFarmer: true,
          unregisteredFarmerName: item.unregisteredFarmerName || null,
          unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
        });
      } else {
        const sId =
          item.storeId ||
          customers.find((c) => c.name === item.customerName)?.id;
        if (sId) {
          planStores.push({
            workTypeCode: "TYPE_1",
            visitPurpose: "FARMER",
            storeId: sId,
            storeName: item.customerName || null,
            remarks: item.topic || null,
            notes: item.detail || null,
            province: item.province || null,
            isUnregisteredFarmer: false,
            unregisteredFarmerName: null,
            unregisteredFarmerPhone: null,
          });
        }
      }
    }

    return { planStores };
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
