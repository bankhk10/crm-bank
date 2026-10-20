import type { Type14DetailData, Type14DetailProps } from "../types/actual.types";
import type { Type14SprayRoundState } from "../../shared/types";

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
    attachments: [],
  };

  const rawRounds: any[] =
    payloadToHydrate.type14Actual?.rounds ||
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
      name: img.name || img.fileName || "รูปภาพหลังฉีดพ่น",
      size: img.size || img.fileSize || 0,
      type: img.type || img.mimeType || "image/jpeg",
    })),
    products: (r.products || []).map((p: any) => ({
      productId: p.productId,
      productName: p.productName || p.product?.name || "",
      unit: p.unit || p.product?.unit || "ขวด",
      quantityUsed: p.quantityUsed ?? p.quantity ?? "",
      actualRate: p.actualRate || p.applicationRate || "",
      detail: p.detail || "",
    })),
  }));

  actualData.rounds = mappedRounds;
  actualData.sprayRounds = mappedRounds;
  actualData.attachments = rawAttachments.filter(
    (att) =>
      att.workTypeCode === "TYPE_14" ||
      att.category === "AFTER_SPRAY" ||
      att.category === "TRACKING_AFTER_SPRAY" ||
      att.category === "type14",
  );

  return actualData;
}
