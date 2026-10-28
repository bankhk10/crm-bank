import type { Type13UnplannedItem } from "../types/unplanned.types";
import type { Type13SprayingProduct } from "../../shared/types";

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
      actualPlotsCount: 1,
      latitude: "",
      longitude: "",
      sprayDate: new Date().toISOString().split("T")[0],
      sprayMethod: "SINGLE",
      sprayEquipment: "เครื่องยนต์พ่นยา",
      productResponse: "ปกติ",
      problemDetail: "",
      objective: "",
      notes: "",
      products: [],
      images: [],
    };
  }

  const plot =
    initial.type13Targets?.[0] ||
    initial.type13Plots?.[0] ||
    initial.type13?.plots?.[0] ||
    initial.type13Data?.plots?.[0] ||
    initial;

  const rawProducts =
    plot.products ||
    initial.type13Products ||
    initial.type13Actual?.plots?.[0]?.sprayRounds?.[0]?.products ||
    [];

  const products: Type13SprayingProduct[] = rawProducts.map((p: any) => ({
    productId: p.productId || p.product?.id || "",
    productName: p.productName || p.product?.name || "",
    actualRate: p.actualRate || p.applicationRate || "",
    quantityUsed: p.quantityUsed != null ? Number(p.quantityUsed) : 1,
    actualQuantity:
      p.actualQuantity != null
        ? Number(p.actualQuantity)
        : p.quantityUsed != null
          ? Number(p.quantityUsed)
          : 1,
    extraQuantity: p.extraQuantity || (p.detail?.match(/\+(\d+)/)?.[1] ?? ""),
    extraUnit: p.extraUnit || (p.detail?.match(/\d+\s*(ซีซี|กรัม|มล\.|ลิตร)/)?.[1] ?? "ซีซี"),
    unit: p.unit || p.product?.unit || "ขวด",
    detail: p.detail || "",
  }));

  return {
    id: plot.id || `unplanned-plot-${Date.now()}`,
    name: plot.name || plot.plotName || "",
    storeId: plot.storeId || "",
    dealerName: plot.dealerName || "",
    province: plot.province || "",
    district: plot.district || "",
    subdistrict: plot.subdistrict || "",
    village: plot.village || plot.villageName || "",
    actualPlotsCount: plot.actualPlotsCount ?? plot.plannedPlotsCount ?? plot.plotCount ?? 1,
    latitude: plot.latitude ? String(plot.latitude) : "",
    longitude: plot.longitude ? String(plot.longitude) : "",
    sprayDate: plot.sprayDate || new Date().toISOString().split("T")[0],
    sprayMethod: plot.sprayMethod || "SINGLE",
    sprayEquipment: plot.sprayEquipment || "เครื่องยนต์พ่นยา",
    productResponse: plot.productResponse || "ปกติ",
    problemDetail: plot.problemDetail || "",
    objective: plot.objective || initial.objective || "",
    notes: plot.notes || "",
    products,
    images: plot.images || plot.afterSprayImages || initial.attachments || [],
  };
}

/**
 * Maps Type 13 unplanned item to ActivityPlan actual payload
 */
export function mapType13UnplannedToPayload(item: Type13UnplannedItem) {
  const plotName =
    item.name?.trim() ||
    item.plotName?.trim() ||
    (item.village?.trim()
      ? `แปลงบ้าน${item.village.trim()}`
      : item.dealerName
        ? `แปลง ${item.dealerName}`
        : "แปลงสาธิตแฮตแทค");

  const normalizedProducts: Type13SprayingProduct[] = (item.products || []).map((p) => {
    const qty =
      p.actualQuantity != null && String(p.actualQuantity).trim() !== ""
        ? Number(p.actualQuantity)
        : p.quantityUsed != null && String(p.quantityUsed).trim() !== ""
          ? Number(p.quantityUsed)
          : 1;

    return {
      productId: p.productId,
      productName: p.productName || "",
      actualRate: p.actualRate || "",
      quantityUsed: qty,
      actualQuantity: qty,
      unit: p.unit || "ขวด",
      extraQuantity: p.extraQuantity || "",
      extraUnit: p.extraUnit || "ซีซี",
      detail: p.extraQuantity
        ? `+${p.extraQuantity} ${p.extraUnit || "ซีซี"}`
        : p.detail || undefined,
    };
  });

  const plotItem = {
    id: item.id,
    name: plotName,
    plotName,
    storeId: item.storeId,
    dealerName: item.dealerName,
    province: item.province,
    district: item.district,
    subdistrict: item.subdistrict,
    village: item.village || item.villageName,
    villageName: item.villageName || item.village,
    actualPlotsCount: item.actualPlotsCount ? Number(item.actualPlotsCount) : 1,
    plannedPlotsCount: item.actualPlotsCount ? Number(item.actualPlotsCount) : 1,
    plotCount: item.actualPlotsCount ? Number(item.actualPlotsCount) : 1,
    objective: item.objective || null,
    notes: item.notes || null,
    latitude: item.latitude || null,
    longitude: item.longitude || null,
    products: normalizedProducts,
  };

  const sprayRound = {
    roundNumber: 1,
    sprayDate: item.sprayDate || new Date().toISOString().split("T")[0],
    sprayMethod: item.sprayMethod || "SINGLE",
    sprayEquipment: item.sprayEquipment || "เครื่องยนต์พ่นยา",
    productResponse: item.productResponse || "ปกติ",
    problemDetail: item.problemDetail || null,
    products: normalizedProducts,
  };

  const images = item.images || item.afterSprayImages || [];

  return {
    type13Data: {
      plots: [plotItem],
    },
    type13Plots: [plotItem],
    plots: [plotItem],
    type13Actual: {
      plots: [{ ...plotItem, sprayRounds: [sprayRound], afterSprayImages: images }],
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
            remarks: `Dealer ฉีดแปลงแฮตแทค (${plotName})`,
            notes: `แปลงแฮตแทค: ${plotName}`,
          },
        ]
      : [],
  };
}
