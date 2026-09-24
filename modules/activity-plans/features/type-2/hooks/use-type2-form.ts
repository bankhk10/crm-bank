import { useState } from "react";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import type { Type2ProductFollowupItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType2FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType2FormResult {
  type2Items: Type2ProductFollowupItem[];
  setType2Items: React.Dispatch<
    React.SetStateAction<Type2ProductFollowupItem[]>
  >;
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  validateType2: () => { isValid: boolean; error?: string };
  mapType2Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
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

export function useType2Form({
  initial = {},
  initDetails,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType2FormOptions): UseType2FormResult {
  const [type2Items, setType2Items] = useState<Type2ProductFollowupItem[]>(
    () => {
      if (
        initDetails?.type2Items &&
        Array.isArray(initDetails.type2Items) &&
        initDetails.type2Items.length > 0
      ) {
        return initDetails.type2Items;
      }
      const type2Prods = (initial as any)?.products?.filter(
        (p: any) => p.workTypeCode === "TYPE_2",
      );
      const type2Stores = (initial as any)?.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_2",
      );
      if (
        (type2Prods && type2Prods.length > 0) ||
        (type2Stores && type2Stores.length > 0)
      ) {
        const count = Math.max(
          type2Prods?.length || 0,
          type2Stores?.length || 0,
        );
        return Array.from({ length: count }).map((_, idx) => {
          const p = type2Prods?.[idx];
          const s =
            type2Stores?.find((st: any) => st.storeId === p?.storeId) ||
            type2Stores?.[idx];
          const inferredPurpose: "FARMER" | "STORE" =
            s?.visitPurpose === "STORE"
              ? "STORE"
              : s?.visitPurpose === "FARMER"
                ? "FARMER"
                : ["DEALER", "SUBDEALER"].includes(s?.store?.customerType)
                  ? "STORE"
                  : "FARMER";

          return {
            id: p?.id || s?.id || String(idx + 1),
            visitPurpose: inferredPurpose,
            province: s?.province || s?.store?.province || "",
            isUnregisteredFarmer: Boolean(s?.isUnregisteredFarmer),
            unregisteredFarmerName: s?.unregisteredFarmerName || "",
            unregisteredFarmerPhone: s?.unregisteredFarmerPhone || "",
            storeId: s?.storeId || p?.storeId || undefined,
            customerName: s?.isUnregisteredFarmer
              ? s?.unregisteredFarmerName || ""
              : s?.store?.name || s?.storeName || "",
            productId: p?.productId || "",
            productName:
              p?.product?.name || p?.productName || DEMO_PRODUCTS[0] || "",
            detail: s?.notes || "",
          };
        });
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const items = initDetails.filter(
          (item: any) =>
            item.itemType !== "MARKETING_PRODUCT" &&
            item.itemType !== "SALES_PROMOTION" &&
            item.visitTopic !== "MARKETING_PRODUCT" &&
            item.visitTopic !== "SALES_PROMOTION" &&
            (item.followupProductName || item.itemType === "TYPE_2"),
        );
        if (items.length > 0) {
          return items.map((item: any, idx: number) => ({
            id: item.id || String(idx + 1),
            visitPurpose: (item.visitPurpose === "STORE"
              ? "STORE"
              : "FARMER") as "FARMER" | "STORE",
            province: item.province || "",
            isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
            unregisteredFarmerName: item.unregisteredFarmerName || "",
            unregisteredFarmerPhone: item.unregisteredFarmerPhone || "",
            storeId: item.storeId,
            productId: item.productId,
            productName:
              item.followupProductName ||
              item.productName ||
              DEMO_PRODUCTS[0] ||
              "",
            customerName: item.customerName || item.ownerName || "",
            detail: item.detail || "",
          }));
        }
      }
      return [
        {
          id: "1",
          visitPurpose: "FARMER",
          province: "",
          isUnregisteredFarmer: false,
          storeId: undefined,
          customerName: "",
          unregisteredFarmerName: "",
          unregisteredFarmerPhone: "",
          productName: "",
          detail: "",
        },
      ];
    },
  );

  const addType2Row = () => {
    const newItem: Type2ProductFollowupItem = {
      id: Date.now().toString(),
      visitPurpose: "FARMER",
      province: "",
      isUnregisteredFarmer: false,
      storeId: undefined,
      customerName: "",
      unregisteredFarmerName: "",
      unregisteredFarmerPhone: "",
      productName: "",
      detail: "",
    };
    setType2Items((prev) => [...prev, newItem]);
  };

  const updateType2Row = (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => {
    setType2Items((prev) =>
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

  const deleteType2Row = (id: string) => {
    setType2Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType2 = () => {
    if (!selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      return { isValid: true };
    }

    if (type2Items.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการติดตามผลการใช้สินค้าอย่างน้อย 1 รายการ",
      };
    }

    for (let i = 0; i < type2Items.length; i++) {
      const item = type2Items[i];
      const rowNum = i + 1;

      if (!item.productName?.trim() && !item.productId?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้าที่ต้องการติดตามผล (รายการที่ ${rowNum})`,
        };
      }

      const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
      if (purpose === "STORE") {
        const sId =
          item.storeId ||
          customersList.find((c) => c.name === item.customerName)?.id;
        if (!sId) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้าสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
          };
        }
      } else {
        // purpose === "FARMER"
        if (!item.province?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร (รายการที่ ${rowNum})`,
          };
        }
        if (item.isUnregisteredFarmer) {
          if (!item.unregisteredFarmerName?.trim()) {
            return {
              isValid: false,
              error: `กรุณากรอกชื่อ - สกุล เกษตรกร (รายการที่ ${rowNum})`,
            };
          }
          if (!item.unregisteredFarmerPhone?.trim()) {
            return {
              isValid: false,
              error: `กรุณากรอกเบอร์โทรศัพท์เกษตรกร (รายการที่ ${rowNum})`,
            };
          }
          const cleanedPhone = item.unregisteredFarmerPhone.replace(
            /[-\s]/g,
            "",
          );
          if (!/^\d{9,10}$/.test(cleanedPhone)) {
            return {
              isValid: false,
              error: `เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (รายการที่ ${rowNum})`,
            };
          }
        } else {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (!sId) {
            return {
              isValid: false,
              error: `กรุณาเลือกเกษตรกรสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
            };
          }
        }
      }
    }
    return { isValid: true };
  };

  const mapType2Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      isPriceOverridden?: boolean;
    }> = [];

    type2Items.forEach((item) => {
      const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
      const pId =
        item.productId ||
        products.find((p) => p.name === item.productName)?.id;

      if (purpose === "STORE") {
        const sId =
          item.storeId ||
          customers.find((c) => c.name === item.customerName)?.id;
        if (sId) {
          planStores.push({
            workTypeCode: "TYPE_2",
            visitPurpose: "STORE",
            storeId: sId,
            storeName: item.customerName || null,
            notes: item.detail || null,
            province: null,
            isUnregisteredFarmer: false,
            unregisteredFarmerName: null,
            unregisteredFarmerPhone: null,
          });
        }
        if (pId) {
          planProducts.push({
            workTypeCode: "TYPE_2",
            storeId: sId || null,
            productId: pId,
            productName: item.productName || null,
            isPriceOverridden: false,
          });
        }
      } else {
        // FARMER
        if (item.isUnregisteredFarmer) {
          planStores.push({
            workTypeCode: "TYPE_2",
            visitPurpose: "FARMER",
            storeId: null,
            storeName: item.unregisteredFarmerName || null,
            notes: item.detail || null,
            province: item.province || null,
            isUnregisteredFarmer: true,
            unregisteredFarmerName: item.unregisteredFarmerName || null,
            unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
          });
          if (pId) {
            planProducts.push({
              workTypeCode: "TYPE_2",
              storeId: null,
              productId: pId,
              productName: item.productName || null,
              isPriceOverridden: false,
            });
          }
        } else {
          const sId =
            item.storeId ||
            customers.find((c) => c.name === item.customerName)?.id;
          if (sId) {
            planStores.push({
              workTypeCode: "TYPE_2",
              visitPurpose: "FARMER",
              storeId: sId,
              storeName: item.customerName || null,
              notes: item.detail || null,
              province: item.province || null,
              isUnregisteredFarmer: false,
              unregisteredFarmerName: null,
              unregisteredFarmerPhone: null,
            });
          }
          if (pId) {
            planProducts.push({
              workTypeCode: "TYPE_2",
              storeId: sId || null,
              productId: pId,
              productName: item.productName || null,
              isPriceOverridden: false,
            });
          }
        }
      }
    });

    return { planStores, planProducts };
  };

  return {
    type2Items,
    setType2Items,
    addType2Row,
    updateType2Row,
    deleteType2Row,
    validateType2,
    mapType2Payload,
  };
}
