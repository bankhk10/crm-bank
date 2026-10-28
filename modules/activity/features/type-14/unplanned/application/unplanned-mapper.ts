import type { Type14UnplannedItem } from "../types/unplanned.types";
import type {
  Type14PlotActualState,
  Type14ActualProductState,
  Type14WithdrawnProductLine,
  Type14ImageFile,
} from "../../shared/types";

/**
 * Creates a default unplanned plot
 */
function createDefaultPlot(idx = 1): Type14PlotActualState {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `unplanned-plot-${Date.now()}-${idx}`,
    name: `แปลงแฮตแทค ${idx}`,
    plotName: `แปลงแฮตแทค ${idx}`,
    storeId: "",
    dealerName: "",
    ownerName: "",
    cropCategory: "",
    cropName: "",
    areaRai: null,
    treeCount: null,
    province: "",
    district: "",
    subdistrict: "",
    village: "",
    latitude: "",
    longitude: "",
    plannedPlotsCount: 1,
    actualPlotsCount: 1,
    actualVisitDate: today,
    daysAfterSpray: "7",
    trackingResult: "ได้ผลตามเกณฑ์",
    productResponse: "ปกติ",
    plotStatus: "IN_PROGRESS",
    closureNotes: "",
    additionalNotes: "",
    products: [],
    afterSprayImages: [],
  };
}

/**
 * Hydrates initial Type 14 unplanned data
 */
