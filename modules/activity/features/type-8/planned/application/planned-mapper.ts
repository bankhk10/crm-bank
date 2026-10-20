import type {
  Type8TargetItem,
  Type8MeetingItem,
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

  if (plan.type8Items && Array.isArray(plan.type8Items)) {
    return plan.type8Items;
  }
  if (plan.type8Data?.meetings && Array.isArray(plan.type8Data.meetings)) {
    return plan.type8Data.meetings.map((m: any, idx: number) => ({
      id: m.id || `t8-${Date.now()}-${idx}`,
      meetingTarget: m.meetingTarget || "FARMER",
      farmerChannel: m.farmerChannel || "DEALER",
      dealerId: m.dealerId || "",
      dealerName: m.dealerName || "",
      subdealerId: m.subdealerId || "",
      subDealerStore: m.subDealerStore || "",
      isUnregisteredSubdealer: !!m.isUnregisteredSubdealer,
      topic: m.topic || "",
      targetProductIds: m.targetProductIds || [],
      targetProducts: m.targetProducts || [],
      attendeesCount: m.attendeesCount || 10,
      detail: m.detail || "",
      venueType: m.venueType || "STORE",
      promotionProducts: m.promotions || m.promotionProducts || [],
    }));
  }

  const rawStores: any[] = plan?.stores || plan?.planStores || [];
  const t8Stores = rawStores.filter((s: any) => s.workTypeCode === "TYPE_8");

  if (t8Stores.length > 0) {
    const rawProducts: any[] = plan?.products || plan?.planProducts || [];
    const t8Products = rawProducts
      .filter((pr: any) => pr.workTypeCode === "TYPE_8")
      .map((pr: any) => pr.productName || pr.product?.name || "");

    const t8PromoProducts = rawProducts
      .filter((pr: any) => pr.workTypeCode === "TYPE_8_PROMOTION")
      .map((pr: any, pIdx: number) => ({
        id: pr.id || `promo-${pIdx}`,
        productId: pr.productId || pr.product?.id,
        productName: pr.productName || pr.product?.name || "",
        quantityCases: Number(pr.targetQuantity || 1),
        pricePerCase: Number(pr.unitPrice || 0),
        notes: pr.notes || "",
      }));

    return t8Stores.map((s: any, idx: number) => {
      const decodedNotes = decodeType8StoreNotes(s.notes);
      return {
        id: s.id || `t8-${Date.now()}-${idx}`,
        meetingTarget: s.meetingTarget || "FARMER",
        farmerChannel: s.farmerChannel || "DEALER",
        dealerId: s.storeId || "",
        dealerName: s.storeName || s.store?.name || "",
        subdealerId: s.subdealerId || "",
        subDealerStore: s.subDealerStore || "",
        isUnregisteredSubdealer: !!s.isUnregisteredSubdealer,
        topic: s.remarks || "",
        targetProducts: t8Products,
        attendeesCount: Number(plan?.targetAttendeesCount || 10),
        detail: decodedNotes.detail || "",
        venueType: s.venueType || "STORE",
        promotionProducts: t8PromoProducts,
      };
    });
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
