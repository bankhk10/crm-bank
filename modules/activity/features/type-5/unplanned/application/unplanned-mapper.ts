import type { Type5UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrate Type 5 Unplanned data from initial plan/actual data
 */
export function hydrateType5UnplannedData(initialData: any): Type5UnplannedItem[] {
  if (!initialData) return [];

  // Check if already in type5UnplannedItems
  if (Array.isArray(initialData.type5UnplannedItems) && initialData.type5UnplannedItems.length > 0) {
    return initialData.type5UnplannedItems;
  }

  // Hydrate from type5Targets & actual survey items if present
  if (Array.isArray(initialData.type5Targets) && initialData.type5Targets.length > 0) {
    const actualResults = Array.isArray(initialData.type5SurveyRecords)
      ? initialData.type5SurveyRecords
      : Array.isArray(initialData.targetActualResults)
        ? initialData.targetActualResults
        : [];

    return initialData.type5Targets.map((t: any, index: number) => {
      const match = actualResults.find(
        (a: any) =>
          a.id === t.id ||
          (a.storeName === (t.store || t.storeName) && a.product === (t.product || t.productName)),
      ) || actualResults[index] || {};

      return {
        id: t.id || `type5-item-${Date.now()}-${index}`,
        storeId: t.storeId,
        storeName: t.store || t.storeName || "",
        productId: t.productId,
        comparedProduct: t.product || t.productName || t.comparedProduct || "",
        detail: t.detail || t.notes || "",
        competitorBrand: match.competitorBrand || "",
        competitorProduct: match.competitorProduct || "",
        posPrice: match.posPrice != null ? Number(match.posPrice) : null,
        dealerPrice: match.dealerPrice != null ? Number(match.dealerPrice) : null,
        subdealerPrice: match.subdealerPrice != null ? Number(match.subdealerPrice) : null,
        farmerPrice: match.farmerPrice != null ? Number(match.farmerPrice) : null,
        sellingPoints: match.sellingPoints || "",
        bottleImages: match.bottleImages || [],
        promotionalImages: match.promotionalImages || [],
      };
    });
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