export function hydrateType14UnplannedData(initial?: any): Type14UnplannedItem {
  const defaultDate = new Date().toISOString().split("T")[0];

  if (!initial) {
    const firstPlot = createDefaultPlot(1);
    return {
      id: firstPlot.id,
      mode: "EXISTING_PLOT",
      selectedPlanId: null,
      selectedPlotIds: [],
      type13TargetIds: [],
      plots: [firstPlot],
      hasProductWithdrawal: false,
      withdrawnProducts: [],
      name: firstPlot.name,
      plotName: firstPlot.plotName,
      storeId: "",
      dealerName: "",
      ownerName: "",
      cropCategory: "",
      cropName: "",
      province: "",
      district: "",
      subdistrict: "",
      village: "",
      latitude: "",
      longitude: "",
      plannedPlotsCount: 1,
      actualPlotsCount: 1,
      actualVisitDate: defaultDate,
      daysAfterSpray: "7",
      trackingResult: "ได้ผลตามเกณฑ์",
      productResponse: "ปกติ",
      plotStatus: "IN_PROGRESS",
      closureNotes: "",
      additionalNotes: "",
      products: [],
      images: [],
      afterSprayImages: [],
    };
  }

  // 1. Resolve raw plots list from all possible sources
  const rawTargetList: any[] =
    (Array.isArray(initial.type14Targets) && initial.type14Targets.length > 0
      ? initial.type14Targets
      : undefined) ||
    (Array.isArray(initial.type14Plots) && initial.type14Plots.length > 0
      ? initial.type14Plots
      : undefined) ||
    (Array.isArray(initial.type14Actual?.plots) &&
    initial.type14Actual.plots.length > 0
      ? initial.type14Actual.plots
      : undefined) ||
    (Array.isArray(initial.type14Data?.plots) &&
    initial.type14Data.plots.length > 0
      ? initial.type14Data.plots
      : undefined) ||
    (Array.isArray(initial.type14?.plots) && initial.type14.plots.length > 0
      ? initial.type14.plots
      : undefined) ||
    (Array.isArray(initial.type14UnplannedItem?.plots) &&
    initial.type14UnplannedItem.plots.length > 0
      ? initial.type14UnplannedItem.plots
      : undefined) ||
    (initial.storeId || initial.name || initial.plotName || initial.village
      ? [initial]
      : []);

  // 2. Resolve raw actual results
  const rawResults: any[] = [
    ...(Array.isArray(initial.type14Results) ? initial.type14Results : []),
    ...(Array.isArray(initial.result?.type14Results)
      ? initial.result.type14Results
      : []),
    ...(Array.isArray(initial.type14Actual?.rounds)
      ? initial.type14Actual.rounds
      : []),
    ...(Array.isArray(initial.type14Actual?.sprayRounds)
      ? initial.type14Actual.sprayRounds
      : []),
    ...(Array.isArray(initial.rounds) ? initial.rounds : []),
  ];

  // 3. Resolve withdrawn products
  const rawWithdrawnList: any[] =
    (Array.isArray(initial.type14Products) && initial.type14Products.length > 0
      ? initial.type14Products
      : undefined) ||
    (Array.isArray(initial.type14Data?.withdrawnProducts) &&
    initial.type14Data.withdrawnProducts.length > 0
      ? initial.type14Data.withdrawnProducts
      : undefined) ||
    (Array.isArray(initial.type14?.products) && initial.type14.products.length > 0
      ? initial.type14.products
      : undefined) ||
    (Array.isArray(initial.type14UnplannedItem?.withdrawnProducts) &&
    initial.type14UnplannedItem.withdrawnProducts.length > 0
      ? initial.type14UnplannedItem.withdrawnProducts
      : undefined) ||
    [];

  const withdrawnProducts: Type14WithdrawnProductLine[] = rawWithdrawnList.map(
    (p: any, idx: number) => ({
      id: p.id || `withdrawn-${idx + 1}`,
      productId: p.productId || p.product?.id || "",
      productName: p.productName || p.product?.name || "",
      quantity: Number(p.quantity) || 1,
      unit: p.unit || p.product?.unit || "ขวด",
    }),
  );

  const hasProductWithdrawal = Boolean(
    initial.hasProductWithdrawal ||
      initial.type14Data?.hasProductWithdrawal ||
      withdrawnProducts.length > 0,
  );

  // 4. Resolve mode
  const resolvedMode: "EXISTING_PLOT" | "NEW_PLOT" =
    initial.mode ||
    initial.type14Data?.mode ||
    initial.type14Targets?.[0]?.mode ||
    (rawTargetList[0]?.type13TargetId || rawTargetList[0]?.sourceActivityPlanId
      ? "EXISTING_PLOT"
      : "EXISTING_PLOT");

  // 5. Resolve source plan ID
  const selectedPlanId =
    initial.selectedPlanId ||
    initial.type14Data?.selectedPlanId ||
    initial.type14Targets?.[0]?.sourceActivityPlanId ||
    rawTargetList[0]?.sourceActivityPlanId ||
    rawTargetList[0]?.type13Target?.activityPlanId ||
    null;

  // 6. Map each plot
  const mappedPlots: Type14PlotActualState[] =
    rawTargetList.length > 0
      ? rawTargetList.map((t: any, idx: number) => {
          const plotId = t.id || `plot-${idx + 1}`;
          const type13Id =
            t.type13TargetId || t.type13Target?.id || t.demoPlotId || null;

          // Find matching actual result
          const matchedResult =
            rawResults.find(
              (r: any) =>
                (r.targetId && (r.targetId === plotId || r.targetId === t.id)) ||
                (type13Id && r.type13TargetId === type13Id),
            ) ||
            rawResults[idx] ||
            null;

          const plannedPlotsCount =
            t.plannedPlotsCount ?? t.type13Target?.plannedPlotsCount ?? 1;

          const actualPlotsCount =
            t.actualPlotsCount ??
            matchedResult?.actualPlotsCount ??
            plannedPlotsCount;

          const daysAfterSpray = String(
            t.daysAfterSpray ?? matchedResult?.daysAfterSpray ?? "7",
          );

          const trackingResult =
            t.trackingResult ||
            matchedResult?.trackingResult ||
            "ได้ผลตามเกณฑ์";

          const productResponse =
            t.productResponse || matchedResult?.productResponse || "ปกติ";

          const plotStatus = (t.plotStatus ||
            matchedResult?.plotStatus ||
            t.type13Target?.status ||
            "IN_PROGRESS") as "IN_PROGRESS" | "COMPLETED";

          const closureNotes =
            t.closureNotes ||
            matchedResult?.closureNotes ||
            t.type13Target?.closureNotes ||
            "";

          const additionalNotes =
            t.additionalNotes || matchedResult?.additionalNotes || "";

          const actualVisitDate = matchedResult?.actualVisitDate
            ? typeof matchedResult.actualVisitDate === "string"
              ? matchedResult.actualVisitDate.split("T")[0]
              : new Date(matchedResult.actualVisitDate)
                  .toISOString()
                  .split("T")[0]
            : t.actualVisitDate || defaultDate;

          // Map products used for this plot
          const rawProds =
            matchedResult?.productsUsed ||
            matchedResult?.products ||
            t.products ||
            withdrawnProducts;

          const products: Type14ActualProductState[] = (rawProds || []).map(
            (p: any) => {
              const extraMatch = p.detail
                ? String(p.detail).match(
                    /\+(\d+(?:\.\d+)?)\s*(ซีซี|กรัม|มล\.|ลิตร)?/,
                  )
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
                unit: p.unit || p.product?.unit || "ขวด",
                withdrawnQuantity: p.withdrawnQuantity ?? qty,
                actualQuantity: qty,
                quantityUsed: qty,
                extraQuantity,
                extraUnit,
                actualRate: p.actualRate || p.applicationRate || "",
                detail: p.detail || "",
              };
            },
          );

          // Map images for this plot
          const rawImgs =
            t.afterSprayImages ||
            t.images ||
            matchedResult?.attachments ||
            (initial.attachments || []).filter((a: any) => {
              if (a.type14ResultId && matchedResult?.id) {
                return a.type14ResultId === matchedResult.id;
              }
              if (rawTargetList.length === 1) return true;
              return false;
            });

          const afterSprayImages: Type14ImageFile[] = (rawImgs || []).map(
            (img: any, imgIdx: number) => ({
              id: img.id || `img-${idx}-${imgIdx + 1}`,
              url: img.url || img.fileUrl || "",
              name: img.name || img.fileName || "รูปภาพหลังติดตามแปลง",
              size: img.size || img.fileSize || 0,
              type: img.type || img.mimeType || "image/jpeg",
            }),
          );

          return {
            id: plotId,
            demoPlotId: type13Id || plotId,
            type13TargetId: type13Id,
            name:
              t.plotName ||
              t.name ||
              t.type13Target?.plotName ||
              `แปลงแฮตแทค ${idx + 1}`,
            plotName:
              t.plotName ||
              t.name ||
              t.type13Target?.plotName ||
              `แปลงแฮตแทค ${idx + 1}`,
            storeId: t.storeId || t.type13Target?.storeId || "",
            dealerName:
              t.dealerName ||
              t.type13Target?.dealerName ||
              t.store?.name ||
              "",
            ownerName: t.ownerName || t.type13Target?.ownerName || "",
            cropCategory: t.cropCategory || t.type13Target?.cropCategory || null,
            cropName: t.cropName || t.type13Target?.cropName || null,
            areaRai: t.areaRai != null ? Number(t.areaRai) : null,
            treeCount: t.treeCount != null ? Number(t.treeCount) : null,
            province: t.province || t.type13Target?.province || t.store?.province || "",
            district: t.district || t.type13Target?.district || t.store?.district || "",
            subdistrict: t.subdistrict || t.type13Target?.subdistrict || t.store?.subdistrict || null,
            village: t.village || t.type13Target?.village || null,
            latitude: t.latitude ? String(t.latitude) : "",
            longitude: t.longitude ? String(t.longitude) : "",
            plannedPlotsCount,
            actualPlotsCount,
            actualVisitDate,
            daysAfterSpray,
            trackingResult,
            productResponse,
            plotStatus,
            closureNotes,
            additionalNotes,
            products,
            afterSprayImages,
          };
        })
      : [createDefaultPlot(1)];

  const primaryPlot = mappedPlots[0] || createDefaultPlot(1);

  return {
    id: primaryPlot.id,
    mode: resolvedMode,
    selectedPlanId,
    selectedPlotIds: mappedPlots
      .map((p) => p.type13TargetId || p.demoPlotId || p.id)
      .filter(Boolean) as string[],
    type13TargetIds: mappedPlots
      .map((p) => p.type13TargetId || p.demoPlotId || p.id)
      .filter(Boolean) as string[],
    plots: mappedPlots,
    hasProductWithdrawal,
    withdrawnProducts,

    // Primary plot convenience fields
    name: primaryPlot.name,
    plotName: primaryPlot.plotName,
    storeId: primaryPlot.storeId,
    dealerName: primaryPlot.dealerName,
    ownerName: primaryPlot.ownerName,
    cropCategory: primaryPlot.cropCategory || undefined,
    cropName: primaryPlot.cropName || undefined,
    areaRai: primaryPlot.areaRai ?? undefined,
    treeCount: primaryPlot.treeCount ?? undefined,
    province: primaryPlot.province || "",
    district: primaryPlot.district || "",
    subdistrict: primaryPlot.subdistrict || "",
    village: primaryPlot.village || "",
    latitude: primaryPlot.latitude || "",
    longitude: primaryPlot.longitude || "",
    plannedPlotsCount: primaryPlot.plannedPlotsCount,
    actualPlotsCount: primaryPlot.actualPlotsCount,
    actualVisitDate: primaryPlot.actualVisitDate,
    daysAfterSpray: primaryPlot.daysAfterSpray,
    trackingResult: primaryPlot.trackingResult,
    productResponse: primaryPlot.productResponse,
    plotStatus: primaryPlot.plotStatus,
    closureNotes: primaryPlot.closureNotes || undefined,
    additionalNotes: primaryPlot.additionalNotes || undefined,
    products: primaryPlot.products || [],
    images: primaryPlot.afterSprayImages || [],
    afterSprayImages: primaryPlot.afterSprayImages || [],
  };
}

