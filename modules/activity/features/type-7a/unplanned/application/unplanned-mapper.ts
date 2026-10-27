import type { Type7aUnplannedItem } from "../types/unplanned.types";

/**
 * Hydrate Type 7A Unplanned data from initial plan/actual data
 */
export function hydrateType7aUnplannedData(initialData: any): Type7aUnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type7aUnplannedItems) && initialData.type7aUnplannedItems.length > 0) {
    return initialData.type7aUnplannedItems;
  }

  // Hydrate from type7aTargets or type7aPlots if available
  const sourcePlots =
    Array.isArray(initialData.type7aTargets) && initialData.type7aTargets.length > 0
      ? initialData.type7aTargets
      : Array.isArray(initialData.type7aPlots) && initialData.type7aPlots.length > 0
      ? initialData.type7aPlots
      : null;

  if (sourcePlots && sourcePlots.length > 0) {
    const actualResults = Array.isArray(initialData.targetActualResults)
      ? initialData.targetActualResults
      : [];

    return sourcePlots.map((p: any, idx: number) => {
      const match = actualResults[idx] || {};
      return {
        id: p.id || `type7a-unplanned-${Date.now()}-${idx}`,
        plotName: p.plotName || p.name || match.t7PlotName || "",
        farmerName: p.farmerName || p.ownerName || match.t7FarmerName || "",
        storeId: p.storeId || p.customerId || match.t7FarmerCustomerId || null,
        province: p.province || p.store?.province || match.t7FarmerProvince || "",
        district: p.district || p.store?.district || match.t7FarmerDistrict || "",
        cropCategory: p.cropCategory || match.t7CropCategory || "",
        cropName: p.cropName || match.t7CropName || "",
        customCropName: p.customCropName || match.t7CustomCropName || "",
        areaRai: p.areaRai != null ? Number(p.areaRai) : match.t7AreaRai ? Number(match.t7AreaRai) : null,
        objective: p.objective || match.t7PlotObjective || "",
        notes: p.notes || match.t7Notes || "",
        latitude: p.latitude || match.t7Latitude || null,
        longitude: p.longitude || match.t7Longitude || null,
        demoProducts: p.demoProducts || p.products || match.t7DemoProducts || [],
        initialPhotos: match.t7InitialPhotos || [],
      };
    });
  }

  return [];
}

/**
 * Map Type 7A Unplanned Items to server payload
 * Generates both type7aPlots (for DemoPlot creation) and actualData outcome
 */
export function mapType7aUnplannedToPayload(items: Type7aUnplannedItem[]) {
  const type7aPlots = items.map((item) => ({
    id: item.id,
    plotName: item.plotName,
    name: item.plotName,
    farmerName: item.farmerName,
    ownerName: item.farmerName,
    storeId: item.storeId || null,
    province: item.province || null,
    district: item.district || null,
    cropCategory: item.cropCategory || "พืชทั่วไป",
    cropName: item.cropName || "พืชทั่วไป",
    customCropName: item.customCropName || null,
    areaRai: item.areaRai != null ? Number(item.areaRai) : null,
    objective: item.objective || null,
    notes: item.notes || null,
    latitude: item.latitude || null,
    longitude: item.longitude || null,
    products: (item.demoProducts || []).map((p) => ({
      productId: p.productId || "",
      productName: p.productName || "",
      quantity: p.quantity || p.targetQuantity || 1,
      targetQuantity: p.quantity || p.targetQuantity || 1,
      unit: p.unit || "ขวด",
    })),
    demoProducts: (item.demoProducts || []).map((p) => ({
      productId: p.productId || "",
      productName: p.productName || "",
      quantity: p.quantity || p.targetQuantity || 1,
      targetQuantity: p.quantity || p.targetQuantity || 1,
      unit: p.unit || "ขวด",
    })),
  }));

  const first = items[0];
  const actualOutcome = first
    ? {
        t7PlotName: first.plotName,
        t7FarmerName: first.farmerName,
        t7FarmerCustomerId: first.storeId || null,
        t7FarmerProvince: first.province,
        t7FarmerDistrict: first.district,
        t7CropCategory: first.cropCategory,
        t7CropName: first.cropName,
        t7CustomCropName: first.customCropName,
        t7AreaRai: first.areaRai,
        t7PlotObjective: first.objective,
        t7Latitude: first.latitude ? Number(first.latitude) : undefined,
        t7Longitude: first.longitude ? Number(first.longitude) : undefined,
        t7DemoProducts: first.demoProducts || [],
        t7InitialPhotos: first.initialPhotos || [],
      }
    : {};

  return {
    type7aPlots,
    actualOutcome,
    type7aUnplannedItems: items,
  };
}
