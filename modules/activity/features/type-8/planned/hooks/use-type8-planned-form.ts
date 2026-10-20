import { useState } from "react";
import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  UseType8PlannedFormOptions,
  UseType8PlannedFormResult,
} from "../types/planned.types";
import { validateType8FormItems } from "../application/planned-validation";
import {
  encodeType8StoreNotes,
  decodeType8StoreNotes,
} from "../../shared/notes";

export type { UseType8PlannedFormOptions, UseType8PlannedFormResult };

export function useType8PlannedForm({
  initial = {},
  initDetails,
  initialItems,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType8PlannedFormOptions): UseType8PlannedFormResult {
  const [type8Items, setType8Items] = useState<Type8MeetingItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }

    if (
      initDetails?.type8Items &&
      Array.isArray(initDetails.type8Items) &&
      initDetails.type8Items.length > 0
    ) {
      return initDetails.type8Items;
    }

    // Check if initial has existing TYPE_8 records (from DB edit)
    const existingStores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_8",
    );
    const primaryStore =
      existingStores && existingStores.length > 0 ? existingStores[0] : null;

    // Separate Target Products vs Promotional Products / Items
    const allProds = (initial as any)?.products || [];
    const targetProds = allProds.filter((p: any) => p.workTypeCode === "TYPE_8");
    const promoProds = allProds.filter(
      (p: any) => p.workTypeCode === "TYPE_8_PROMOTION",
    );
    const decodedStoreNotes = decodeType8StoreNotes(primaryStore?.notes);

    if (
      primaryStore ||
      targetProds.length > 0 ||
      promoProds.length > 0 ||
      decodedStoreNotes.promotions.length > 0
    ) {
      // Find customer in Customer Master (or from primaryStore.store relation)
      const matchedCustomer =
        (customersList || []).find((c: any) => c.id === primaryStore?.storeId) ||
        primaryStore?.store;

      const isSubdealerCustomer =
        matchedCustomer?.customerType === "SUBDEALER" ||
        matchedCustomer?.customerType === "Subdealer";

      let isUnregisteredSubdealer = false;
      let subdealerId = "";
      let subDealerStore = "";
      let dealerId = "";
      let dealerName = "";

      if (isSubdealerCustomer) {
        // CASE A: Registered Subdealer
        isUnregisteredSubdealer = false;
        subdealerId = matchedCustomer?.id || primaryStore?.storeId || "";
        const parentId = matchedCustomer?.parentDealerId;
        if (parentId) {
          const parentCustomer = (customersList || []).find(
            (c: any) => c.id === parentId,
          );
          dealerId = parentId;
          dealerName = parentCustomer?.name || "";
        }
      } else if (primaryStore?.subDealerStore) {
        // CASE B: Unregistered Subdealer
        isUnregisteredSubdealer = true;
        subDealerStore = primaryStore.subDealerStore;
        dealerId = primaryStore.storeId || "";
        dealerName = matchedCustomer?.name || primaryStore.storeName || "";
      } else {
        // Dealer target or Farmer via Dealer
        isUnregisteredSubdealer = false;
        dealerId = primaryStore?.storeId || "";
        dealerName = matchedCustomer?.name || primaryStore?.storeName || "";
      }

      // Determine meetingTarget & farmerChannel
      let meetingTarget: Type8MeetingTarget = "FARMER";
      let farmerChannel: Type8FarmerChannel = "DEALER";

      if (primaryStore?.visitPurpose === "FARMER") {
        meetingTarget = "FARMER";
        farmerChannel =
          isSubdealerCustomer || Boolean(primaryStore?.subDealerStore)
            ? "SUBDEALER"
            : "DEALER";
      } else if (
        primaryStore?.visitPurpose === "STORE" ||
        primaryStore?.visitPurpose === "DEALER" ||
        primaryStore?.visitPurpose === "SUBDEALER"
      ) {
        if (
          primaryStore.visitPurpose === "SUBDEALER" ||
          isSubdealerCustomer ||
          Boolean(primaryStore?.subDealerStore)
        ) {
          meetingTarget = "SUBDEALER";
        } else {
          meetingTarget = "DEALER";
        }
      }

      const promotionProducts: Type8PromotionProductItem[] =
        decodedStoreNotes.promotions.length > 0
          ? decodedStoreNotes.promotions.map((p, idx) => ({
              id: `promo-${idx + 1}`,
              productId: "",
              productName: "",
              quantityCases: 0,
              pricePerCase: 0,
              notes: p,
            }))
          : promoProds.map((p: any, idx: number) => ({
              id: p.id || `promo-${idx + 1}`,
              productId: p.productId,
              productName: p.product?.name || p.productName || "",
              quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
              pricePerCase: p.unitPrice != null ? Number(p.unitPrice) : 0,
              notes: p.notes || "",
            }));

      const venueType: Type8VenueType =
        primaryStore?.storeId &&
        (initial as any)?.location?.includes(primaryStore?.storeName || "")
          ? "STORE"
          : (initial as any)?.location
            ? "OTHER"
            : "STORE";

      return [
        {
          id: "1",
          meetingTarget,
          farmerChannel,
          dealerId,
          dealerName,
          subdealerId,
          subDealerStore,
          isUnregisteredSubdealer,
          topic: primaryStore?.remarks || "",
          targetProducts: targetProds.map(
            (p: any) => p.product?.name || p.productName || "",
          ),
          targetProductIds: targetProds
            .map((p: any) => p.productId)
            .filter(Boolean),
          attendeesCount:
            (initial as any)?.targetAttendeesCount != null
              ? Number((initial as any).targetAttendeesCount)
              : 10,
          detail: decodedStoreNotes.detail || "",
          venueType,
          promotionProducts,
        },
      ];
    }

    return [
      {
        id: "1",
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        dealerId: "",
        dealerName: "",
        subdealerId: "",
        subDealerStore: "",
        isUnregisteredSubdealer: false,
        topic: "",
        targetProducts: [],
        targetProductIds: [],
        attendeesCount: 10,
        detail: "",
        venueType: "STORE",
        promotionProducts: [],
      },
    ];
  });

  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        dealerId: "",
        dealerName: "",
        subdealerId: "",
        subDealerStore: "",
        isUnregisteredSubdealer: false,
        topic: "",
        targetProducts: [],
        targetProductIds: [],
        attendeesCount: 10,
        detail: "",
        venueType: "STORE",
        promotionProducts: [],
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
    setType8Items((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const addPromotionProduct = (meetingId: string) => {
    setType8Items((prev) =>
      prev.map((item) => {
        if (item.id !== meetingId) return item;
        const currentPromos = item.promotionProducts || [];
        return {
          ...item,
          promotionProducts: [
            ...currentPromos,
            {
              id: String(Date.now()),
              productId: "",
              productName: "",
              quantityCases: 1,
              pricePerCase: 0,
              notes: "",
            },
          ],
        };
      }),
    );
  };

  const updatePromotionProduct = (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => {
    setType8Items((prev) =>
      prev.map((item) => {
        if (item.id !== meetingId) return item;
        const currentPromos = item.promotionProducts || [];
        return {
          ...item,
          promotionProducts: currentPromos.map((p) =>
            p.id === promoId ? { ...p, [field]: val } : p,
          ),
        };
      }),
    );
  };

  const deletePromotionProduct = (meetingId: string, promoId: string) => {
    setType8Items((prev) =>
      prev.map((item) => {
        if (item.id !== meetingId) return item;
        const currentPromos = item.promotionProducts || [];
        return {
          ...item,
          promotionProducts: currentPromos.filter((p) => p.id !== promoId),
        };
      }),
    );
  };

  const validateType8 = () => {
    return validateType8FormItems({ items: type8Items, selectedWorkTypes });
  };

  const mapType8Payload = (
    customers: any[] = customersList,
    products: any[] = productsList,
  ) => {
    const planStores: any[] = [];
    type8Items.forEach((item) => {
      let storeId: string | null = null;
      let storeName: string | null = null;
      let subDealerStore: string | null = null;

      if (item.meetingTarget === "SUBDEALER") {
        if (item.isUnregisteredSubdealer) {
          const dealer = (customers || []).find(
            (c) => c.id === item.dealerId || c.name === item.dealerName,
          );
          storeId = item.dealerId || dealer?.id || null;
          storeName = dealer?.name || item.dealerName || null;
          subDealerStore = item.subDealerStore?.trim() || null;
        } else {
          const subdealer = (customers || []).find(
            (c) => c.id === item.subdealerId,
          );
          storeId = item.subdealerId || subdealer?.id || null;
          storeName = subdealer?.name || null;
          subDealerStore = null;
        }
      } else if (
        item.meetingTarget === "FARMER" &&
        item.farmerChannel === "SUBDEALER"
      ) {
        if (!item.isUnregisteredSubdealer) {
          const subdealer = (customers || []).find(
            (c) => c.id === item.subdealerId,
          );
          storeId = item.subdealerId || subdealer?.id || null;
          storeName = subdealer?.name || null;
          subDealerStore = null;
        } else {
          const dealer = (customers || []).find(
            (c) => c.id === item.dealerId || c.name === item.dealerName,
          );
          storeId = item.dealerId || dealer?.id || null;
          storeName = dealer?.name || item.dealerName || null;
          subDealerStore = item.subDealerStore?.trim() || null;
        }
      } else {
        const dealer = (customers || []).find(
          (c) => c.id === item.dealerId || c.name === item.dealerName,
        );
        storeId = item.dealerId || dealer?.id || null;
        storeName = dealer?.name || item.dealerName || null;
        subDealerStore = null;
      }

      if (storeId || subDealerStore) {
        const promoNotes = (item.promotionProducts || [])
          .map((p) => p.notes?.trim() || "")
          .filter(Boolean);

        planStores.push({
          workTypeCode: "TYPE_8",
          storeId,
          storeName,
          subDealerStore,
          visitPurpose: item.meetingTarget === "FARMER" ? "FARMER" : "STORE",
          remarks: item.topic?.trim() || null,
          notes: encodeType8StoreNotes(item.detail, promoNotes),
        });
      }
    });

    return {
      type8Data: {
        meetings: type8Items.map((item) => ({
          meetingTarget: item.meetingTarget,
          farmerChannel: item.farmerChannel,
          dealerId: item.dealerId || null,
          dealerName: item.dealerName || null,
          subdealerId: item.subdealerId || null,
          subDealerStore: item.subDealerStore || null,
          isUnregisteredSubdealer: item.isUnregisteredSubdealer,
          topic: item.topic,
          targetProducts: item.targetProducts,
          attendeesCount: item.attendeesCount,
          detail: item.detail,
          venueType: item.venueType,
          promotions: item.promotionProducts,
        })),
      },
      stores: planStores,
      planStores,
    };
  };

  return {
    type8Items,
    setType8Items,
    addType8Row,
    updateType8Row,
    deleteType8Row,
    addPromotionProduct,
    updatePromotionProduct,
    deletePromotionProduct,
    validateType8,
    mapType8Payload,
  };
}

// Backward-compatible alias
export const useType8Form = useType8PlannedForm;
