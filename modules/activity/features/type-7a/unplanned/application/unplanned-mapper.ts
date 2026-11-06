import type { Type7aUnplannedItem } from "../types/unplanned.types";
import { formatPhoneNumber } from "../../shared/utils";

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
      const res =
        p.results?.[0] ||
        initialData.type7aResults?.[idx] ||
        initialData.result?.type7aResults?.[idx] ||
        {};
      const match = actualResults[idx] || {};

      const rawProducts =
        (p.products && p.products.length > 0 ? p.products : null) ||
        (res.actualProducts && res.actualProducts.length > 0 ? res.actualProducts : null) ||
        p.demoProducts ||
        match.t7DemoProducts ||
        [];

      const mappedProducts = rawProducts.map((prod: any, pIdx: number) => ({
        id: prod.id || `prod-${idx}-${pIdx}`,
        productId: prod.productId || prod.product?.id || "",
        productName: prod.productName || prod.product?.name || "",
        quantity:
          prod.quantity != null
            ? Number(prod.quantity)
            : prod.targetQuantity != null
            ? Number(prod.targetQuantity)
            : prod.actualQuantity != null
            ? Number(prod.actualQuantity)
            : 1,
        targetQuantity:
          prod.targetQuantity != null
            ? Number(prod.targetQuantity)
            : prod.quantity != null
            ? Number(prod.quantity)
            : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      const rawPhotos =
        (res.attachments && res.attachments.length > 0 ? res.attachments : null) ||
        (initialData.attachments && initialData.attachments.length > 0
          ? initialData.attachments.filter(
              (a: any) =>
                a.workTypeCode === "TYPE_7A" ||
                a.type7aResultId ||
                a.category === "PLOT",
            )
          : null) ||
        match.t7InitialPhotos ||
        [];

      const mappedPhotos = rawPhotos.map((att: any, aIdx: number) => ({
        id: att.id || `photo-${idx}-${aIdx}`,
        url: att.fileUrl || att.url || "",
        name: att.fileName || att.name || "รูปถ่ายแปลงสาธิต",
      }));

      return {
        id: p.id || `type7a-unplanned-${Date.now()}-${idx}`,
        plotName: p.plotName || p.name || match.t7PlotName || "",
        farmerName:
          p.farmerName ||
          res.farmerName ||
          p.ownerName ||
          p.store?.name ||
          p.dealerName ||
          match.t7FarmerName ||
          "",
        farmerPhone: formatPhoneNumber(
          p.farmerPhone ||
          res.farmerPhone ||
          match.t7FarmerPhone ||
          ""
        ),
        storeId:
          p.storeId ||
          p.customerId ||
          res.farmerCustomerId ||
          p.store?.id ||
          match.t7FarmerCustomerId ||
          null,
        province:
          p.province ||
          res.province ||
          p.store?.province ||
          match.t7FarmerProvince ||
          "",
        district:
          p.district ||
          res.district ||
          p.store?.district ||
          match.t7FarmerDistrict ||
          "",
        cropCategory: p.cropCategory || match.t7CropCategory || "",
        cropName: p.cropName || match.t7CropName || "",
        customCropName: p.customCropName || match.t7CustomCropName || "",
        areaRai:
          p.areaRai != null
            ? Number(p.areaRai)
            : match.t7AreaRai
            ? Number(match.t7AreaRai)
            : null,
        objective: p.objective || match.t7PlotObjective || "",
        notes: p.notes || res.notes || match.t7Notes || "",
        latitude:
          p.latitude != null
            ? Number(p.latitude)
            : res.latitude != null
            ? Number(res.latitude)
            : match.t7Latitude
            ? Number(match.t7Latitude)
            : null,
        longitude:
          p.longitude != null
            ? Number(p.longitude)
            : res.longitude != null
            ? Number(res.longitude)
            : match.t7Longitude
            ? Number(match.t7Longitude)
            : null,
        demoProducts: mappedProducts,
        initialPhotos: mappedPhotos,
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
    farmerPhone: item.farmerPhone || null,
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
        t7FarmerPhone: first.farmerPhone ? formatPhoneNumber(first.farmerPhone) : undefined,
        t7FarmerCustomerId: first.storeId || null,
        t7FarmerProvince: first.province,
        t7FarmerDistrict: first.district,
        t7CropCategory: first.cropCategory,
        t7CropName: first.cropName,
        t7CustomCropName: first.customCropName,
        t7AreaRai: first.areaRai,
        t7PlotObjective: first.objective,
        t7Notes: first.notes || "",
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
