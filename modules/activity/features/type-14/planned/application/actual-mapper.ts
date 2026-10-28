import type { Type14DetailData } from "../types/actual.types";
import type {
  Type14SprayRoundState,
  Type14PlotActualState,
  Type14ActualProductState,
} from "../../shared/types";

/**
 * Parses raw actual result and attachments into structured Type 14 actual data
 */
export function parseType14ActualResult(
  resultSummary = "",
  payloadToHydrate: any = {},
): Type14DetailData {
  const actualData: Type14DetailData = {
    demoPlotId: payloadToHydrate.demoPlotId || null,
    plotName: payloadToHydrate.plotName || null,
    rounds: [],
    sprayRounds: [],
    plots: [],
    attachments: [],
  };

  const rawResults: any[] = [
    ...(Array.isArray(payloadToHydrate.type14Results)
      ? payloadToHydrate.type14Results
      : []),
    ...(Array.isArray(payloadToHydrate.result?.type14Results)
      ? payloadToHydrate.result.type14Results
      : []),
  ];

  const rawRounds: any[] =
    rawResults.length > 0
      ? rawResults
      : payloadToHydrate.type14Actual?.rounds ||
        payloadToHydrate.type14Actual?.sprayRounds ||
        payloadToHydrate.rounds ||
        payloadToHydrate.sprayRounds ||
        [];

  const rawAttachments: any[] =
    payloadToHydrate.attachments ||
    payloadToHydrate.type14Actual?.attachments ||
    [];

  const mappedRounds: Type14SprayRoundState[] = rawRounds.map((r: any, idx: number) => ({
    id: r.id || `round-${idx + 1}`,
    roundNumber: r.roundNumber || idx + 1,
    actualVisitDate: r.actualVisitDate || r.visitDate || "",
    daysAfterSpray: String(r.daysAfterSpray ?? r.daysSinceStart ?? ""),
    trackingResult: r.trackingResult || r.productResponse || "",
    productResponse: r.productResponse || "",
    additionalNotes: r.additionalNotes || r.notes || "",
    afterSprayImages: (r.afterSprayImages || r.attachments || []).map((img: any, imgIdx: number) => ({
      id: img.id || `img-${imgIdx + 1}`,
      url: img.url || img.fileUrl || "",
      name: img.name || img.fileName || "รูปภาพหลังติดตามแปลง",
      size: img.size || img.fileSize || 0,
      type: img.type || img.mimeType || "image/jpeg",
    })),
    products: (r.productsUsed || r.products || []).map((p: any) => ({
      productId: p.productId,
      productName: p.productName || p.product?.name || "",
      unit: p.unit || p.product?.unit || "ขวด",
      quantityUsed: p.quantityUsed ?? p.quantity ?? "",
      actualQuantity: p.quantityUsed ?? p.actualQuantity ?? p.quantity ?? "",
      extraQuantity:
        p.extraQuantity != null && String(p.extraQuantity).trim() !== ""
          ? String(p.extraQuantity)
          : "",
      extraUnit: p.extraUnit || "ซีซี",
      actualRate: p.actualRate || p.applicationRate || "",
      detail: p.detail || "",
    })),
  }));

  actualData.rounds = mappedRounds;
  actualData.sprayRounds = mappedRounds;

  const rawPlots: any[] =
    payloadToHydrate.type14Actual?.plots ||
    payloadToHydrate.type14Plots ||
    payloadToHydrate.type14Targets ||
    payloadToHydrate.plots ||
    [];

  if (rawPlots.length > 0) {
    actualData.plots = rawPlots.map((p: any, idx: number) => {
      const matchedRes =
        rawResults.find(
          (r: any) =>
            (p.id && r.targetId === p.id) ||
            (p.type13TargetId && r.type13TargetId === p.type13TargetId) ||
            (p.demoPlotId && r.targetId === p.demoPlotId),
        ) ||
        rawResults[idx] ||
        rawRounds[idx] ||
        null;

      let actualCount =
        p.actualPlotsCount ??
        matchedRes?.actualPlotsCount ??
        (p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1);

      const daysAfter =
        p.daysAfterSpray != null
          ? String(p.daysAfterSpray)
          : matchedRes?.daysAfterSpray != null
            ? String(matchedRes.daysAfterSpray)
            : "";

      const trackingRes =
        p.trackingResult ||
        matchedRes?.trackingResult ||
        "ได้ผลตามเกณฑ์";

      const prodResponse =
        p.productResponse ||
        matchedRes?.productResponse ||
        "ปกติ";

      const notesText =
        p.additionalNotes ||
        matchedRes?.additionalNotes ||
        "";

      // Products for this plot
      const plotProds: Type14ActualProductState[] = (() => {
        if (Array.isArray(p.products) && p.products.length > 0) {
          return p.products.map((prod: any) => ({
            ...prod,
            extraQuantity:
              prod.extraQuantity != null && String(prod.extraQuantity).trim() !== ""
                ? String(prod.extraQuantity)
                : "",
            extraUnit: prod.extraUnit || "ซีซี",
          }));
        }
        if (matchedRes?.productsUsed || matchedRes?.products) {
          return (matchedRes.productsUsed || matchedRes.products).map((prod: any) => {
            const extraQty =
              prod.extraQuantity != null && String(prod.extraQuantity).trim() !== ""
                ? String(prod.extraQuantity)
                : "";
            const extraU = prod.extraUnit || "ซีซี";

            return {
              productId: prod.productId,
              productName: prod.productName || prod.product?.name || "",
              unit: prod.unit || prod.product?.unit || "ขวด",
              quantityUsed: prod.quantityUsed ?? prod.quantity ?? 1,
              actualQuantity: prod.quantityUsed ?? prod.actualQuantity ?? prod.quantity ?? 1,
              extraQuantity: extraQty,
              extraUnit: extraU,
              actualRate: prod.actualRate || prod.applicationRate || "",
              detail: prod.detail || "",
            };
          });
        }
        return [];
      })();

      // Images for this plot
      const plotImages = (p.afterSprayImages || matchedRes?.afterSprayImages || matchedRes?.attachments || []).map(
        (img: any, imgIdx: number) => ({
          id: img.id || `plot-img-${idx}-${imgIdx + 1}`,
          url: img.url || img.fileUrl || "",
          name: img.name || img.fileName || "รูปภาพหลังติดตามแปลง",
          size: img.size || img.fileSize || 0,
          type: img.type || img.mimeType || "image/jpeg",
        }),
      );

      return {
        ...p,
        actualPlotsCount: actualCount,
        daysAfterSpray: daysAfter,
        trackingResult: trackingRes,
        productResponse: prodResponse,
        plotStatus:
          p.plotStatus ||
          matchedRes?.plotStatus ||
          p.type13Target?.status ||
          "IN_PROGRESS",
        closureNotes:
          p.closureNotes ||
          matchedRes?.closureNotes ||
          p.type13Target?.closureNotes ||
          "",
        additionalNotes: notesText,
        products: plotProds,
        afterSprayImages: plotImages,
      };
    });
  }

  actualData.attachments = rawAttachments.filter(
    (att) =>
      att.workTypeCode === "TYPE_14" ||
      att.category === "AFTER_SPRAY" ||
      att.category === "TRACKING_AFTER_SPRAY" ||
      att.category === "type14" ||
      att.category === "PLOT",
  );

  return actualData;
}
