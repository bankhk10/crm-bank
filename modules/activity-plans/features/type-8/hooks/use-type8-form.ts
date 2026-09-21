import { useState } from "react";
import { isFieldDayItem } from "@/modules/activity-plans/constants";
import type { Type8MeetingItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType8FormOptions {
  initial?: any;
  initDetails?: any;
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType8FormResult {
  type8Items: Type8MeetingItem[];
  setType8Items: React.Dispatch<React.SetStateAction<Type8MeetingItem[]>>;
  addType8Row: () => void;
  updateType8Row: (
    id: string,
    field: keyof Type8MeetingItem,
    val: any,
  ) => void;
  deleteType8Row: (id: string) => void;
  validateType8: () => { isValid: boolean; error?: string };
  mapType8Payload: (products: any[]) => {
    targetAttendees: number;
    planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      isPriceOverridden: boolean;
    }>;
  };
}

export function useType8Form({
  initial = {},
  initDetails,
  productsList = [],
  selectedWorkTypes = [],
}: UseType8FormOptions): UseType8FormResult {
  const [type8Items, setType8Items] = useState<Type8MeetingItem[]>(() => {
    if (
      initDetails?.type8Items &&
      Array.isArray(initDetails.type8Items) &&
      initDetails.type8Items.length > 0
    ) {
      return initDetails.type8Items;
    }
    const type8Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_8",
    );
    if (type8Prods && type8Prods.length > 0) {
      return [
        {
          id: "1",
          topic: "",
          targetProducts: type8Prods.map(
            (p: any) => p.product?.name || p.productName || "",
          ),
          targetProductIds: type8Prods
            .map((p: any) => p.productId)
            .filter(Boolean),
          attendeesCount:
            (initial as any)?.targetAttendeesCount != null
              ? Number((initial as any).targetAttendeesCount)
              : 1,
          detail: "",
        },
      ];
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_8" ||
            item.meetingTopic ||
            item.meetingAttendeesCount != null),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          topic: item.meetingTopic || item.topic || "",
          targetProducts: Array.isArray(item.meetingTargetProducts)
            ? item.meetingTargetProducts
            : item.meetingTargetProducts
              ? [String(item.meetingTargetProducts).trim()]
              : [],
          attendeesCount:
            item.meetingAttendeesCount ?? item.attendeesCount ?? 1,
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        topic: "",
        targetProducts: [],
        attendeesCount: 1,
        detail: "",
      },
    ];
  });

  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        topic: "",
        targetProducts: [],
        attendeesCount: 1,
        detail: "",
      },
    ]);
  };

  const updateType8Row = (
    id: string,
    field: keyof Type8MeetingItem,
    val: any,
  ) => {
    setType8Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType8Row = (id: string) => {
    setType8Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType8 = (): { isValid: boolean; error?: string } => {
    return { isValid: true };
  };

  const mapType8Payload = (products: any[]) => {
    if (
      !selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")
    ) {
      return { targetAttendees: 0, planProducts: [] };
    }

    let targetAttendees = 0;
    const planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      isPriceOverridden: boolean;
    }> = [];

    type8Items.forEach((item) => {
      if (item.attendeesCount != null && Number(item.attendeesCount) > 0) {
        targetAttendees += Number(item.attendeesCount);
      }
      const pNames = Array.isArray(item.targetProducts)
        ? item.targetProducts
        : item.targetProducts
          ? [item.targetProducts]
          : [];
      const pIds =
        Array.isArray(item.targetProductIds) &&
        item.targetProductIds.length > 0
          ? item.targetProductIds
          : pNames
              .map((name) => products.find((p) => p.name === name)?.id)
              .filter(Boolean);

      pIds.forEach((pId, idx) => {
        const matchedP = products.find((p) => p.id === pId);
        planProducts.push({
          workTypeCode: "TYPE_8",
          productId: pId as string,
          productName: matchedP?.name || pNames[idx] || null,
          isPriceOverridden: false,
        });
      });
    });

    return { targetAttendees, planProducts };
  };

  return {
    type8Items,
    setType8Items,
    addType8Row,
    updateType8Row,
    deleteType8Row,
    validateType8,
    mapType8Payload,
  };
}
