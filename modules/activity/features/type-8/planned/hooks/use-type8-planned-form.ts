import { useState, useEffect } from "react";
import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  UseType8PlannedFormOptions,
  UseType8PlannedFormResult,
} from "../types/planned.types";
import { validateType8FormItems } from "../application/planned-validation";
import { hydrateType8PlannedData } from "../application/planned-mapper";
import { encodeType8StoreNotes } from "../../shared/notes";

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

    const hydrated = hydrateType8PlannedData(initial || initDetails);
    if (hydrated && hydrated.length > 0) {
      return hydrated;
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

  // Sync state when initialData or initialItems changes (e.g. async load in edit-view)
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setType8Items(initialItems);
      return;
    }

    if (
      initDetails?.type8Items &&
      Array.isArray(initDetails.type8Items) &&
      initDetails.type8Items.length > 0
    ) {
      setType8Items(initDetails.type8Items);
      return;
    }

    if (
      initial &&
      ((initial as any).stores?.some((s: any) => s.workTypeCode === "TYPE_8") ||
        (initial as any).type8Data ||
        (initial as any).type8Meetings ||
        (initial as any).type8Items)
    ) {
      const hydrated = hydrateType8PlannedData(initial);
      if (hydrated && hydrated.length > 0) {
        setType8Items(hydrated);
      }
    }
  }, [initialItems, initDetails, initial]);

  // Sync customer labels when customersList loads asynchronously
  useEffect(() => {
    if (!customersList || customersList.length === 0) return;

    setType8Items((prev) =>
      prev.map((item) => {
        let changed = false;
        let dealerName = item.dealerName;
        let dealerId = item.dealerId;

        // If dealerId exists but dealerName is empty
        if (dealerId && !dealerName) {
          const dCust = customersList.find((c: any) => c.id === dealerId);
          if (dCust) {
            dealerName = dCust.name;
            changed = true;
          }
        }

        // If subdealerId exists and dealerId is missing, resolve parent dealer
        if (item.subdealerId && !dealerId) {
          const subCust = customersList.find(
            (c: any) => c.id === item.subdealerId,
          );
          if (subCust?.parentDealerId) {
            dealerId = subCust.parentDealerId;
            const parent = customersList.find(
              (c: any) => c.id === dealerId,
            );
            dealerName = parent?.name || "";
            changed = true;
          }
        }

        return changed ? { ...item, dealerId, dealerName } : item;
      }),
    );
  }, [customersList]);

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
    const planProducts: any[] = [];

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
          notes: encodeType8StoreNotes(item.detail, promoNotes, {
            meetingTarget: item.meetingTarget,
            farmerChannel: item.farmerChannel,
            venueType: item.venueType,
            isUnregisteredSubdealer: item.isUnregisteredSubdealer,
            subdealerId: item.subdealerId,
            subDealerStore: item.subDealerStore,
            dealerId: item.dealerId,
            dealerName: item.dealerName,
            attendeesCount: item.attendeesCount,
          }),
        });

        // Target products
        (item.targetProducts || []).forEach((prodName, pIdx) => {
          const prodObj = (products || []).find(
            (p: any) => p.name === prodName || p.id === prodName,
          );
          const prodId =
            item.targetProductIds?.[pIdx] || prodObj?.id || prodName;
          planProducts.push({
            workTypeCode: "TYPE_8",
            storeId: storeId || null,
            productId: prodId,
            productName: prodObj?.name || prodName,
          });
        });

        // Promotion products
        (item.promotionProducts || []).forEach((promo) => {
          const prodObj = promo.productId
            ? (products || []).find((p: any) => p.id === promo.productId)
            : promo.productName
              ? (products || []).find(
                  (p: any) => p.name === promo.productName,
                )
              : null;

          if (promo.productId || prodObj?.id) {
            planProducts.push({
              workTypeCode: "TYPE_8_PROMOTION",
              storeId: storeId || null,
              productId: promo.productId || prodObj?.id,
              productName: promo.productName || prodObj?.name || null,
              targetQuantity: promo.quantityCases
                ? Number(promo.quantityCases)
                : 1,
              unitPrice: promo.pricePerCase
                ? Number(promo.pricePerCase)
                : 0,
              notes: promo.notes || null,
            });
          }
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
          targetProductIds: item.targetProductIds,
          attendeesCount: item.attendeesCount,
          detail: item.detail,
          venueType: item.venueType,
          promotions: item.promotionProducts,
        })),
      },
      stores: planStores,
      planStores,
      products: planProducts,
      planProducts,
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
