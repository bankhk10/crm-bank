import type {
  Type2TargetItem,
  FollowupProductItem,
  Type2ProductFollowupItem,
} from "../types/planned.types";

/**
 * Extract Type 2 targets from an ActivityPlan (supporting Multi-Target: Stores and Farmers)
 */
export function extractType2PlanTargets(
  plan: any,
  prevTarget?: Type2TargetItem,
): {
  primary: Type2TargetItem;
  list: Type2TargetItem[];
} {
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t2Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_2" ||
      s.workTypeCode === "ติดตามผลการใช้สินค้า",
  );
  const t2Products = products.filter(
    (pr) =>
      !pr.workTypeCode ||
      pr.workTypeCode === "TYPE_2" ||
      pr.workTypeCode === "ติดตามผลการใช้สินค้า",
  );

  const fallbackItem: Type2TargetItem = {
    customer: "",
    detail: "",
    expectedResult: "พืชตอบสนองดี",
    items: [],
    ...prevTarget,
  };

  if (t2Stores.length === 0 && t2Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  // 1. Support loading directly from dedicated table ActivityPlanType2Target
  if (
    plan?.type2Targets &&
    Array.isArray(plan.type2Targets) &&
    plan.type2Targets.length > 0
  ) {
    const list: Type2TargetItem[] = plan.type2Targets.map((t: any) => {
      const isUnregistered = Boolean(t.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? t.unregisteredFarmerName || "เกษตรกรทั่วไป (ไม่ระบุชื่อ)"
        : t.store?.name || "ร้านค้า/เกษตรกร";

      const items: FollowupProductItem[] = (t.products || []).map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.name || "สินค้า",
        customer: customerDisplayName,
        storeId: t.storeId || undefined,
        detail: p.notes || t.notes || "",
        expectedResult: "พืชตอบสนองดี",
        isAdditional: false,
      }));

      return {
        id: t.id,
        storeId: t.storeId || undefined,
        storeName: t.store?.name || undefined,
        customer: customerDisplayName,
        keyFarmer: isUnregistered ? t.unregisteredFarmerName : undefined,
        province:
          t.province ||
          t.store?.province ||
          plan?.province ||
          plan?.location ||
          undefined,
        visitPurpose: t.visitPurpose,
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: t.unregisteredFarmerName || undefined,
        unregisteredFarmerPhone:
          t.unregisteredFarmerPhone || t.store?.phone || undefined,
        detail: t.notes || "",
        expectedResult: "พืชตอบสนองดี",
        product: (t.products || [])
          .map((p: any) => p.product?.name)
          .filter(Boolean)
          .join(", "),
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // 2. Fallback: Stores from generic tables
  if (t2Stores.length > 0) {
    const list: Type2TargetItem[] = t2Stores.map((s, idx) => {
      const matchedProducts =
        t2Stores.length === 1
          ? t2Products
          : t2Products.filter(
              (p) => p.storeId && s.storeId && p.storeId === s.storeId,
            );

      const effectiveProducts =
        matchedProducts.length > 0
          ? matchedProducts
          : idx === 0 && t2Products.some((p) => !p.storeId)
            ? t2Products.filter((p) => !p.storeId)
            : [];

      const items: FollowupProductItem[] = effectiveProducts.map((pr) => ({
        id: pr.id,
        productId: pr.productId,
        productName: pr.productName || pr.product?.name || "สินค้า",
        customer:
          s.storeName ||
          s.store?.name ||
          s.unregisteredFarmerName ||
          "ร้านค้า/เกษตรกร",
        storeId: s.storeId,
        detail: pr.notes || s.notes || "",
        expectedResult: "พืชตอบสนองดี",
        isAdditional: false,
      }));

      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? s.unregisteredFarmerName || "เกษตรกรทั่วไป (ไม่ระบุชื่อ)"
        : s.storeName || s.store?.name || "ร้านค้า/เกษตรกร";

      return {
        id: s.id,
        storeId: s.storeId,
        storeName: s.storeName || s.store?.name,
        customer: customerDisplayName,
        keyFarmer: isUnregistered ? s.unregisteredFarmerName : undefined,
        province:
          s.province ||
          s.store?.province ||
          plan?.province ||
          plan?.location ||
          undefined,
        visitPurpose: s.visitPurpose,
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: s.unregisteredFarmerName,
        unregisteredFarmerPhone: s.unregisteredFarmerPhone || s.store?.phone,
        detail: s.notes || s.remarks || "",
        expectedResult: "พืชตอบสนองดี",
        product: effectiveProducts
          .map((p) => p.productName || p.product?.name)
          .filter(Boolean)
          .join(", "),
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  return {
    primary: fallbackItem,
    list: [],
  };
}

/**
 * Hydrates Type 2 planned items from initial plan data for forms
 */
export function hydrateType2PlannedData(
  initialData: any,
): Type2ProductFollowupItem[] {
  if (!initialData) return [];

  // 1. From dedicated table ActivityPlanType2Target
  if (
    initialData.type2Targets &&
    Array.isArray(initialData.type2Targets) &&
    initialData.type2Targets.length > 0
  ) {
    return initialData.type2Targets.map((t: any, idx: number) => ({
      id: t.id || `t2-${idx}`,
      visitPurpose: t.visitPurpose || "FARMER",
      province: t.province || initialData.province || "",
      isUnregisteredFarmer: Boolean(t.isUnregisteredFarmer),
      storeId: t.storeId || "",
      customerName:
        t.store?.name ||
        t.unregisteredFarmerName ||
        "",
      unregisteredFarmerName: t.unregisteredFarmerName || "",
      unregisteredFarmerPhone: t.unregisteredFarmerPhone || "",
      detail: t.notes || "",
      products: (t.products || []).map((p: any, pIdx: number) => ({
        id: p.id || `p-${idx}-${pIdx}`,
        productId: p.productId,
        productName: p.product?.name || "",
        notes: p.notes || "",
      })),
    }));
  }

  // 2. From generic stores/products
  const rawStores: any[] =
    initialData.planStores || initialData.stores || [];
  const rawProducts: any[] =
    initialData.planProducts || initialData.products || [];

  const t2Stores = rawStores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_2" ||
      s.workTypeCode === "ติดตามผลการใช้สินค้า",
  );
  const t2Products = rawProducts.filter(
    (p) =>
      !p.workTypeCode ||
      p.workTypeCode === "TYPE_2" ||
      p.workTypeCode === "ติดตามผลการใช้สินค้า",
  );

  if (t2Stores.length > 0) {
    return t2Stores.map((s: any, idx: number) => {
      const matchedProducts =
        t2Stores.length === 1
          ? t2Products
          : t2Products.filter(
              (p) => p.storeId && s.storeId && p.storeId === s.storeId,
            );

      const effectiveProducts =
        matchedProducts.length > 0
          ? matchedProducts
          : idx === 0 && t2Products.some((p) => !p.storeId)
            ? t2Products.filter((p) => !p.storeId)
            : [];

      return {
        id: s.id || `t2-${idx}`,
        visitPurpose: s.visitPurpose || "FARMER",
        province: s.province || initialData.province || "",
        isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
        storeId: s.storeId || "",
        customerName:
          s.storeName ||
          s.store?.name ||
          s.unregisteredFarmerName ||
          "",
        unregisteredFarmerName: s.unregisteredFarmerName || "",
        unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
        detail: s.notes || s.remarks || "",
        products: effectiveProducts.map((p: any, pIdx: number) => ({
          id: p.id || `p-${idx}-${pIdx}`,
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          notes: p.notes || "",
        })),
      };
    });
  }

  return [];
}
