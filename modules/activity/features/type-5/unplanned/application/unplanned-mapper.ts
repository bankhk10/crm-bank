import type { Type5UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrate Type 5 Unplanned data from initial plan/actual data
 */
export function hydrateType5UnplannedData(initialData: any): Type5UnplannedItem[] {
  if (!initialData) return [];

  // 1. Direct unplanned items in state/payload
  if (
    Array.isArray(initialData.type5UnplannedItems) &&
    initialData.type5UnplannedItems.length > 0
  ) {
    return initialData.type5UnplannedItems;
  }

  // 2. Extract survey results from any available property
  const actualResults: any[] =
    Array.isArray(initialData.type5SurveyRecords) &&
    initialData.type5SurveyRecords.length > 0
      ? initialData.type5SurveyRecords
      : Array.isArray(initialData.targetActualResults) &&
          initialData.targetActualResults.length > 0
        ? initialData.targetActualResults
        : Array.isArray(initialData.result?.surveyResults) &&
            initialData.result.surveyResults.length > 0
          ? initialData.result.surveyResults
          : Array.isArray(initialData.surveyResults) &&
              initialData.surveyResults.length > 0
            ? initialData.surveyResults
            : Array.isArray(initialData.t5SurveyDetails) &&
                initialData.t5SurveyDetails.length > 0
              ? initialData.t5SurveyDetails
              : [];

  // Extract all attachments from plan or result
  const allAttachments: any[] =
    Array.isArray(initialData.attachments) && initialData.attachments.length > 0
      ? initialData.attachments
      : Array.isArray(initialData.result?.attachments) &&
          initialData.result.attachments.length > 0
        ? initialData.result.attachments
        : [];

  const targets: any[] =
    Array.isArray(initialData.type5Targets) && initialData.type5Targets.length > 0
      ? initialData.type5Targets
      : [];

  const getImagesForItem = (item: any, dbId?: string) => {
    let itemAtts: any[] =
      Array.isArray(item.attachments) && item.attachments.length > 0
        ? item.attachments
        : [];

    if (itemAtts.length === 0 && allAttachments.length > 0) {
      itemAtts = allAttachments.filter((att: any) => {
        if (att.surveyItemId && (att.surveyItemId === item.id || att.surveyItemId === dbId)) return true;
        if (att.surveyItemId && att.surveyItemId !== item.id && att.surveyItemId !== dbId) return false;
        if (actualResults.length === 1) return true;
        return (
          (att.storeId && att.storeId === item.storeId) ||
          (att.productId && att.productId === item.productId)
        );
      });
    }

    const bottleImages =
      Array.isArray(item.bottleImages) && item.bottleImages.length > 0
        ? item.bottleImages
        : itemAtts
            .filter((att: any) => {
              const cat = String(att.category || "").toUpperCase();
              return (
                cat === "SURVEY_BOTTLE" ||
                cat === "BOTTLE" ||
                cat === "PRODUCT"
              );
            })
            .map((att: any) => ({
              id: att.id,
              url: att.fileUrl || att.url,
              name: att.fileName || att.name || "ภาพขวดสินค้า",
              size: att.fileSize || att.size || undefined,
              type: att.mimeType || att.type || undefined,
              category: att.category,
              surveyItemId: dbId || item.id,
            }));

    const promotionalImages =
      Array.isArray(item.promotionalImages) && item.promotionalImages.length > 0
        ? item.promotionalImages
        : itemAtts
            .filter((att: any) => {
              const cat = String(att.category || "").toUpperCase();
              return (
                cat === "SURVEY_PROMO_MATERIAL" ||
                cat === "PROMOTION" ||
                cat === "PROMO" ||
                cat === "MEDIA"
              );
            })
            .map((att: any) => ({
              id: att.id,
              url: att.fileUrl || att.url,
              name: att.fileName || att.name || "ภาพสื่อโปรโมท",
              size: att.fileSize || att.size || undefined,
              type: att.mimeType || att.type || undefined,
              category: att.category,
              surveyItemId: dbId || item.id,
            }));

    return { bottleImages, promotionalImages };
  };

  // Case A: type5Targets are present
  if (targets.length > 0) {
    return targets.map((t: any, index: number) => {
      const storeName =
        t.storeName ||
        (typeof t.store === "string" ? t.store : t.store?.name) ||
        "";
      const comparedProduct =
        t.comparedProduct ||
        t.productName ||
        (typeof t.product === "string" ? t.product : t.product?.name) ||
        "";

      const match =
        actualResults.find(
          (a: any) =>
            a.id === t.id ||
            (t.storeId && a.storeId === t.storeId) ||
            (storeName &&
              (a.storeName === storeName || a.store?.name === storeName)),
        ) ||
        actualResults[index] ||
        {};

      const { bottleImages, promotionalImages } = getImagesForItem(
        match,
        t.id,
      );

      return {
        id: t.id || `type5-item-${Date.now()}-${index}`,
        storeId: t.storeId || match.storeId || "",
        storeName: storeName || match.storeName || match.store?.name || "",
        productId: t.productId || match.productId || "",
        comparedProduct:
          comparedProduct || match.productName || match.product?.name || "",
        detail: t.detail || t.notes || "",
        competitorBrand: match.competitorBrand || "",
        competitorProduct: match.competitorProduct || "",
        posPrice:
          match.posPrice != null && String(match.posPrice).trim() !== ""
            ? Number(match.posPrice)
            : null,
        dealerPrice:
          match.dealerPrice != null && String(match.dealerPrice).trim() !== ""
            ? Number(match.dealerPrice)
            : null,
        subdealerPrice:
          match.subdealerPrice != null &&
          String(match.subdealerPrice).trim() !== ""
            ? Number(match.subdealerPrice)
            : null,
        farmerPrice:
          match.farmerPrice != null && String(match.farmerPrice).trim() !== ""
            ? Number(match.farmerPrice)
            : null,
        sellingPoints: match.sellingPoints || "",
        bottleImages,
        promotionalImages,
      };
    });
  }

  // Case B: No type5Targets, but actualResults (survey items) exist
  if (actualResults.length > 0) {
    return actualResults.map((item: any, index: number) => {
      const storeName =
        item.storeName ||
        (typeof item.store === "string" ? item.store : item.store?.name) ||
        "";
      const comparedProduct =
        item.comparedProduct ||
        item.productName ||
        (typeof item.product === "string" ? item.product : item.product?.name) ||
        "";

      const { bottleImages, promotionalImages } = getImagesForItem(
        item,
        item.id,
      );

      return {
        id: item.id || `type5-item-${Date.now()}-${index}`,
        storeId: item.storeId || "",
        storeName,
        productId: item.productId || "",
        comparedProduct,
        detail: item.detail || item.notes || item.promotionDetail || "",
        competitorBrand: item.competitorBrand || "",
        competitorProduct: item.competitorProduct || "",
        posPrice:
          item.posPrice != null && String(item.posPrice).trim() !== ""
            ? Number(item.posPrice)
            : null,
        dealerPrice:
          item.dealerPrice != null && String(item.dealerPrice).trim() !== ""
            ? Number(item.dealerPrice)
            : null,
        subdealerPrice:
          item.subdealerPrice != null &&
          String(item.subdealerPrice).trim() !== ""
            ? Number(item.subdealerPrice)
            : null,
        farmerPrice:
          item.farmerPrice != null && String(item.farmerPrice).trim() !== ""
            ? Number(item.farmerPrice)
            : null,
        sellingPoints: item.sellingPoints || "",
        bottleImages,
        promotionalImages,
      };
    });
  }

  // Case C: Fallback to generic stores if any
  const genericStores: any[] = (
    initialData.stores ||
    initialData.planStores ||
    []
  ).filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_5" ||
      s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  if (genericStores.length > 0) {
    return genericStores.map((st: any, index: number) => ({
      id: st.id || `type5-item-${Date.now()}-${index}`,
      storeId: st.storeId || "",
      storeName:
        st.storeName ||
        (typeof st.store === "string" ? st.store : st.store?.name) ||
        "",
      productId: "",
      comparedProduct: "",
      detail: st.notes || "",
      competitorBrand: "",
      competitorProduct: "",
      posPrice: null,
      dealerPrice: null,
      subdealerPrice: null,
      farmerPrice: null,
      sellingPoints: "",
      bottleImages: [],
      promotionalImages: [],
    }));
  }

  return [];
}

/**
 * Map Type 5 Unplanned Items to server payload
 * Produces both type5Targets (stores/plans) and actual survey items
 */
export function mapType5UnplannedToPayload(items: Type5UnplannedItem[]) {
  const type5Targets = items.map((item) => ({
    id: item.id,
    storeId: item.storeId || null,
    store: item.storeName || "",
    storeName: item.storeName || "",
    productId: item.productId || null,
    product: item.comparedProduct,
    productName: item.comparedProduct,
    comparedProduct: item.comparedProduct,
    detail: item.detail || "",
    notes: item.detail || "",
  }));

  const actualSurveyRecords = items.map((item) => ({
    id: item.id,
    storeId: item.storeId || null,
    store: item.storeName || "",
    storeName: item.storeName || "",
    productId: item.productId || null,
    product: item.comparedProduct,
    competitorBrand: item.competitorBrand,
    competitorProduct: item.competitorProduct,
    posPrice: item.posPrice != null ? Number(item.posPrice) : null,
    dealerPrice: item.dealerPrice != null ? Number(item.dealerPrice) : null,
    subdealerPrice: item.subdealerPrice != null ? Number(item.subdealerPrice) : null,
    farmerPrice: item.farmerPrice != null ? Number(item.farmerPrice) : null,
    sellingPoints: item.sellingPoints || "",
    bottleImages: item.bottleImages || [],
    promotionalImages: item.promotionalImages || [],
  }));

  return {
    type5Targets,
    type5SurveyRecords: actualSurveyRecords,
    targetActualResults: actualSurveyRecords,
    type5UnplannedItems: items,
  };
}
