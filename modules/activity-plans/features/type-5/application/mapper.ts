import type {
  Type5TargetItem,
  TargetSurveyItem,
  Type5SurveyRecord,
  Type5ImageFile,
} from "../types";

/**
 * Extract Type 5 targets from an ActivityPlan (supporting Multi-Target Survey items)
 */
export function extractType5PlanTargets(
  plan: any,
  prevTarget?: Type5TargetItem,
): {
  primary: Type5TargetItem;
  list: Type5TargetItem[];
} {
  const fallbackItem: Type5TargetItem = {
    store: "",
    product: "",
    detail: "",
    items: [],
    ...prevTarget,
  };

  // 1. Support loading directly from dedicated table ActivityPlanType5Target
  if (plan?.type5Targets && Array.isArray(plan.type5Targets) && plan.type5Targets.length > 0) {
    const list: Type5TargetItem[] = plan.type5Targets.map((t: any, idx: number) => {
      const storeName = t.store?.name || "ร้านค้า / ลูกค้า";
      const productName = t.product?.name || "สินค้าที่นำไปเปรียบเทียบ";
      const detail = t.detail || "";

      const surveyItem: TargetSurveyItem = {
        id: t.id || `t5-item-${idx}`,
        storeId: t.storeId || undefined,
        store: storeName,
        storeName,
        productId: t.productId || undefined,
        product: productName,
        productName,
        detail,
        notes: detail,
      };

      return {
        id: t.id || `t5-target-${idx}`,
        storeId: t.storeId || undefined,
        store: storeName,
        storeName,
        productId: t.productId || undefined,
        product: productName,
        productName,
        detail,
        notes: detail,
        items: [surveyItem],
      };
    });

    const primaryTarget: Type5TargetItem = {
      ...list[0],
      store: list.map((l) => l.store).filter(Boolean).join(", "),
      product: list.map((l) => l.product).filter(Boolean).join(", "),
      detail: list.map((l) => l.detail).filter(Boolean).join(" | "),
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // 2. Fallback: Generic stores & products tables
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t5Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_5" || s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  const t5Products = products.filter(
    (p) => !p.workTypeCode || p.workTypeCode === "TYPE_5" || p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );

  if (t5Stores.length === 0 && t5Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  // Combine stores and products into target items
  const maxCount = Math.max(t5Stores.length, t5Products.length);
  const list: Type5TargetItem[] = [];

  for (let idx = 0; idx < maxCount; idx++) {
    const st = t5Stores[idx] || t5Stores[0] || {};
    const pr = t5Products[idx] || t5Products[0] || {};

    const storeName = st.storeName || st.store?.name || "ร้านค้า / ลูกค้า";
    const productName = pr.productName || pr.product?.name || "สินค้าที่นำไปเปรียบเทียบ";
    const detail = pr.notes || st.notes || "";

    const surveyItem: TargetSurveyItem = {
      id: pr.id || st.id || `t5-generic-${idx}`,
      storeId: st.storeId || undefined,
      store: storeName,
      storeName,
      productId: pr.productId || undefined,
      product: productName,
      productName,
      detail,
      notes: detail,
    };

    list.push({
      id: pr.id || st.id || `t5-legacy-${idx}`,
      storeId: st.storeId || undefined,
      store: storeName,
      storeName,
      productId: pr.productId || undefined,
      product: productName,
      productName,
      detail,
      notes: detail,
      items: [surveyItem],
    });
  }

  const primaryTarget: Type5TargetItem = {
    ...list[0],
    store: list.map((l) => l.store).filter(Boolean).join(", "),
    product: list.map((l) => l.product).filter(Boolean).join(", "),
    detail: list.map((l) => l.detail).filter(Boolean).join(" | "),
    items: list.flatMap((l) => l.items || []),
  };

  return {
    primary: primaryTarget,
    list,
  };
}

/**
 * Parse Type 5 Actual Results from raw backend ActivityResult payload
 */
export function parseType5ActualResult(resData: any): {
  t5SurveyDetails?: Type5SurveyRecord[];
  t5CompetitorBrand?: string;
  t5CompetitorProduct?: string;
  t5CompetitorPrice?: string;
  t5CompetitorUnit?: string;
  t5PromotionDetail?: string;
} {
  const result: {
    t5SurveyDetails?: Type5SurveyRecord[];
    t5CompetitorBrand?: string;
    t5CompetitorProduct?: string;
    t5CompetitorPrice?: string;
    t5CompetitorUnit?: string;
    t5PromotionDetail?: string;
  } = {};

  if (!resData) return result;

  const allAttachments: any[] = Array.isArray(resData.attachments)
    ? resData.attachments
    : [];

  // 1. Direct from surveyResults relation
  if (resData.surveyResults && Array.isArray(resData.surveyResults) && resData.surveyResults.length > 0) {
    result.t5SurveyDetails = resData.surveyResults.map((sv: any) => {
      let itemAttachments =
        Array.isArray(sv.attachments) && sv.attachments.length > 0
          ? sv.attachments
          : allAttachments.filter((att: any) => att.surveyItemId === sv.id);

      if (itemAttachments.length === 0) {
        itemAttachments = allAttachments.filter((att: any) => {
          const isSurveyCat =
            att.category === "SURVEY_BOTTLE" ||
            att.category === "SURVEY_PROMO_MATERIAL";
          if (!isSurveyCat) return false;
          if (att.surveyItemId && att.surveyItemId !== sv.id) return false;
          if (resData.surveyResults.length === 1) return true;
          return (
            (att.storeId && att.storeId === sv.storeId) ||
            (att.productId && att.productId === sv.productId)
          );
        });
      }

      const bottleImages: Type5ImageFile[] = itemAttachments
        .filter((att: any) => att.category === "SURVEY_BOTTLE")
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl,
          name: att.fileName,
          size: att.fileSize || undefined,
          type: att.mimeType || undefined,
          category: att.category,
          surveyItemId: sv.id,
        }));

      const promotionalImages: Type5ImageFile[] = itemAttachments
        .filter((att: any) => att.category === "SURVEY_PROMO_MATERIAL")
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl,
          name: att.fileName,
          size: att.fileSize || undefined,
          type: att.mimeType || undefined,
          category: att.category,
          surveyItemId: sv.id,
        }));

      return {
        id: sv.id,
        storeId: sv.storeId,
        store: sv.store?.name || "",
        productId: sv.productId,
        product: sv.product?.name || "",
        competitorBrand: sv.competitorBrand || "",
        competitorProduct: sv.competitorProduct || "",
        posPrice: sv.posPrice != null ? String(sv.posPrice) : "",
        dealerPrice: sv.dealerPrice != null ? String(sv.dealerPrice) : "",
        subdealerPrice: sv.subdealerPrice != null ? String(sv.subdealerPrice) : "",
        farmerPrice: sv.farmerPrice != null ? String(sv.farmerPrice) : "",
        sellingPoints: sv.sellingPoints || "",
        bottleImages,
        promotionalImages,
        competitorPrice: sv.competitorPrice != null ? String(sv.competitorPrice) : "",
        competitorUnit: sv.competitorUnit || "",
        promotionDetail: sv.promotionDetail || "",
      };
    });
  }

  // 2. Fallback: Parse from actualSummary text
  const summaryText = resData.actualSummary || "";
  if (summaryText) {
    const compBrandMatch = summaryText.match(/แบรนด์คู่แข่ง:\s*(.+)/);
    if (compBrandMatch && compBrandMatch[1]) {
      result.t5CompetitorBrand = compBrandMatch[1].split("\n")[0].trim();
    }
    const compProdMatch = summaryText.match(/สินค้าคู่แข่ง:\s*(.+)/);
    if (compProdMatch && compProdMatch[1]) {
      result.t5CompetitorProduct = compProdMatch[1].split("\n")[0].trim();
    }
    const compPriceMatch = summaryText.match(/ราคาคู่แข่ง:\s*(.+)/);
    if (compPriceMatch && compPriceMatch[1]) {
      result.t5CompetitorPrice = compPriceMatch[1].split("\n")[0].trim();
    }
    const compUnitMatch = summaryText.match(/หน่วยสินค้าคู่แข่ง:\s*(.+)/);
    if (compUnitMatch && compUnitMatch[1]) {
      result.t5CompetitorUnit = compUnitMatch[1].split("\n")[0].trim();
    }
    const promoMatch = summaryText.match(/โปรโมชั่นคู่แข่ง:\s*(.+)/);
    if (promoMatch && promoMatch[1]) {
      result.t5PromotionDetail = promoMatch[1].split("\n")[0].trim();
    }
  }

  return result;
}

