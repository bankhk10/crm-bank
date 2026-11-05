import type { Type10UnplannedItem } from "../types/unplanned.types";
import { WORK_TYPE_CODE, WORK_TYPE_NAME } from "../../shared/constants";
import { encodeType10Notes } from "../../shared/notes";

/**
 * Hydrates Type 10 Unplanned Items from initial data
 * Checks dedicated relational storage (type10Targets) first.
 */
export function hydrateType10UnplannedData(initialData: any): Type10UnplannedItem[] {
  if (!initialData) return [];

  // 1. Directly provided Type10UnplannedItem[]
  if (Array.isArray(initialData.type10UnplannedItems) && initialData.type10UnplannedItems.length > 0) {
    return initialData.type10UnplannedItems;
  }

  // 2. Dedicated type10Targets
  const dedicatedTargets: any[] =
    initialData.type10Targets ||
    initialData.type10Plots ||
    initialData.type10Data?.targets ||
    [];

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    return dedicatedTargets.map((item, idx) => {
      const targetResult =
        item.result ||
        initialData.type10Results?.find((r: any) => r.targetId === item.id) ||
        initialData.type10Results?.[idx];

      const targetProducts =
        item.products && item.products.length > 0
          ? item.products
          : initialData.type10Products?.filter((p: any) => p.targetId === item.id) || [];

      const sold = targetProducts.map((p: any) => ({
        id: p.id,
        targetId: p.targetId,
        productId: p.productId || null,
        productName: p.productName || p.product?.name || "",
        productCode: p.productCode || p.product?.productCode || null,
        productRole: p.productRole || "TARGET",
        quantity: p.targetQuantity != null ? String(p.targetQuantity) : (p.quantity != null ? String(p.quantity) : ""),
        actualQty: p.actualQuantity != null ? String(p.actualQuantity) : (p.actualQty != null ? String(p.actualQty) : ""),
        actualSales: p.actualTotal != null ? String(p.actualTotal) : (p.actualSales != null ? String(p.actualSales) : ""),
        unitPrice: p.actualUnitPrice != null ? Number(p.actualUnitPrice) : (p.unitPrice != null ? Number(p.unitPrice) : (p.targetUnitPrice != null ? Number(p.targetUnitPrice) : undefined)),
        remarks: p.actualNotes || p.remarks || null,
      }));

      const resolvedDemoPlotId =
        item.type7aTargetId ||
        item.type7aTarget?.id ||
        item.type7aTarget?.activityPlanId ||
        item.demoPlotId ||
        item.plotName ||
        null;

      return {
        id: item.id || `t10-unplanned-${idx + 1}`,
        targetId: item.id,
        demoPlotId: resolvedDemoPlotId,
        plotName: item.plotName || item.type7aTarget?.plotName || item.demoPlot?.name || "",
        farmerName: item.farmerName || item.type7aTarget?.dealerName || item.demoPlot?.ownerName || "",
        location: item.location || item.demoPlot?.location || initialData.location || "",
        province: item.province || item.demoPlot?.province || initialData.province || "",
        district: item.district || item.demoPlot?.district || initialData.district || "",
        cropName: item.cropName || item.cropCategory || item.type7aTarget?.cropName || item.type7aTarget?.cropCategory || item.demoPlot?.cropName || item.demoPlot?.targetCrop || "",
        showcaseProduct: item.showcaseProductName || item.showcaseProduct?.name || item.demoPlot?.primaryProductName || item.demoPlot?.showcase || "",
        showcaseProductId: item.showcaseProductId || null,
        expectedAttendees:
          item.targetAttendeesCount != null
            ? String(item.targetAttendeesCount)
            : item.expectedAttendees != null
              ? String(item.expectedAttendees)
              : "",
        actualAttendees:
          targetResult?.actualAttendeesCount != null
            ? String(targetResult.actualAttendeesCount)
            : item.actualAttendees != null
              ? String(item.actualAttendees)
              : "",
        targetBookingSales:
          item.targetBookingSales != null
            ? String(item.targetBookingSales)
            : "",
        actualSalesOrBooking:
          targetResult?.actualTotalSales != null
            ? String(targetResult.actualTotalSales)
            : item.actualSalesOrBooking != null
              ? String(item.actualSalesOrBooking)
              : "",
        farmerFeedback: targetResult?.farmerFeedback || item.farmerFeedback || "",
        targetFarmersList: targetResult?.targetFarmersList || item.targetFarmersList || "",
        summary: targetResult?.summary || item.summary || "",
        soldProducts: sold,
        notes: item.notes || "",
        images: (initialData.attachments || [])
          .filter(
            (att: any) =>
              att.workTypeCode === "TYPE_10" ||
              att.workTypeCode === "จัดงาน Field Day" ||
              att.category === "FIELD_DAY" ||
              att.category === "ATMOSPHERE" ||
              att.group === "atmosphere" ||
              att.group === "type10",
          )
          .map((att: any) => ({
            id: att.id,
            url: att.fileUrl || att.url,
            name: att.fileName || att.name || "ภาพถ่าย Field Day",
            size: att.fileSize,
            type: att.mimeType,
          })),
      };
    });
  }

  // 3. Fallback to raw t10 events
  const t10 = initialData.type10 || initialData.type10Data;
  if (!t10) return [];

  const rawEvents: any[] = t10.events || (t10.plotName || t10.demoPlotId ? [t10] : []);

  if (rawEvents.length > 0) {
    return rawEvents.map((item, idx) => ({
      id: item.id || `t10-unplanned-${idx + 1}`,
      targetId: item.targetId,
      demoPlotId: item.demoPlotId || null,
      plotName: item.plotName || item.demoPlot?.name || "",
      farmerName: item.farmerName || item.demoPlot?.ownerName || "",
      location: item.location || item.demoPlot?.location || "",
      province: item.province || item.demoPlot?.province || "",
      district: item.district || item.demoPlot?.district || "",
      cropName: item.cropName || item.demoPlot?.cropName || item.demoPlot?.targetCrop || "",
      showcaseProduct: item.showcaseProduct || item.demoPlot?.showcase || item.demoPlot?.productName || "",
      showcaseProductId: item.showcaseProductId || null,
      expectedAttendees: item.expectedAttendees ?? "",
      actualAttendees: item.actualAttendees ?? "",
      targetBookingSales: item.targetBookingSales ?? "",
      actualSalesOrBooking: item.actualSalesOrBooking ?? "",
      farmerFeedback: item.farmerFeedback || "",
      targetFarmersList: item.targetFarmersList || "",
      summary: item.summary || "",
      soldProducts: item.soldProducts || [],
      notes: item.notes || "",
      images: item.images || [],
    }));
  }

  return [];
}