/**
 * Maps Type 14 unplanned item to ActivityPlan target & actual payload
 */
export function mapType14UnplannedToPayload(item: Type14UnplannedItem) {
  const plotsList: Type14PlotActualState[] =
    item.plots && item.plots.length > 0
      ? item.plots
      : [
          {
            id: item.id || `unplanned-plot-${Date.now()}`,
            name: item.name || item.plotName || "แปลงแฮตแทค 1",
            plotName: item.name || item.plotName || "แปลงแฮตแทค 1",
            storeId: item.storeId || "",
            dealerName: item.dealerName || null,
            ownerName: item.ownerName || null,
            cropCategory: item.cropCategory || null,
            cropName: item.cropName || null,
            areaRai: item.areaRai != null ? Number(item.areaRai) : null,
            treeCount: item.treeCount != null ? Number(item.treeCount) : null,
            province: item.province || "",
            district: item.district || "",
            subdistrict: item.subdistrict || null,
            village: item.village || null,
            latitude: item.latitude || null,
            longitude: item.longitude || null,
            plannedPlotsCount: Number(item.plannedPlotsCount) || 1,
            actualPlotsCount: Number(item.actualPlotsCount) || 1,
            actualVisitDate:
              item.actualVisitDate || new Date().toISOString().split("T")[0],
            daysAfterSpray: item.daysAfterSpray || "7",
            trackingResult: item.trackingResult || "ได้ผลตามเกณฑ์",
            productResponse: item.productResponse || "ปกติ",
            plotStatus: item.plotStatus || "IN_PROGRESS",
            closureNotes: item.closureNotes || null,
            additionalNotes: item.additionalNotes || null,
            products: item.products || [],
            afterSprayImages: item.afterSprayImages || item.images || [],
          },
        ];

  const effectivePlots = plotsList.map((p, idx) => ({
    id: p.id,
    type13TargetId: p.type13TargetId || p.demoPlotId || null,
    demoPlotId: p.demoPlotId || p.type13TargetId || p.id,
    name: p.name || p.plotName || `แปลงแฮตแทค ${idx + 1}`,
    plotName: p.plotName || p.name || `แปลงแฮตแทค ${idx + 1}`,
    storeId: p.storeId || item.storeId || "",
    dealerName: p.dealerName || item.dealerName || null,
    ownerName: p.ownerName || item.ownerName || null,
    cropCategory: p.cropCategory || item.cropCategory || null,
    cropName: p.cropName || item.cropName || null,
    areaRai: p.areaRai != null ? Number(p.areaRai) : null,
    treeCount: p.treeCount != null ? Number(p.treeCount) : null,
    province: p.province || item.province || "",
    district: p.district || item.district || "",
    subdistrict: p.subdistrict || item.subdistrict || null,
    village: p.village || item.village || null,
    latitude: p.latitude || item.latitude || null,
    longitude: p.longitude || item.longitude || null,
    plannedPlotsCount: Number(p.plannedPlotsCount) || 1,
    actualPlotsCount:
      Number(p.actualPlotsCount) || Number(p.plannedPlotsCount) || 1,
    actualVisitDate:
      p.actualVisitDate ||
      item.actualVisitDate ||
      new Date().toISOString().split("T")[0],
    daysAfterSpray: p.daysAfterSpray || item.daysAfterSpray || "7",
    trackingResult: p.trackingResult || item.trackingResult || "ได้ผลตามเกณฑ์",
    productResponse: p.productResponse || item.productResponse || "ปกติ",
    plotStatus: p.plotStatus || item.plotStatus || "IN_PROGRESS",
    closureNotes: p.closureNotes || item.closureNotes || null,
    additionalNotes: p.additionalNotes || item.additionalNotes || null,
    products: p.products || [],
    afterSprayImages: p.afterSprayImages || p.images || [],
  }));

  const primaryPlot = effectivePlots[0];

  const rounds = effectivePlots.map((p, idx) => ({
    roundNumber: idx + 1,
    actualVisitDate: p.actualVisitDate,
    daysAfterSpray: p.daysAfterSpray,
    trackingResult: p.trackingResult,
    productResponse: p.productResponse,
    plotStatus: p.plotStatus,
    closureNotes: p.closureNotes,
    additionalNotes: p.additionalNotes,
    products: p.products,
    afterSprayImages: p.afterSprayImages,
  }));

  const plotIds = effectivePlots
    .map((p) => p.type13TargetId || p.demoPlotId || p.id)
    .filter(Boolean) as string[];

  // Plan stores for unique stores
  const storeMap = new Map<string, any>();
  for (const p of effectivePlots) {
    if (p.storeId && !storeMap.has(p.storeId)) {
      storeMap.set(p.storeId, {
        workTypeCode: "TYPE_14",
        visitPurpose: "STORE",
        storeId: p.storeId,
        storeName: p.dealerName || "ร้านค้า Dealer",
        province: p.province || null,
        remarks: `Dealer ติดตามแปลงแฮตแทค (${p.name})`,
        notes: `แปลงแฮตแทค: ${p.name}`,
      });
    }
  }

  const type14Data = {
    mode: item.mode || "EXISTING_PLOT",
    selectedPlanId: item.selectedPlanId || null,
    sourceActivityPlanId: item.selectedPlanId || null,
    selectedPlotIds: plotIds,
    demoPlotIds: plotIds,
    type13TargetIds: plotIds,
    hasProductWithdrawal: Boolean(item.hasProductWithdrawal),
    withdrawnProducts: item.withdrawnProducts || [],
    plots: effectivePlots,
    products: item.withdrawnProducts || [],
    name: primaryPlot?.name || item.name || "แปลงแฮตแทค",
    storeId: primaryPlot?.storeId || item.storeId || "",
    dealerName: primaryPlot?.dealerName || item.dealerName || null,
    ownerName: primaryPlot?.ownerName || item.ownerName || null,
    province: primaryPlot?.province || item.province || "",
    district: primaryPlot?.district || item.district || "",
    latitude: primaryPlot?.latitude || item.latitude || null,
    longitude: primaryPlot?.longitude || item.longitude || null,
  };

  const type14Actual = {
    plots: effectivePlots,
    rounds,
    sprayRounds: rounds,
    totalPlots: effectivePlots.length,
    attachments: effectivePlots.flatMap((p) => p.afterSprayImages || []),
  };

  return {
    type14Data,
    type14Plots: effectivePlots,
    type14Targets: effectivePlots,
    type14Products: item.withdrawnProducts || [],
    type14Actual,
    planStores: Array.from(storeMap.values()),
  };
}
