import type { Type13UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrates initial Type 13 unplanned data
 */
export function hydrateType13UnplannedData(initial?: any): Type13UnplannedItem {
  if (!initial) {
    return {
      id: `unplanned-plot-${Date.now()}`,
      name: "",
      storeId: "",
      dealerName: "",
      province: "",
      district: "",
      subdistrict: "",
      village: "",
      actualPlotsCount: "",
      latitude: "",
      longitude: "",
      sprayDate: new Date().toISOString().split("T")[0],
      sprayMethod: "SINGLE",
      sprayEquipment: "เครื่องยนต์พ่นยา",
      productResponse: "ปกติ",
      problemDetail: "",
      products: [],
      images: [],
    };
  }

  const plot = initial.type13Targets?.[0] || initial.type13Plots?.[0] || initial.type13?.plots?.[0] || initial;

  return {
    id: plot.id || `unplanned-plot-${Date.now()}`,
    name: plot.name || plot.plotName || "",
    storeId: plot.storeId || "",
    dealerName: plot.dealerName || "",
    province: plot.province || "",
    district: plot.district || "",
    subdistrict: plot.subdistrict || "",
    village: plot.village || "",
    actualPlotsCount: plot.actualPlotsCount ?? plot.plannedPlotsCount ?? "",
    latitude: plot.latitude ? String(plot.latitude) : "",
    longitude: plot.longitude ? String(plot.longitude) : "",
    sprayDate: plot.sprayDate || new Date().toISOString().split("T")[0],
    sprayMethod: plot.sprayMethod || "SINGLE",
    sprayEquipment: plot.sprayEquipment || "เครื่องยนต์พ่นยา",
    productResponse: plot.productResponse || "ปกติ",
    problemDetail: plot.problemDetail || "",
    products: plot.products || [],
    images: plot.images || plot.afterSprayImages || [],
  };
}

/**
 * Maps Type 13 unplanned item to ActivityPlan actual payload
 */
export function mapType13UnplannedToPayload(item: Type13UnplannedItem) {
  const plotItem = {
    id: item.id,
    name: item.name,
    plotName: item.name,
    storeId: item.storeId,
    dealerName: item.dealerName,
    province: item.province,
    district: item.district,
    subdistrict: item.subdistrict,
    village: item.village,
    actualPlotsCount: item.actualPlotsCount ? Number(item.actualPlotsCount) : undefined,
    latitude: item.latitude,
    longitude: item.longitude,
  };

  const sprayRound = {
    roundNumber: 1,
    sprayDate: item.sprayDate,
    sprayMethod: item.sprayMethod,
    sprayEquipment: item.sprayEquipment,
    productResponse: item.productResponse,
    problemDetail: item.problemDetail,
    products: item.products,
  };

  return {
    type13Data: {
      plots: [plotItem],
    },
    type13Plots: [plotItem],
    type13Actual: {
      plots: [{ ...plotItem, sprayRounds: [sprayRound], afterSprayImages: item.images || [] }],
      sprayRounds: [sprayRound],
      totalPlots: 1,
    },
    planStores: item.storeId
      ? [
          {
            workTypeCode: "TYPE_13",
            visitPurpose: "STORE",
            storeId: item.storeId,
            storeName: item.dealerName || "ร้านค้า Dealer",
            province: item.province || null,
            remarks: `Dealer ฉีดแปลงแฮตแทค (${item.name})`,
            notes: `แปลงแฮตแทค: ${item.name}`,
          },
        ]
      : [],
  };
}
