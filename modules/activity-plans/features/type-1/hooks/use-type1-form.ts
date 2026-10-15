import { useState } from "react";
import type { Type1VisitItem, CustomerOption, Type1PlanStoreRecord } from "../types";
import { validateType1FormItem } from "../application/validation";
import {
  mapType1FormToPlanStore,
  mapType1DbStoreToFormItem,
  parseTargetText,
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
    const t1Results: any[] = (initial as any)?.type1Results || [];
    const t1Actual = t1Results[0] || (initial as any)?.type1Result || null;
    const t1Products = (initial as any)?.type1Products || [];

    const attachActualToItem = (
      item: Type1VisitItem,
      idx: number,
      totalCount: number,
      targetCoordIndex: number = 0,
    ): Type1VisitItem => {
      const targetActual =
        t1Results.find((r: any) => r.planStoreId === item.id) ||
        (idx === 0 ? t1Actual : null);

      if (!targetActual && !t1Actual) return item;
      const act = targetActual || t1Actual;
      const actualLat = act?.plotLatitude ?? null;
      const actualLng = act?.plotLongitude ?? null;

      const name = item.isUnregisteredFarmer
        ? item.unregisteredFarmerName || item.customerName || `เป้าหมายที่ ${idx + 1}`
        : item.customerName || `เป้าหมายที่ ${idx + 1}`;
      const isSingle = totalCount === 1 || Boolean(targetActual);
      const isTargetForCoordinates = isSingle || idx === targetCoordIndex;

      const parsedDiscussion = targetActual?.discussionResult || parseTargetText(
        act.discussionResult,
        name,
        isSingle
          ? act.discussionResult || ""
          : idx === 0 && !act.discussionResult?.includes(":")
            ? act.discussionResult || ""
            : "",
      );

      const parsedNextAction = parseTargetText(
        t1Actual.nextAction,
        name,
        isSingle
          ? t1Actual.nextAction || ""
          : idx === 0 && !t1Actual.nextAction?.includes(":")
            ? t1Actual.nextAction || ""
            : "",
      );

      const parsedAddress = parseTargetText(
        t1Actual.farmerHomeAddress,
        name,
        isSingle
          ? t1Actual.farmerHomeAddress || ""
          : idx === 0 && !t1Actual.farmerHomeAddress?.includes(":")
            ? t1Actual.farmerHomeAddress || ""
            : "",
      );

      const parsedAdvice =
        parseTargetText(t1Actual.productAdvice, name, "") ||
        (isSingle ? t1Actual.productAdvice || "" : "");

      const parsedSalesOpp =
        (parseTargetText(t1Actual.salesOpportunity, name, "") as
          | "สูง"
          | "ต่ำ"
          | "") ||
        (isSingle ? (t1Actual.salesOpportunity as any) || "" : "");

      const parsedMeetingDate =
        parseTargetText(t1Actual.nextMeetingDate, name, "") ||
        (isSingle ? t1Actual.nextMeetingDate || "" : "");

      const matchedProducts = t1Products
        .filter(
          (p: any) =>
            !p.targetId || p.targetId === item.id || isSingle,
        )
        .map((p: any) => ({
          id: p.id,
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          productCode: p.productCode || p.product?.productCode || null,
          targetId: item.id,
        }));

      return {
        ...item,
        discussionResult: item.discussionResult || parsedDiscussion,
        productAdvice: item.productAdvice || parsedAdvice,
        advisedProducts:
          item.advisedProducts && item.advisedProducts.length > 0
            ? item.advisedProducts
            : matchedProducts,
        salesOpportunity: item.salesOpportunity || parsedSalesOpp,
        nextAction: item.nextAction || parsedNextAction,
        nextMeetingDate: item.nextMeetingDate || parsedMeetingDate,
        farmerHomeAddress: item.farmerHomeAddress || parsedAddress,
        plotLatitude:
          item.plotLatitude ||
          (isTargetForCoordinates && actualLat != null && String(actualLat).trim() !== ""
            ? String(actualLat)
            : ""),
        plotLongitude:
          item.plotLongitude ||
          (isTargetForCoordinates && actualLng != null && String(actualLng).trim() !== ""
            ? String(actualLng)
            : ""),
        plotImages:
          item.plotImages && item.plotImages.length > 0
            ? item.plotImages
            : isTargetForCoordinates && t1Actual.plotImages
              ? t1Actual.plotImages
              : [],
      };
    };

    const getTargetCoordIndex = (itemList: Type1VisitItem[]) => {
      const existingCoordIdx = itemList.findIndex(
        (it) => it.plotLatitude && it.plotLongitude,
      );
      if (existingCoordIdx >= 0) return existingCoordIdx;

      const farmerIdx = itemList.findIndex(
        (it) => it.visitPurpose === "FARMER" || it.isUnregisteredFarmer,
      );
      if (farmerIdx >= 0) return farmerIdx;

      return 0;
    };

    if (
      initDetails?.type1Items &&
      Array.isArray(initDetails.type1Items) &&
      initDetails.type1Items.length > 0
    ) {
      const items = initDetails.type1Items.map((item: any) => ({
        ...item,
        visitPurpose: item.visitPurpose || "FARMER",
      }));
      const coordIdx = getTargetCoordIndex(items);
      return items.map((it: Type1VisitItem, idx: number) =>
        attachActualToItem(it, idx, items.length, coordIdx),
      );
    }

    const type1Stores = (initial as any)?.type1Stores;

    if (type1Stores && type1Stores.length > 0) {
      const mapped = type1Stores.map((s: any, idx: number) =>
        mapType1DbStoreToFormItem(s, idx),
      );
      const coordIdx = getTargetCoordIndex(mapped);
      return mapped.map((it: Type1VisitItem, idx: number) =>
        attachActualToItem(it, idx, mapped.length, coordIdx),
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
        const mapped = items.map((item: any, idx: number) => ({
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
        const coordIdx = getTargetCoordIndex(mapped);
        return mapped.map((it: Type1VisitItem, idx: number) =>
          attachActualToItem(it, idx, mapped.length, coordIdx),
        );
      }
    }
    return [
      attachActualToItem(
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
        0,
        1,
        0,
      ),
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
          if (item.visitPurpose === "FARMER") {
            updated.storeId = undefined;
            updated.customerName = "";
          }
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
