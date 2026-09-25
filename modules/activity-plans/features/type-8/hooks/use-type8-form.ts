import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
} from "@/modules/activity-plans/features/shared/form/types";

export interface UseType8FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
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
  addPromotionProduct: (meetingId: string) => void;
  updatePromotionProduct: (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => void;
  deletePromotionProduct: (meetingId: string, promoId: string) => void;
  validateType8: () => { isValid: boolean; error?: string };
  mapType8Payload: (
    customers?: any[],
    products?: any[],
  ) => {
    targetAttendees: number;
    planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      subDealerStore: string | null;
      visitPurpose: "FARMER" | "STORE" | null;
      remarks: string | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId: string | null;
      productId: string;
      productName: string | null;
      targetQuantity: number | null;
      unitPrice: number | null;
      totalAmount: number | null;
      isPriceOverridden: boolean;
      notes: string | null;
    }>;
  };
}

export function useType8Form({
  initial = {},
  initDetails,
  customersList = [],
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

    // Check if initial has existing TYPE_8 records (from DB edit)
    const existingStores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_8",
    );
    const primaryStore = existingStores && existingStores.length > 0 ? existingStores[0] : null;

    // Separate Target Products vs Promotional Products by workTypeCode
    const allProds = (initial as any)?.products || [];
    const targetProds = allProds.filter((p: any) => p.workTypeCode === "TYPE_8");
    const promoProds = allProds.filter(
      (p: any) => p.workTypeCode === "TYPE_8_PROMOTION",
    );

    if (primaryStore || targetProds.length > 0 || promoProds.length > 0) {
      const meetingTarget: Type8MeetingTarget =
        primaryStore?.visitPurpose === "DEALER" ||
        primaryStore?.visitPurpose === "SUBDEALER" ||
        primaryStore?.visitPurpose === "FARMER"
          ? primaryStore.visitPurpose
          : "FARMER";

      const farmerChannel: Type8FarmerChannel =
        primaryStore?.remarks === "SUBDEALER" ? "SUBDEALER" : "DEALER";

      const promotionProducts: Type8PromotionProductItem[] = promoProds.map(
        (p: any, idx: number) => ({
          id: p.id || `promo-${idx + 1}`,
          productId: p.productId,
          productName: p.product?.name || p.productName || "",
          quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
          pricePerCase: p.unitPrice != null ? Number(p.unitPrice) : 0,
          notes: p.notes || "",
        }),
      );

      const venueType: Type8VenueType =
        primaryStore?.storeId && (initial as any)?.location?.includes(primaryStore?.storeName || "")
          ? "STORE"
          : (initial as any)?.location
            ? "OTHER"
            : "STORE";

      return [
        {
          id: "1",
          meetingTarget,
          farmerChannel,
          dealerId: primaryStore?.storeId || "",
          dealerName: primaryStore?.store?.name || primaryStore?.storeName || "",
          subDealerStore: primaryStore?.subDealerStore || "",
          topic: (initial as any)?.title || "",
          targetProducts: targetProds.map(
            (p: any) => p.product?.name || p.productName || "",
          ),
          targetProductIds: targetProds
            .map((p: any) => p.productId)
            .filter(Boolean),
          attendeesCount:
            (initial as any)?.targetAttendeesCount != null
              ? Number((initial as any).targetAttendeesCount)
              : 1,
          detail: (initial as any)?.description || (initial as any)?.notes || "",
          promotionProducts,
          venueType,
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
        subDealerStore: "",
        topic: "",
        targetProducts: [],
        targetProductIds: [],
        attendeesCount: 1,
        detail: "",
        promotionProducts: [],
        venueType: "STORE",
      },
    ];
  });

  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        dealerId: "",
        dealerName: "",
        subDealerStore: "",
        topic: "",
        targetProducts: [],
        targetProductIds: [],
        attendeesCount: 1,
        detail: "",
        promotionProducts: [],
        venueType: "STORE",
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

  const addPromotionProduct = (meetingId: string) => {
    setType8Items((prev) =>
      prev.map((item) => {
        if (item.id !== meetingId) return item;
        const currentPromos = item.promotionProducts || [];
        const newPromo: Type8PromotionProductItem = {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantityCases: 0,
          pricePerCase: 0,
          notes: "",
        };
        return {
          ...item,
          promotionProducts: [...currentPromos, newPromo],
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
        const currentPromos = (item.promotionProducts || []).map((p) => {
          if (p.id !== promoId) return p;
          const updated = { ...p, [field]: val };
          if (field === "productName") {
            const found = productsList.find(
              (prod) => prod.name === val || prod.id === val,
            );
            if (found) {
              updated.productId = found.id;
              updated.productName = found.name;
              if (found.price != null) {
                updated.pricePerCase = Number(found.price);
              }
            }
          }
          return updated;
        });
        return {
          ...item,
          promotionProducts: currentPromos,
        };
      }),
    );
  };

  const deletePromotionProduct = (meetingId: string, promoId: string) => {
    setType8Items((prev) =>
      prev.map((item) => {
        if (item.id !== meetingId) return item;
        return {
          ...item,
          promotionProducts: (item.promotionProducts || []).filter(
            (p) => p.id !== promoId,
          ),
        };
      }),
    );
  };

  const validateType8 = (): { isValid: boolean; error?: string } => {
    const isType8Selected = selectedWorkTypes.some(
      (wt) => getWorkTypeCode(wt) === "TYPE_8",
    );
    if (!isType8Selected) return { isValid: true };

    for (let i = 0; i < type8Items.length; i++) {
      const item = type8Items[i];
      const rowNum = i + 1;

      // 1. Validate Target Audience
      if (item.meetingTarget === "DEALER") {
        if (!item.dealerId) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้า Dealer สำหรับการจัดประชุม (รายการที่ ${rowNum})`,
          };
        }
      } else if (item.meetingTarget === "SUBDEALER") {
        if (!item.subDealerStore || !item.subDealerStore.trim()) {
          return {
            isValid: false,
            error: `กรุณากรอกชื่อร้านค้า Subdealer (รายการที่ ${rowNum})`,
          };
        }
        if (!item.dealerId) {
          return {
            isValid: false,
            error: `กรุณาเลือก Dealer ต้นสังกัดของร้านค้า Subdealer (รายการที่ ${rowNum})`,
          };
        }
      } else {
        // FARMER
        if (item.farmerChannel === "SUBDEALER") {
          if (!item.subDealerStore || !item.subDealerStore.trim()) {
            return {
              isValid: false,
              error: `กรุณากรอกชื่อร้านค้า Subdealer สำหรับการจัดประชุมฟาร์มเมอร์ (รายการที่ ${rowNum})`,
            };
          }
          if (!item.dealerId) {
            return {
              isValid: false,
              error: `กรุณาเลือก Dealer ต้นสังกัดของร้าน Subdealer (รายการที่ ${rowNum})`,
            };
          }
        } else {
          // DEALER channel
          if (!item.dealerId) {
            return {
              isValid: false,
              error: `กรุณาเลือกร้านค้า Dealer สำหรับการจัดประชุมฟาร์มเมอร์ (รายการที่ ${rowNum})`,
            };
          }
        }
      }

      // 2. Validate Topic
      if (!item.topic || !item.topic.trim()) {
        return {
          isValid: false,
          error: `กรุณาระบุหัวข้อที่จะประชุม (รายการที่ ${rowNum})`,
        };
      }

      // 3. Validate Attendees
      if (item.attendeesCount == null || Number(item.attendeesCount) < 1) {
        return {
          isValid: false,
          error: `เป้าหมายผู้เข้าร่วมต้องมีอย่างน้อย 1 คน (รายการที่ ${rowNum})`,
        };
      }

      // 4. Validate Target Products limit
      if (item.targetProducts && item.targetProducts.length > 5) {
        return {
          isValid: false,
          error: `สินค้าเป้าหมายต้องไม่เกิน 5 รายการ (รายการที่ ${rowNum})`,
        };
      }

      // 5. Validate Promotional Products (if any rows added)
      if (item.promotionProducts && item.promotionProducts.length > 0) {
        for (let pIdx = 0; pIdx < item.promotionProducts.length; pIdx++) {
          const promo = item.promotionProducts[pIdx];
          if (!promo.productName || !promo.productName.trim()) {
            return {
              isValid: false,
              error: `กรุณาเลือกสินค้าในรายการสินค้าเสนอขาย/โปรโมชัน ลำดับที่ ${pIdx + 1} (รายการที่ ${rowNum})`,
            };
          }
          if (promo.quantityCases == null || Number(promo.quantityCases) < 0) {
            return {
              isValid: false,
              error: `จำนวน (ลัง) ของสินค้าเสนอขายต้องไม่ติดลบ ลำดับที่ ${pIdx + 1} (รายการที่ ${rowNum})`,
            };
          }
        }
      }
    }

    return { isValid: true };
  };

  const mapType8Payload = (
    customers: any[] = customersList,
    products: any[] = productsList,
  ) => {
    const isType8Selected = selectedWorkTypes.some(
      (wt) => getWorkTypeCode(wt) === "TYPE_8",
    );

    if (!isType8Selected) {
      return { targetAttendees: 0, planStores: [], planProducts: [] };
    }

    let targetAttendees = 0;
    const planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      subDealerStore: string | null;
      visitPurpose: "FARMER" | "STORE" | null;
      remarks: string | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId: string | null;
      productId: string;
      productName: string | null;
      targetQuantity: number | null;
      unitPrice: number | null;
      totalAmount: number | null;
      isPriceOverridden: boolean;
      notes: string | null;
    }> = [];

    type8Items.forEach((item) => {
      if (item.attendeesCount != null && Number(item.attendeesCount) > 0) {
        targetAttendees += Number(item.attendeesCount);
      }

      // Resolve Dealer Store info
      const dealer = (customers || []).find(
        (c) => c.id === item.dealerId || c.name === item.dealerName,
      );
      const storeId = item.dealerId || dealer?.id || null;
      const storeName = dealer?.name || item.dealerName || null;

      // 1. Map ActivityPlanStore for TYPE_8
      if (storeId) {
        planStores.push({
          workTypeCode: "TYPE_8",
          storeId,
          storeName,
          subDealerStore:
            item.meetingTarget === "SUBDEALER" ||
            (item.meetingTarget === "FARMER" && item.farmerChannel === "SUBDEALER")
              ? item.subDealerStore?.trim() || null
              : null,
          visitPurpose: item.meetingTarget === "FARMER" ? "FARMER" : "STORE",
          remarks:
            item.meetingTarget === "FARMER"
              ? (item.farmerChannel || "DEALER")
              : (item.meetingTarget || null),
        });
      }

      // 2. Map Target Products (workTypeCode: "TYPE_8")
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
              .map((name) => (products || []).find((p) => p.name === name)?.id)
              .filter(Boolean);

      pIds.slice(0, 5).forEach((pId, idx) => {
        const matchedP = (products || []).find((p) => p.id === pId);
        planProducts.push({
          workTypeCode: "TYPE_8",
          storeId,
          productId: pId as string,
          productName: matchedP?.name || pNames[idx] || null,
          targetQuantity: null,
          unitPrice: null,
          totalAmount: null,
          isPriceOverridden: false,
          notes: null,
        });
      });

      // 3. Map Promotional Products (workTypeCode: "TYPE_8_PROMOTION")
      (item.promotionProducts || [])
        .filter((promo) => promo.productName && promo.productName.trim() !== "")
        .forEach((promo) => {
          const matchedP = (products || []).find(
            (p) => p.id === promo.productId || p.name === promo.productName,
          );
          const pId = promo.productId || matchedP?.id;
          if (pId) {
            const qty = Number(promo.quantityCases) || 0;
            const price = Number(promo.pricePerCase) || 0;
            planProducts.push({
              workTypeCode: "TYPE_8_PROMOTION",
              storeId,
              productId: pId,
              productName: matchedP?.name || promo.productName || null,
              targetQuantity: qty,
              unitPrice: price,
              totalAmount: qty * price,
              isPriceOverridden: false,
              notes: promo.notes ? promo.notes.trim() : null,
            });
          }
        });
    });

    return { targetAttendees, planStores, planProducts };
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
