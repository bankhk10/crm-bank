import type { Type13UnplannedItem } from "../types/unplanned.types";
import type { Type13SprayingProduct, Type13ImageFile } from "../../shared/types";

/**
 * Hydrates multiple Type 13 unplanned plot/village items (1 to 10 villages)
 */
export function hydrateType13UnplannedItems(initial?: any): Type13UnplannedItem[] {
  if (!initial) {
    return [createDefaultUnplannedItem(1)];
  }

  const rawList: any[] =
    (Array.isArray(initial.type13Targets) && initial.type13Targets.length > 0
      ? initial.type13Targets
      : undefined) ||
    (Array.isArray(initial.type13UnplannedItems) && initial.type13UnplannedItems.length > 0
      ? initial.type13UnplannedItems
      : undefined) ||
    (Array.isArray(initial.type13Plots) && initial.type13Plots.length > 0
      ? initial.type13Plots
      : undefined) ||
    (Array.isArray(initial.type13Data?.plots) && initial.type13Data.plots.length > 0
      ? initial.type13Data.plots
      : undefined) ||
    (Array.isArray(initial.type13?.plots) && initial.type13.plots.length > 0
      ? initial.type13.plots
      : undefined) ||
    (initial.storeId || initial.village || initial.products?.length
      ? [initial]
      : []);

  if (rawList.length === 0) {
    return [createDefaultUnplannedItem(1)];
  }

  return rawList.map((t: any, idx: number) => {
    const plotIndex = t.plotIndex || idx + 1;

    // 1. Find matched actual result
    const matchedResult =
      t.results?.[0] ||
      (Array.isArray(initial.type13Results) &&
        initial.type13Results.find((r: any) => r.targetId === t.id)) ||
      (Array.isArray(initial.type13Results) && initial.type13Results[idx]) ||
      t.result ||
      null;

    // 2. Hydrate demo products
    const rawActualProducts =
      matchedResult?.sprayRounds?.[0]?.sprayProducts ||
      matchedResult?.sprayRounds?.[0]?.products ||
      [];

    const rawTargetProducts =
      t.products ||
      t.withdrawnProducts ||
      (idx === 0 ? initial.type13Products : []) ||
      [];

    const rawProducts = rawActualProducts.length > 0 ? rawActualProducts : rawTargetProducts;

    const products: Type13SprayingProduct[] = rawProducts.map((p: any) => {
      const extraMatch = p.detail
        ? String(p.detail).match(/\+(\d+(?:\.\d+)?)\s*(ซีซี|กรัม|มล\.|ลิตร)?/)
        : null;
      const extraQuantity =
        p.extraQuantity != null && String(p.extraQuantity).trim() !== ""
          ? String(p.extraQuantity)
          : extraMatch?.[1] ?? "";
      const extraUnit = p.extraUnit || extraMatch?.[2] || "ซีซี";

      const qty =
        p.actualQuantity != null && String(p.actualQuantity).trim() !== ""
          ? Number(p.actualQuantity)
          : p.quantityUsed != null && String(p.quantityUsed).trim() !== ""
            ? Number(p.quantityUsed)
            : p.quantity != null && String(p.quantity).trim() !== ""
              ? Number(p.quantity)
              : 1;

      return {
        productId: p.productId || p.product?.id || "",
        productName: p.productName || p.product?.name || "",
        actualRate: p.actualRate || p.applicationRate || "",
        quantityUsed: qty,
        actualQuantity: qty,
        extraQuantity,
        extraUnit,
        unit: p.unit || p.product?.unit || "ขวด",
        detail:
          p.detail ||
          (extraQuantity ? `+${extraQuantity} ${extraUnit}` : undefined),
      };
    });

    // 3. Hydrate images specifically for this plot/village
    const resultImages = matchedResult?.attachments || [];
    const targetImages = t.images || t.afterSprayImages || [];
    const planAttachments = (initial.attachments || []).filter((a: any) => {
      if (a.sprayRoundId) return false;
      if (matchedResult?.id && a.type13ResultId === matchedResult.id) return true;
      if (t.id && a.targetId === t.id) return true;
      if (
        a.fileName &&
        (a.fileName.includes(`แปลงแฮตแทค ${plotIndex}`) ||
          a.fileName.includes(`แปลงที่ ${plotIndex}`) ||
          a.fileName.includes(`plot_${plotIndex}`))
      ) {
        return true;
      }
      if (rawList.length === 1 && (a.workTypeCode === "TYPE_13" || a.category === "AFTER_SPRAY" || a.category === "PLOT")) {
        return true;
      }
      return false;
    });

    const combinedRawImages = [...resultImages, ...targetImages, ...planAttachments];
    const seenImageUrls = new Set<string>();
    const images: Type13ImageFile[] = [];

    combinedRawImages.forEach((img: any) => {
      const url = img.url || img.fileUrl;
      if (url && typeof url === "string" && !seenImageUrls.has(url)) {
        seenImageUrls.add(url);
        images.push({
          id: img.id || `img-${Date.now()}-${images.length}`,
          url,
          name: img.name || img.fileName || `ภาพหลังพ่นหมู่บ้านที่ ${plotIndex}`,
          size: img.size || img.fileSize || 0,
          type: img.type || img.mimeType || "image/jpeg",
        });
      }
    });

    // 4. Coordinates & Actual Plots Count
    const actualPlotsCount =
      matchedResult?.actualPlotsCount ??
      t.actualPlotsCount ??
      t.plannedPlotsCount ??
      t.plotCount ??
      1;

    const lat =
      matchedResult?.actualLatitude != null
        ? String(matchedResult.actualLatitude)
        : t.latitude != null
          ? String(t.latitude)
          : "";

    const lng =
      matchedResult?.actualLongitude != null
        ? String(matchedResult.actualLongitude)
        : t.longitude != null
          ? String(t.longitude)
          : "";

    return {
      id: t.id || `unplanned-plot-${Date.now()}-${plotIndex}`,
      name: t.name || t.plotName || `แปลงที่ ${plotIndex}`,
      plotName: t.plotName || t.name || `แปลงที่ ${plotIndex}`,
      storeId: t.storeId || t.store?.id || "",
      dealerName: t.dealerName || t.store?.name || "",
      province: t.province || t.store?.province || "",
      district: t.district || t.store?.district || "",
      subdistrict: t.subdistrict || t.store?.subdistrict || "",
      village: t.village || t.villageName || "",
      villageName: t.villageName || t.village || "",
      actualPlotsCount: Number(actualPlotsCount) || 1,
      latitude: lat,
      longitude: lng,
      sprayDate:
        matchedResult?.sprayRounds?.[0]?.sprayDate ||
        t.sprayDate ||
        new Date().toISOString().split("T")[0],
      sprayMethod:
        matchedResult?.sprayRounds?.[0]?.sprayMethod ||
        t.sprayMethod ||
        "SINGLE",
      sprayEquipment:
        matchedResult?.sprayRounds?.[0]?.sprayEquipment ||
        t.sprayEquipment ||
        "เครื่องยนต์พ่นยา",
      productResponse:
        matchedResult?.sprayRounds?.[0]?.productResponse ||
        t.productResponse ||
        "ปกติ",
      problemDetail:
        matchedResult?.sprayRounds?.[0]?.problemDetail ||
        t.problemDetail ||
        "",
      objective: t.objective || initial.objective || "",
      notes: t.notes || "",
      products,
      images,
      afterSprayImages: images,
    };
  });
}

