import type {
  Type8TargetItem,
  Type8MeetingItem,
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionProductItem,
} from "../types/planned.types";
import type { Type8PromotionalProductLine } from "../../shared/types";
import { decodeType8StoreNotes } from "../../shared/notes";

/**
 * Extract Type 8 targets from an ActivityPlan (supporting Multi-Target Meetings)
 */
export function extractType8PlanTargets(
  plan: any,
  prevTarget?: Type8TargetItem,
): {
  primary: Type8TargetItem;
  list: Type8TargetItem[];
} {
  const fallbackItem: Type8TargetItem = {
    topic: "",
    products: "",
    targetAttendees: "",
    customer: "",
    dealerName: "",
    subDealerStore: "",
    detail: "",
    targetProducts: [],
    targetProductItems: [],
    promotionalProducts: [],
    items: [],
    ...prevTarget,
  };

  // 1. Dedicated Relational Storage support (activity_type_8_targets & activity_type_8_products)
  if (plan?.type8Targets && Array.isArray(plan.type8Targets) && plan.type8Targets.length > 0) {
    const list: Type8TargetItem[] = plan.type8Targets.map((t: any, idx: number) => {
      const dealerName = t.dealerName || t.dealer?.name || "";
      const subDealerName = t.subDealerStore || t.subdealer?.name || "";
      const customerDisplay = subDealerName
        ? `${subDealerName} (Dealer: ${dealerName || "-"})`
        : (dealerName || t.location || "");

      const allProds: any[] = t.products || (plan.type8Products || []).filter((p: any) => p.targetId === t.id);
      const targetProds = allProds.filter((p: any) => p.productRole === "TARGET" || !p.productRole);
      const promoProds = allProds.filter((p: any) => p.productRole === "PROMOTION");

      const targetProductNames = targetProds
        .map((p: any) => p.productName || p.product?.name)
        .filter(Boolean) as string[];

      const targetProductItems = targetProds.map((p: any, pIdx: number) => ({
        id: p.id || `t8-prod-${pIdx}`,
        productId: p.productId || p.product?.id,
        productName: p.productName || p.product?.name || "",
      }));

      const promotionalProducts: Type8PromotionalProductLine[] = promoProds.map((p: any, pIdx: number) => ({
        id: p.id || `t8-promo-${pIdx}`,
        productId: p.productId || p.product?.id || "",
        productName: p.productName || p.product?.name || "สินค้าโปรโมชัน",
        quantity: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
        quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
        unitPrice: p.targetUnitPrice != null ? Number(p.targetUnitPrice) : 0,
        pricePerCase: p.targetUnitPrice != null ? Number(p.targetUnitPrice) : 0,
        totalAmount: p.targetAmount != null ? Number(p.targetAmount) : 0,
        notes: p.promotionNotes || "",
        storeId: t.dealerId || null,
      }));

      const targetAttendees =
        t.targetAttendeesCount != null && Number(t.targetAttendeesCount) > 0
          ? `${t.targetAttendeesCount} คน`
          : (plan?.targetAttendeesCount != null && Number(plan.targetAttendeesCount) > 0 ? `${plan.targetAttendeesCount} คน` : "");

      return {
        id: t.id || `t8-target-${idx}`,
        storeId: t.dealerId || t.subdealerId,
        topic: t.topic || "",
        customer: customerDisplay,
        dealerName,
        subDealerStore: subDealerName,
        detail: t.detail || "",
        targetProducts: targetProductNames,
        targetProductItems,
        products: targetProductNames.join(", "),
        promotionalProducts,
        targetAttendees,
        venueType: t.venueType,
        location: t.location,
        meetingDate: t.meetingDate,
        meetingTime: t.meetingTime,
        items: targetProductItems.map((tp) => ({
          productName: tp.productName,
          targetQty: "-",
        })),
      };
    });

    const primaryTarget: Type8TargetItem = {
      ...list[0],
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  const rawStores: any[] = plan?.stores || plan?.planStores || [];
  const rawProducts: any[] = plan?.products || plan?.planProducts || [];

  const t8Stores = rawStores.filter(
    (s: any) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร" ||
      s.workTypeCode === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  );

  const t8Products = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8",
  );
  const t8PromoProducts = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );

  const targetProductNames = t8Products
    .map((pr: any) => pr.productName || pr.product?.name)
    .filter(Boolean) as string[];

  const targetProductItems = t8Products.map((pr: any, idx: number) => ({
    id: pr.id || `t8-prod-${idx}`,
    productId: pr.productId || pr.product?.id,
    productName: pr.productName || pr.product?.name || "",
  }));

  const attendeesDisplay =
    plan?.targetAttendeesCount != null && Number(plan.targetAttendeesCount) > 0
      ? `${plan.targetAttendeesCount} คน`
      : "";

  if (t8Stores.length > 0) {
    const list: Type8TargetItem[] = t8Stores.map((s: any, idx: number) => {
      const decodedStoreNotes = decodeType8StoreNotes(s.notes);
      const storeName = s.storeName || s.store?.name || "";
      const storeDisplay = s.subDealerStore
        ? `${s.subDealerStore} (Dealer: ${storeName || "-"})`
        : storeName;

      const promotionalProducts: Type8PromotionalProductLine[] =
        decodedStoreNotes.promotions.length > 0
          ? decodedStoreNotes.promotions.map((p: string, pIdx: number) => ({
              id: `promo-${idx}-${pIdx + 1}`,
              productId: "",
              productName: "",
              quantity: 1,
              quantityCases: 1,
              unitPrice: 0,
              pricePerCase: 0,
              totalAmount: 0,
              notes: p,
              storeId: s.storeId || null,
            }))
          : t8PromoProducts.map((pr: any) => ({
              id: pr.id,
              productId: pr.productId || pr.product?.id,
              productName:
                pr.productName || pr.product?.name || "สินค้าโปรโมชัน",
              quantity: pr.targetQuantity ?? 1,
              quantityCases: pr.targetQuantity ?? 1,
              unitPrice: pr.unitPrice ? Number(pr.unitPrice) : 0,
              pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
              totalAmount: pr.targetAmount ? Number(pr.targetAmount) : 0,
              notes: pr.notes || "",
              storeId: pr.storeId || s.storeId || null,
            }));

      const topic = s.remarks || plan?.objective || "";
      const detail =
        decodedStoreNotes.detail || s.notes || plan?.description || "";

      return {
        id: s.id || `t8-target-${idx}`,
        storeId: s.storeId || s.store?.id,
        topic,
        customer: storeDisplay,
        dealerName: storeName,
        subDealerStore: s.subDealerStore || "",
        detail,
        targetProducts: targetProductNames,
        targetProductItems,
        products: targetProductNames.join(", "),
        promotionalProducts,
        targetAttendees: attendeesDisplay,
        items: targetProductItems.map((tp) => ({
          productName: tp.productName,
          targetQty: "-",
        })),
      };
    });

    const primaryTarget: Type8TargetItem = {
      ...list[0],
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // Fallback: If no dedicated stores but TYPE_8 products or attendees exist
  if (t8Products.length > 0 || t8PromoProducts.length > 0 || attendeesDisplay) {
    const promotionalProducts: Type8PromotionalProductLine[] = t8PromoProducts.map(
      (pr: any) => ({
        id: pr.id,
        productId: pr.productId || pr.product?.id,
        productName:
          pr.productName || pr.product?.name || "สินค้าโปรโมชัน",
        quantity: pr.targetQuantity ?? 1,
        quantityCases: pr.targetQuantity ?? 1,
        unitPrice: pr.unitPrice ? Number(pr.unitPrice) : 0,
        pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
        totalAmount: pr.targetAmount ? Number(pr.targetAmount) : 0,
        notes: pr.notes || "",
        storeId: pr.storeId || null,
      }),
    );

    const fallbackTarget: Type8TargetItem = {
      id: "t8-target-fallback",
      topic: plan?.objective || "",
      customer: plan?.location || "",
      dealerName: "",
      subDealerStore: "",
      detail: plan?.description || "",
      targetProducts: targetProductNames,
      targetProductItems,
      products: targetProductNames.join(", "),
      promotionalProducts,
      targetAttendees: attendeesDisplay,
      items: targetProductItems.map((tp) => ({
        productName: tp.productName,
        targetQty: "-",
      })),
    };

    return {
      primary: fallbackTarget,
      list: [fallbackTarget],
    };
  }

  return {
    primary: fallbackItem,
    list: [],
  };
}

/**
 * Hydrates existing plan into Type8MeetingItem[]
 */
export function hydrateType8PlannedData(plan: any): Type8MeetingItem[] {
  if (!plan) return [];

  // Dedicated Relational Storage support (activity_type_8_targets & activity_type_8_products)
  if (plan?.type8Targets && Array.isArray(plan.type8Targets) && plan.type8Targets.length > 0) {
    return plan.type8Targets.map((t: any, idx: number) => {
      const allProds: any[] = t.products || (plan.type8Products || []).filter((p: any) => p.targetId === t.id);
      const targetProds = allProds.filter((p: any) => p.productRole === "TARGET" || !p.productRole);
      const promoProds = allProds.filter((p: any) => p.productRole === "PROMOTION");

      const targetProducts = targetProds
        .map((p: any) => p.productName || p.product?.name || "")
        .filter(Boolean);
      const targetProductIds = targetProds
        .map((p: any) => p.productId || p.product?.id || "")
        .filter(Boolean);

      const promotionProducts: Type8PromotionProductItem[] = promoProds.map((p: any, pIdx: number) => ({
        id: p.id || `promo-${idx}-${pIdx + 1}`,
        productId: p.productId || p.product?.id || "",
        productName: p.productName || p.product?.name || "",
        quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
        pricePerCase: p.targetUnitPrice != null ? Number(p.targetUnitPrice) : 0,
        notes: p.promotionNotes || "",
      }));

      return {
        id: t.id || `t8-${Date.now()}-${idx}`,
        meetingTarget: (t.meetingTarget as Type8MeetingTarget) || "FARMER",
        farmerChannel: (t.farmerChannel as Type8FarmerChannel) || "DEALER",
        dealerId: t.dealerId || "",
        dealerName: t.dealerName || t.dealer?.name || "",
        subdealerId: t.subdealerId || "",
        subDealerStore: t.subDealerStore || t.subdealer?.name || "",
        isUnregisteredSubdealer: Boolean(t.isUnregisteredSubdealer),
        topic: t.topic || "",
        targetProducts,
        targetProductIds,
        attendeesCount: t.targetAttendeesCount != null ? Number(t.targetAttendeesCount) : (plan?.targetAttendeesCount != null ? Number(plan.targetAttendeesCount) : 10),
        detail: t.detail || "",
        venueType: (t.venueType as Type8VenueType) || "STORE",
        promotionProducts,
      };
    });
  }

  if (plan.type8Items && Array.isArray(plan.type8Items) && plan.type8Items.length > 0) {
    return plan.type8Items;
  }
  if (plan.type8Meetings && Array.isArray(plan.type8Meetings) && plan.type8Meetings.length > 0) {
    return plan.type8Meetings;
  }
  if (plan.type8Data?.meetings && Array.isArray(plan.type8Data.meetings) && plan.type8Data.meetings.length > 0) {
    return plan.type8Data.meetings.map((m: any, idx: number) => {
      const promoItems: Type8PromotionProductItem[] = (
        m.promotions ||
        m.promotionProducts ||
        []
      ).map((p: any, pIdx: number) => ({
        id: typeof p === "object" && p.id ? p.id : `promo-${idx}-${pIdx + 1}`,
        productId: typeof p === "object" ? p.productId || "" : "",
        productName: typeof p === "object" ? p.productName || "" : "",
        quantityCases:
          typeof p === "object" && p.quantityCases != null
            ? Number(p.quantityCases)
            : 1,
        pricePerCase:
          typeof p === "object" && p.pricePerCase != null
            ? Number(p.pricePerCase)
            : 0,
        notes: typeof p === "string" ? p : p.notes || "",
      }));

      return {
        id: m.id || `t8-${Date.now()}-${idx}`,
        meetingTarget: (m.meetingTarget as Type8MeetingTarget) || "FARMER",
        farmerChannel: (m.farmerChannel as Type8FarmerChannel) || "DEALER",
        dealerId: m.dealerId || "",
        dealerName: m.dealerName || "",
        subdealerId: m.subdealerId || "",
        subDealerStore: m.subDealerStore || "",
        isUnregisteredSubdealer: Boolean(m.isUnregisteredSubdealer),
        topic: m.topic || "",
        targetProductIds: m.targetProductIds || [],
        targetProducts: m.targetProducts || [],
        attendeesCount:
          m.attendeesCount != null ? Number(m.attendeesCount) : 10,
        detail: m.detail || "",
        venueType: (m.venueType as Type8VenueType) || "STORE",
        promotionProducts: promoItems,
      };
    });
  }

  const rawStores: any[] = plan?.stores || plan?.planStores || [];
  const t8Stores = rawStores.filter(
    (s: any) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร",
  );

  const rawProducts: any[] = plan?.products || plan?.planProducts || [];
  const t8Products = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8",
  );
  const t8PromoProducts = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );

  if (t8Stores.length > 0) {
    return t8Stores.map((s: any, idx: number) => {
      const decodedNotes = decodeType8StoreNotes(s.notes);

      // Customer info from DB relation or decoded notes
      const storeObj = s.store;
      const isStoreSubdealer =
        storeObj?.customerType === "SUBDEALER" ||
        storeObj?.customerType === "Subdealer";

      const isUnregistered =
        decodedNotes.isUnregisteredSubdealer !== undefined
          ? Boolean(decodedNotes.isUnregisteredSubdealer)
          : Boolean(s.subDealerStore);

      const subDealerStore =
        decodedNotes.subDealerStore || s.subDealerStore || "";

      let subdealerId = decodedNotes.subdealerId || "";
      let dealerId = decodedNotes.dealerId || "";
      let dealerName = decodedNotes.dealerName || "";

      if (!dealerId) {
        if (isStoreSubdealer) {
          subdealerId = s.storeId || storeObj?.id || "";
          dealerId = storeObj?.parentDealerId || "";
        } else if (isUnregistered) {
          dealerId = s.storeId || storeObj?.id || "";
          dealerName = s.storeName || storeObj?.name || "";
        } else {
          dealerId = s.storeId || storeObj?.id || "";
          dealerName = s.storeName || storeObj?.name || "";
        }
      } else if (!subdealerId && isStoreSubdealer) {
        subdealerId = s.storeId || storeObj?.id || "";
      }

      if (!dealerName && dealerId) {
        if (s.storeId === dealerId) {
          dealerName = s.storeName || storeObj?.name || "";
        }
      }

      // Determine meetingTarget and farmerChannel
      let meetingTarget: Type8MeetingTarget =
        (decodedNotes.meetingTarget as Type8MeetingTarget) || "FARMER";
      let farmerChannel: Type8FarmerChannel =
        (decodedNotes.farmerChannel as Type8FarmerChannel) || "DEALER";

      if (!decodedNotes.meetingTarget) {
        if (s.visitPurpose === "FARMER") {
          meetingTarget = "FARMER";
          farmerChannel =
            isStoreSubdealer || Boolean(s.subDealerStore)
              ? "SUBDEALER"
              : "DEALER";
        } else if (
          s.visitPurpose === "STORE" ||
          s.visitPurpose === "DEALER" ||
          s.visitPurpose === "SUBDEALER"
        ) {
          if (isStoreSubdealer || Boolean(s.subDealerStore)) {
            meetingTarget = "SUBDEALER";
          } else {
            meetingTarget = "DEALER";
          }
        }
      }

      // Matching target products for this store
      const matchingProducts =
        t8Stores.length === 1
          ? t8Products
          : t8Products.filter(
              (pr: any) => pr.storeId === s.storeId || !pr.storeId,
            );

      const targetProducts = matchingProducts
        .map((pr: any) => pr.productName || pr.product?.name || "")
        .filter(Boolean);

      const targetProductIds = matchingProducts
        .map((pr: any) => pr.productId || pr.product?.id || "")
        .filter(Boolean);

      // Promotional products: prefer decoded notes promotions, fallback to DB products
      let promotionProducts: Type8PromotionProductItem[] = [];
      if (decodedNotes.promotions && decodedNotes.promotions.length > 0) {
        promotionProducts = decodedNotes.promotions.map((pStr, pIdx) => ({
          id: `promo-${idx}-${pIdx + 1}`,
          productId: "",
          productName: "",
          quantityCases: 1,
          pricePerCase: 0,
          notes: pStr,
        }));
      } else {
        const matchingPromo =
          t8Stores.length === 1
            ? t8PromoProducts
            : t8PromoProducts.filter(
                (pr: any) => pr.storeId === s.storeId || !pr.storeId,
              );
        promotionProducts = matchingPromo.map((pr: any, pIdx: number) => ({
          id: pr.id || `promo-${idx}-${pIdx + 1}`,
          productId: pr.productId || pr.product?.id || "",
          productName: pr.productName || pr.product?.name || "",
          quantityCases: Number(pr.targetQuantity || 1),
          pricePerCase: Number(pr.unitPrice || 0),
          notes: pr.notes || "",
        }));
      }

      const attendeesCount =
        decodedNotes.attendeesCount != null
          ? Number(decodedNotes.attendeesCount)
          : plan?.targetAttendeesCount != null
            ? Number(plan.targetAttendeesCount)
            : 10;

      const topic = s.remarks || plan?.objective || "";
      const detail = decodedNotes.detail || s.notes || "";
      const venueType: Type8VenueType =
        (decodedNotes.venueType as Type8VenueType) || "STORE";

      return {
        id: s.id || `t8-${Date.now()}-${idx}`,
        meetingTarget,
        farmerChannel,
        dealerId,
        dealerName,
        subdealerId,
        subDealerStore,
        isUnregisteredSubdealer: isUnregistered,
        topic,
        targetProducts,
        targetProductIds,
        attendeesCount,
        detail,
        venueType,
        promotionProducts,
      };
    });
  }

  // Fallback: If no stores but targetAttendeesCount or products exist
  if (t8Products.length > 0 || plan?.targetAttendeesCount != null) {
    const targetProducts = t8Products
      .map((pr: any) => pr.productName || pr.product?.name || "")
      .filter(Boolean);
    const targetProductIds = t8Products
      .map((pr: any) => pr.productId || pr.product?.id || "")
      .filter(Boolean);

    const promotionProducts = t8PromoProducts.map((pr: any, pIdx: number) => ({
      id: pr.id || `promo-fallback-${pIdx + 1}`,
      productId: pr.productId || pr.product?.id || "",
      productName: pr.productName || pr.product?.name || "",
      quantityCases: Number(pr.targetQuantity || 1),
      pricePerCase: Number(pr.unitPrice || 0),
      notes: pr.notes || "",
    }));

    return [
      {
        id: "t8-fallback-1",
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        dealerId: "",
        dealerName: "",
        subdealerId: "",
        subDealerStore: "",
        isUnregisteredSubdealer: false,
        topic: plan?.objective || "",
        targetProducts,
        targetProductIds,
        attendeesCount: Number(plan?.targetAttendeesCount || 10),
        detail: plan?.description || "",
        venueType: "STORE",
        promotionProducts,
      },
    ];
  }

  return [];
}

