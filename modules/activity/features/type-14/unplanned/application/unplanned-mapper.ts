import type { Type14UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrates initial Type 14 unplanned data
 */
export function hydrateType14UnplannedData(initial?: any): Type14UnplannedItem {
  if (!initial) {
    return {
      id: `unplanned-plot-${Date.now()}`,
      name: "",
      plotName: "",
      storeId: "",
      dealerName: "",
      ownerName: "",
      cropCategory: "",
      cropName: "",
      areaRai: "",
      treeCount: "",
      province: "",
      district: "",
      subdistrict: "",
      village: "",
      latitude: "",
      longitude: "",
      actualVisitDate: new Date().toISOString().split("T")[0],
      daysAfterSpray: "7",
      trackingResult: "ได้ผลตามเกณฑ์",
      productResponse: "ปกติ",
      additionalNotes: "",
      products: [],
      images: [],
    };
  }

  const plot =
    initial.type14Targets?.[0] ||
    initial.type14Plots?.[0] ||
    initial.type14?.plots?.[0] ||
    initial.type14UnplannedItem ||
    initial;

  const round =
    initial.type14Results?.[0] ||
    initial.type14Actual?.rounds?.[0] ||
    initial.type14Actual?.sprayRounds?.[0] ||
    initial.rounds?.[0] ||
    {};

  return {
    id: plot.id || `unplanned-plot-${Date.now()}`,
    name: plot.name || plot.plotName || "",
    plotName: plot.name || plot.plotName || "",
    storeId: plot.storeId || "",
    dealerName: plot.dealerName || "",
    ownerName: plot.ownerName || "",
    cropCategory: plot.cropCategory || "",
    cropName: plot.cropName || "",
    areaRai: plot.areaRai ?? "",
    treeCount: plot.treeCount ?? "",
    province: plot.province || "",
    district: plot.district || "",
    subdistrict: plot.subdistrict || "",
    village: plot.village || "",
    latitude: plot.latitude ? String(plot.latitude) : "",
    longitude: plot.longitude ? String(plot.longitude) : "",
    actualVisitDate:
      round.actualVisitDate ||
      plot.actualVisitDate ||
      new Date().toISOString().split("T")[0],
    daysAfterSpray: String(round.daysAfterSpray ?? plot.daysAfterSpray ?? "7"),
    trackingResult:
      round.trackingResult || plot.trackingResult || "ได้ผลตามเกณฑ์",
    productResponse: round.productResponse || plot.productResponse || "ปกติ",
    additionalNotes: round.additionalNotes || plot.additionalNotes || "",
    products: round.products || plot.products || [],
    images: plot.images || round.afterSprayImages || initial.attachments || [],
  };
}

/**
 * Maps Type 14 unplanned item to ActivityPlan actual payload
 */
export function mapType14UnplannedToPayload(item: Type14UnplannedItem) {
  const plotItem = {
    id: item.id,
    name: item.name || item.plotName || "แปลงแฮตแทค",
    plotName: item.name || item.plotName || "แปลงแฮตแทค",
    storeId: item.storeId,
    dealerName: item.dealerName,
    ownerName: item.ownerName,
    cropCategory: item.cropCategory,
    cropName: item.cropName,
    areaRai: item.areaRai ? Number(item.areaRai) : undefined,
    treeCount: item.treeCount ? Number(item.treeCount) : undefined,
    province: item.province,
    district: item.district,
    subdistrict: item.subdistrict,
    village: item.village,
    latitude: item.latitude,
    longitude: item.longitude,
  };

  const trackingRound = {
    roundNumber: 1,
    actualVisitDate: item.actualVisitDate,
    daysAfterSpray: item.daysAfterSpray,
    trackingResult: item.trackingResult,
    productResponse: item.productResponse,
    additionalNotes: item.additionalNotes,
    products: item.products,
    afterSprayImages: item.images || [],
  };

  return {
    type14Data: {
      mode: "NEW_PLOT",
      plots: [plotItem],
      products: item.products,
    },
    type14Plots: [plotItem],
    type14Actual: {
      plots: [
        {
          ...plotItem,
          rounds: [trackingRound],
          sprayRounds: [trackingRound],
          afterSprayImages: item.images || [],
        },
      ],
      rounds: [trackingRound],
      sprayRounds: [trackingRound],
      totalPlots: 1,
    },
    planStores: item.storeId
      ? [
          {
            workTypeCode: "TYPE_14",
            visitPurpose: "STORE",
            storeId: item.storeId,
            storeName: item.dealerName || "ร้านค้า Dealer",
            province: item.province || null,
            remarks: `Dealer ติดตามแปลงแฮตแทค (${item.name})`,
            notes: `แปลงแฮตแทค: ${item.name}`,
          },
        ]
      : [],
  };
}