/**
 * Hydrates initial Type 13 unplanned single item (backward compatibility)
 */
export function hydrateType13UnplannedData(initial?: any): Type13UnplannedItem {
  const items = hydrateType13UnplannedItems(initial);
  return items[0] || createDefaultUnplannedItem(1);
}

/**
 * Maps Type 13 unplanned items (single or array of up to 10) to ActivityPlan actual payload
 */
export function mapType13UnplannedToPayload(
  input: Type13UnplannedItem | Type13UnplannedItem[],
) {
  const items: Type13UnplannedItem[] = Array.isArray(input) ? input : [input];

  const mappedPlots = items.map((item, idx) => {
    const plotIndex = idx + 1;
    const plotName =
      item.name?.trim() ||
      item.plotName?.trim() ||
      (item.village?.trim()
        ? `แปลงบ้าน${item.village.trim()}`
        : item.dealerName
          ? `แปลง ${item.dealerName} (${plotIndex})`
          : `แปลงสาธิตแฮตแทค ${plotIndex}`);

    const normalizedProducts: Type13SprayingProduct[] = (
      item.products || []
    ).map((p) => {
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

    const actualCount = item.actualPlotsCount
      ? Number(item.actualPlotsCount)
      : 1;

    return {
      id: item.id,
      plotIndex,
      name: plotName,
      plotName,
      storeId: item.storeId,
      dealerName: item.dealerName,
      province: item.province,
      district: item.district,
      subdistrict: item.subdistrict || null,
      village: item.village || item.villageName || null,
      villageName: item.villageName || item.village || null,
      actualPlotsCount: actualCount,
      plannedPlotsCount: actualCount,
      plotCount: actualCount,
      objective: item.objective || null,
      notes: item.notes || null,
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      products: normalizedProducts,
    };
  });

  const mappedActualPlots = items.map((item, idx) => {
    const basePlot = mappedPlots[idx];
    const normalizedProducts = basePlot.products;
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
      ...basePlot,
      sprayRounds: [sprayRound],
      afterSprayImages: images,
    };
  });

  const allSprayRounds = mappedActualPlots.flatMap((p) => p.sprayRounds || []);

  // Collect unique stores across all village items
  const seenStoreIds = new Set<string>();
  const planStores: any[] = [];
  items.forEach((item, idx) => {
    if (item.storeId && !seenStoreIds.has(item.storeId)) {
      seenStoreIds.add(item.storeId);
      const plotName = mappedPlots[idx]?.plotName || `แปลงที่ ${idx + 1}`;
      planStores.push({
        workTypeCode: "TYPE_13",
        visitPurpose: "STORE",
        storeId: item.storeId,
        storeName: item.dealerName || "ร้านค้า Dealer",
        province: item.province || null,
        remarks: `Dealer ฉีดแปลงแฮตแทค (${plotName})`,
        notes: `แปลงแฮตแทค: ${plotName}`,
      });
    }
  });

  return {
    type13Data: {
      plots: mappedPlots,
    },
    type13Plots: mappedPlots,
    plots: mappedPlots,
    type13Actual: {
      plots: mappedActualPlots,
      sprayRounds: allSprayRounds,
      totalPlots: items.length,
    },
    planStores,
  };
}

function createDefaultUnplannedItem(index: number = 1): Type13UnplannedItem {
  return {
    id: `unplanned-plot-${Date.now()}-${index}`,
    name: `แปลงที่ ${index}`,
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
    afterSprayImages: [],
  };
}