/**
 * Format Type 8 Meeting details for detail view section display
 */
export function mapType8ToSectionItems(
  stores: any[],
  products: any[] = [],
  targetAttendeesCount?: number | null,
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  const type8Stores = (stores || []).filter(
    (s) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร",
  );

  const type8Products = (products || []).filter(
    (pr) => pr.workTypeCode === "TYPE_8",
  );
  const type8PromoProducts = (products || []).filter(
    (pr) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );

  if (type8Stores.length > 0) {
    return type8Stores.map((s, idx) => {
      const storeName = s.storeName || s.store?.name || "";
      const storeDisplay = s.subDealerStore
        ? `${s.subDealerStore} (Dealer: ${storeName || "-"})`
        : storeName;
      const decodedNotes = decodeType8StoreNotes(s.notes);

      const title = s.remarks || `การประชุมเกษตรกร #${idx + 1}`;
      const subtitle = storeDisplay ? `สถานที่/ร้านค้า: ${storeDisplay}` : undefined;
      const details = decodedNotes.detail || s.notes || undefined;

      const extraFields: Array<{ label: string; value: string }> = [];

      if (targetAttendeesCount) {
        extraFields.push({
          label: "ผู้เข้าร่วมเป้าหมาย",
          value: `${targetAttendeesCount} คน`,
        });
      }

      if (type8Products.length > 0) {
        const prodNames = type8Products
          .map((p) => p.productName || p.product?.name)
          .filter(Boolean)
          .join(", ");
        if (prodNames) {
          extraFields.push({ label: "สินค้าเป้าหมาย", value: prodNames });
        }
      }

      if (decodedNotes.promotions.length > 0) {
        extraFields.push({
          label: "รายละเอียดโปรโมชัน",
          value: decodedNotes.promotions.join(", "),
        });
      } else if (type8PromoProducts.length > 0) {
        const promoNames = type8PromoProducts
          .map((p) => p.productName || p.product?.name)
          .filter(Boolean)
          .join(", ");
        if (promoNames) {
          extraFields.push({ label: "รายการสินค้าโปรโมชัน", value: promoNames });
        }
      }

      return {
        title,
        subtitle,
        details,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  // Fallback if no stores but attendees or products
  if (type8Products.length > 0 || targetAttendeesCount) {
    const extraFields: Array<{ label: string; value: string }> = [];
    if (targetAttendeesCount) {
      extraFields.push({
        label: "ผู้เข้าร่วมเป้าหมาย",
        value: `${targetAttendeesCount} คน`,
      });
    }
    if (type8Products.length > 0) {
      const prodNames = type8Products
        .map((p) => p.productName || p.product?.name)
        .filter(Boolean)
        .join(", ");
      if (prodNames) {
        extraFields.push({ label: "สินค้าเป้าหมาย", value: prodNames });
      }
    }

    return [
      {
        title: "จัดประชุมเกษตรกร",
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      },
    ];
  }

  return [];
}