/**
 * Map Type 5 Survey items to Section Items for Detail View
 */
export function mapType5ToSectionItems(
  targetsOrStores: any[],
  products: any[] = [],
): Array<{ title: string; subtitle?: string; details?: string; extraFields?: Array<{ label: string; value: string }> }> {
  // If passed dedicated ActivityPlanType5Target list
  if (targetsOrStores.length > 0 && targetsOrStores[0]?.product !== undefined && targetsOrStores[0]?.store !== undefined) {
    return targetsOrStores.map((t) => {
      const prodName = t.product?.name || t.product || "สินค้าที่นำไปเปรียบเทียบ";
      const storeName = t.store?.name || t.store || "ร้านค้า / ลูกค้า";
      const extraFields: Array<{ label: string; value: string }> = [];

      if (storeName) {
        extraFields.push({ label: "ร้านค้าเป้าหมาย", value: storeName });
      }
      if (t.detail || t.notes) {
        extraFields.push({ label: "รายละเอียด", value: t.detail || t.notes });
      }

      return {
        title: prodName,
        subtitle: storeName ? `ร้านค้า: ${storeName}` : undefined,
        details: t.detail || t.notes || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  // Fallback: Pair generic products & stores
  const type5Products = products.filter(
    (pr) => !pr.workTypeCode || pr.workTypeCode === "TYPE_5" || pr.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  const type5Stores = targetsOrStores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_5" || s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );

  if (type5Products.length === 0 && type5Stores.length === 0) {
    return [];
  }

  const maxItems = Math.max(type5Products.length, type5Stores.length);
  const items: Array<{ title: string; subtitle?: string; details?: string; extraFields?: Array<{ label: string; value: string }> }> = [];

  for (let i = 0; i < maxItems; i++) {
    const pr = type5Products[i] || type5Products[0] || {};
    const st = type5Stores[i] || type5Stores[0] || {};

    const prodName = pr.productName || pr.product?.name || "สินค้าที่นำไปเปรียบเทียบ";
    const storeName = st.storeName || st.store?.name || "";
    const detail = pr.notes || st.notes || "";

    const extraFields: Array<{ label: string; value: string }> = [];
    if (storeName) {
      extraFields.push({ label: "ร้านค้าเป้าหมาย", value: storeName });
    }
    if (detail) {
      extraFields.push({ label: "รายละเอียด", value: detail });
    }

    items.push({
      title: prodName,
      subtitle: storeName ? `ร้านค้า: ${storeName}` : undefined,
      details: detail || undefined,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
    });
  }

  return items;
}
