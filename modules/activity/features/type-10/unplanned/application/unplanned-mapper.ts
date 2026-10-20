import type { Type10UnplannedItem } from "../types/unplanned.types";
import { WORK_TYPE_CODE, WORK_TYPE_NAME } from "../../shared/constants";
import { encodeType10Notes } from "../../shared/notes";

/**
 * Hydrates Type 10 Unplanned Items from initial data
 */
export function hydrateType10UnplannedData(initialData: any): Type10UnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type10UnplannedItems) && initialData.type10UnplannedItems.length > 0) {
    return initialData.type10UnplannedItems;
  }

  const t10 = initialData.type10 || initialData.type10Data;
  if (!t10) return [];

  const rawEvents: any[] = t10.events || (t10.plotName || t10.demoPlotId ? [t10] : []);

  if (rawEvents.length > 0) {
    return rawEvents.map((item, idx) => ({
      id: item.id || `t10-unplanned-${idx + 1}`,
      demoPlotId: item.demoPlotId || null,
      plotName: item.plotName || item.demoPlot?.name || "",
      farmerName: item.farmerName || item.demoPlot?.ownerName || "",
      location: item.location || item.demoPlot?.location || "",
      cropName: item.cropName || item.demoPlot?.cropName || item.demoPlot?.targetCrop || "",
      showcaseProduct: item.showcaseProduct || item.demoPlot?.showcase || item.demoPlot?.productName || "",
      expectedAttendees: item.expectedAttendees ?? "",
      actualAttendees: item.actualAttendees ?? "",
      targetBookingSales: item.targetBookingSales ?? "",
      actualSalesOrBooking: item.actualSalesOrBooking ?? "",
      farmerFeedback: item.farmerFeedback || "",
      soldProducts: item.soldProducts || [],
      notes: item.notes || "",
      images: item.images || [],
    }));
  }

  return [];
}

/**
 * Maps Type 10 Unplanned items to payload for saving plan & actual outcome together
 */
export function mapType10UnplannedToPayload(items: Type10UnplannedItem[]) {
  if (!items || items.length === 0) {
    return {
      type10Data: null,
      type10Plots: [],
      actualOutcome: null,
      planProducts: [],
      targets: [],
      demoPlotVisits: [],
    };
  }

  const firstItem = items[0];

  const demoPlotVisits = items
    .filter((i) => Boolean(i.demoPlotId))
    .map((item) => ({
      demoPlotId: item.demoPlotId!,
      workTypeCode: WORK_TYPE_CODE,
      notes: encodeType10Notes(item.notes || "", {
        showcase: item.showcaseProduct,
        targetCrop: item.cropName,
      }),
    }));

  const targets = items.map((item) => ({
    id: item.demoPlotId || item.id,
    demoPlotId: item.demoPlotId || null,
    plot: item.plotName || item.farmerName || WORK_TYPE_NAME,
    location: item.location,
    showcase: item.showcaseProduct,
    crop: item.cropName,
    targetAttendees: item.expectedAttendees ? `${item.expectedAttendees} คน` : undefined,
    targetSales: item.targetBookingSales ? `฿${Number(item.targetBookingSales).toLocaleString()}` : undefined,
    actualAttendees: item.actualAttendees,
    actualSalesOrBooking: item.actualSalesOrBooking,
    farmerFeedback: item.farmerFeedback,
    soldProducts: item.soldProducts,
  }));

  const summaryLines: string[] = [
    `บันทึกผลการจัดงาน Field Day (นอกแผน)`,
    `แปลงสาธิต / สถานที่: ${items.map((i) => i.plotName || i.location || "แปลงสาธิต").join(", ")}`,
  ];

  if (firstItem.actualAttendees) {
    summaryLines.push(`จำนวนผู้เข้าร่วมงานจริง: ${firstItem.actualAttendees} คน`);
  }
  if (firstItem.actualSalesOrBooking) {
    summaryLines.push(`ยอดขาย/ยอดจองจริง: ฿${Number(firstItem.actualSalesOrBooking).toLocaleString()}`);
  }
  if (firstItem.farmerFeedback) {
    summaryLines.push(`ผลตอบรับจากเกษตรกร: ${firstItem.farmerFeedback}`);
  }
  if (firstItem.showcaseProduct) {
    summaryLines.push(`สินค้าจัดแสดง: ${firstItem.showcaseProduct}`);
  }

  const allImages = items.flatMap((i) => i.images || []);
  const allSoldProducts = items.flatMap((i) => i.soldProducts || []);

  const actualOutcome = {
    resultStatus: "COMPLETED",
    resultSummary: summaryLines.join("\n"),
    actualAttendeesCount: firstItem.actualAttendees ? Number(firstItem.actualAttendees) : null,
    salesResultAmount: firstItem.actualSalesOrBooking ? Number(firstItem.actualSalesOrBooking) : null,
    attachments: allImages.map((img) => ({
      category: "FIELD_DAY",
      fileUrl: img.url,
      fileName: img.name || "ภาพถ่าย Field Day",
      fileSize: (img as any).size || 0,
      mimeType: (img as any).type || "image/jpeg",
      workTypeCode: WORK_TYPE_CODE,
    })),
    saleResults: allSoldProducts.map((p) => ({
      productId: p.productId || null,
      productName: p.productName,
      actualQuantity: Number(p.quantity || p.actualQty || 1),
      actualUnitPrice: Number(p.unitPrice || 0),
      actualTotal: Number(p.amount || p.actualSales || 0),
      workTypeCode: WORK_TYPE_CODE,
    })),
    type10Actual: {
      actualAttendees: firstItem.actualAttendees,
      actualSalesOrBooking: firstItem.actualSalesOrBooking,
      farmerFeedback: firstItem.farmerFeedback,
      soldProducts: allSoldProducts,
      images: allImages,
    },
  };

  const type10Data = {
    events: items.map((i) => ({
      demoPlotId: i.demoPlotId,
      plotName: i.plotName,
      farmerName: i.farmerName,
      location: i.location,
      cropName: i.cropName,
      showcaseProduct: i.showcaseProduct,
      expectedAttendees: i.expectedAttendees,
      actualAttendees: i.actualAttendees,
      targetBookingSales: i.targetBookingSales,
      actualSalesOrBooking: i.actualSalesOrBooking,
      farmerFeedback: i.farmerFeedback,
      notes: i.notes,
      soldProducts: i.soldProducts,
    })),
  };

  return {
    workTypeCode: WORK_TYPE_CODE,
    workTypeName: WORK_TYPE_NAME,
    type10Data,
    type10Plots: targets,
    targets,
    demoPlotVisits,
    actualOutcome,
    planProducts: [],
  };
}