/**
 * Maps Type 10 Unplanned items to payload for saving plan & actual outcome together
 * into activity_type_10_targets, activity_type_10_products, and activity_type_10_result.
 */
export function mapType10UnplannedToPayload(items: Type10UnplannedItem[]) {
  if (!items || items.length === 0) {
    return {
      type10Data: null,
      type10Plots: [],
      type10Targets: [],
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

  const type10Targets = items.map((item) => ({
    id: item.targetId || item.id,
    demoPlotId: item.demoPlotId || null,
    plotName: item.plotName,
    farmerName: item.farmerName,
    location: item.location,
    province: item.province,
    district: item.district,
    cropName: item.cropName,
    showcaseProductName: item.showcaseProduct,
    showcaseProductId: item.showcaseProductId || null,
    targetAttendeesCount: item.expectedAttendees ? Number(item.expectedAttendees) : 0,
    targetBookingSales: item.targetBookingSales ? Number(item.targetBookingSales) : null,
    actualAttendees: item.actualAttendees ? Number(item.actualAttendees) : 0,
    actualSalesOrBooking: item.actualSalesOrBooking ? Number(item.actualSalesOrBooking) : null,
    farmerFeedback: item.farmerFeedback || null,
    targetFarmersList: item.targetFarmersList || null,
    summary: item.summary || item.notes || null,
    notes: item.notes || null,
    soldProducts: item.soldProducts || [],
  }));

  const targets = items.map((item) => ({
    id: item.demoPlotId || item.id,
    demoPlotId: item.demoPlotId || null,
    plot: item.plotName || item.farmerName || WORK_TYPE_NAME,
    plotName: item.plotName,
    location: item.location,
    showcase: item.showcaseProduct,
    crop: item.cropName,
    targetAttendees: item.expectedAttendees ? `${item.expectedAttendees} คน` : undefined,
    targetAttendeesCount: item.expectedAttendees ? Number(item.expectedAttendees) : 0,
    targetSales: item.targetBookingSales ? `฿${Number(item.targetBookingSales).toLocaleString()}` : undefined,
    targetBookingSales: item.targetBookingSales ? Number(item.targetBookingSales) : 0,
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
      targetFarmersList: firstItem.targetFarmersList,
      summary: firstItem.summary || summaryLines.join("\n"),
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
      targetFarmersList: i.targetFarmersList,
      summary: i.summary,
      notes: i.notes,
      soldProducts: i.soldProducts,
    })),
  };

  return {
    workTypeCode: WORK_TYPE_CODE,
    workTypeName: WORK_TYPE_NAME,
    type10Data,
    type10Plots: targets,
    type10Targets,
    type10UnplannedItems: items,
    targets,
    demoPlotVisits,
    actualOutcome,
    planProducts: [],
  };
}
