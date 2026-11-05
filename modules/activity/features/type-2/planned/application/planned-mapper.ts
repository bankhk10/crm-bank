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

  // 1. Support loading directly from dedicated table ActivityPlanType2Target
  if (
    plan?.type2Targets &&
    Array.isArray(plan.type2Targets) &&
    plan.type2Targets.length > 0
  ) {
    const allPlanResults = Array.isArray(plan?.type2Results)
      ? plan.type2Results
      : [];

    const list: Type2TargetItem[] = plan.type2Targets.map((t: any) => {
      const isUnregistered = Boolean(t.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? t.unregisteredFarmerName || "เกษตรกรทั่วไป (ไม่ระบุชื่อ)"
        : t.store?.name || "ร้านค้า/เกษตรกร";

      const targetResults =
        Array.isArray(t.results) && t.results.length > 0
          ? t.results
          : allPlanResults.filter(
              (r: any) =>
                r.targetId === t.id ||
                !r.targetId ||
                (t.storeId && r.storeId === t.storeId),
            );

      const items: FollowupProductItem[] = (t.products || []).map((p: any) => {
        const matchedResult = targetResults.find(
          (r: any) => r.productId === p.productId,
        );

        return {
          id: p.id,
          targetId: t.id,
          productId: p.productId,
          productName: p.product?.name || p.productName || "สินค้า",
          customer: customerDisplayName,
          storeId: t.storeId || undefined,
          detail: p.notes || t.notes || "",
          expectedResult: "พืชตอบสนองดี",
          usageResult: (matchedResult?.usageResult as any) || undefined,
          followupDetail: matchedResult?.followupDetail || "",
          problemDetail: matchedResult?.problemDetail || "",
          isAdditional: false,
        };
      });

      // Include additional result items if recorded
      targetResults
        .filter((r: any) => r.isAdditional)
        .forEach((r: any) => {
          items.push({
            id: r.id,
            targetId: t.id,
            productId: r.productId,
            productName: r.productName || r.product?.name || "สินค้า",
            customer: customerDisplayName,
            storeId: t.storeId || undefined,
            detail: "",
            expectedResult: "พืชตอบสนองดี",
            usageResult: r.usageResult as any,
            followupDetail: r.followupDetail || "",
            problemDetail: r.problemDetail || "",
            isAdditional: true,
          });
        });

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
          .map((p: any) => p.product?.name || p.productName)
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
      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const matchedByIndex = t2Products.filter(
        (p) => p.targetIndex !== undefined && p.targetIndex === idx,
      );
      const matchedByStore =
        s.storeId && !isUnregistered
          ? t2Products.filter((p) => p.storeId && p.storeId === s.storeId)
          : [];

      let effectiveProducts: any[] = [];
      if (matchedByIndex.length > 0) {
        effectiveProducts = matchedByIndex;
      } else if (matchedByStore.length > 0) {
        effectiveProducts = matchedByStore;
      } else if (t2Stores.length === 1) {
        effectiveProducts = t2Products;
      } else {
        const unregisteredStoreIndices = t2Stores
          .map((st, i) => (st.isUnregisteredFarmer || !st.storeId ? i : -1))
          .filter((i) => i !== -1);
        const unassignedProducts = t2Products.filter(
          (p) => !p.storeId || p.targetIndex !== undefined,
        );
        const order = unregisteredStoreIndices.indexOf(idx);
        if (order !== -1) {
          const count = Math.max(
            1,
            Math.floor(
              unassignedProducts.length / unregisteredStoreIndices.length,
            ),
          );
          const start = order * count;
          const isLast = order === unregisteredStoreIndices.length - 1;
          effectiveProducts = isLast
            ? unassignedProducts.slice(start)
            : unassignedProducts.slice(start, start + count);
        }
      }

      const allPlanResults = Array.isArray(plan?.type2Results)
        ? plan.type2Results
        : [];

      const items: FollowupProductItem[] = effectiveProducts.map((pr) => {
        const matchedResult = allPlanResults.find(
          (r: any) =>
            r.productId === pr.productId &&
            (!r.storeId || !s.storeId || r.storeId === s.storeId),
        );

        return {
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
          usageResult: (matchedResult?.usageResult as any) || undefined,
          followupDetail: matchedResult?.followupDetail || "",
          problemDetail: matchedResult?.problemDetail || "",
          isAdditional: false,
        };
      });

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
    return initialData.type2Targets.map((t: any, idx: number) => {
      const isUnregistered = Boolean(t.isUnregisteredFarmer);
      const prods = (t.products || []).map((p: any, pIdx: number) => ({
        id: p.id || `p-${idx}-${pIdx}`,
        productId: p.productId,
        productName: p.product?.name || "",
        notes: p.notes || "",
      }));

      return {
        id: t.id || `t2-${idx}`,
        visitPurpose: t.visitPurpose || "FARMER",
        province: t.province || initialData.province || "",
        isUnregisteredFarmer: isUnregistered,
        storeId: isUnregistered ? "" : t.storeId || "",
        customerName: isUnregistered
          ? t.unregisteredFarmerName || ""
          : t.store?.name || "",
        unregisteredFarmerName: t.unregisteredFarmerName || "",
        unregisteredFarmerPhone: t.unregisteredFarmerPhone || "",
        detail: t.notes || "",
        productId: prods[0]?.productId,
        productName: prods[0]?.productName,
        products: prods,
      };
    });
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
      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const matchedByIndex = t2Products.filter(
        (p) => p.targetIndex !== undefined && p.targetIndex === idx,
      );
      const matchedByStore =
        s.storeId && !isUnregistered
          ? t2Products.filter((p) => p.storeId && p.storeId === s.storeId)
          : [];

      let effectiveProducts: any[] = [];
      if (matchedByIndex.length > 0) {
        effectiveProducts = matchedByIndex;
      } else if (matchedByStore.length > 0) {
        effectiveProducts = matchedByStore;
      } else if (t2Stores.length === 1) {
        effectiveProducts = t2Products;
      } else {
        const unregisteredStoreIndices = t2Stores
          .map((st, i) => (st.isUnregisteredFarmer || !st.storeId ? i : -1))
          .filter((i) => i !== -1);
        const unassignedProducts = t2Products.filter(
          (p) => !p.storeId || p.targetIndex !== undefined,
        );
        const order = unregisteredStoreIndices.indexOf(idx);
        if (order !== -1) {
          const count = Math.max(
            1,
            Math.floor(
              unassignedProducts.length / unregisteredStoreIndices.length,
            ),
          );
          const start = order * count;
          const isLast = order === unregisteredStoreIndices.length - 1;
          effectiveProducts = isLast
            ? unassignedProducts.slice(start)
            : unassignedProducts.slice(start, start + count);
        }
      }

      return {
        id: s.id || `t2-${idx}`,
        visitPurpose: s.visitPurpose || "FARMER",
        province: s.province || initialData.province || "",
        isUnregisteredFarmer: isUnregistered,
        storeId: isUnregistered ? "" : s.storeId || "",
        customerName: isUnregistered
          ? s.unregisteredFarmerName || ""
          : s.storeName || s.store?.name || "",
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
