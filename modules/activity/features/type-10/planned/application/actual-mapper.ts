import type { Type10ImageFile, Type10SoldProductItem } from "../../shared/types";
import type { Type10ActualRecord } from "../types/actual.types";

/**
 * Pure helper to convert attachment entity to UI ImageFile
 */
function toImage(att: any): Type10ImageFile {
  return {
    id: att.id,
    url: att.fileUrl || att.url,
    name: att.fileName || att.name || "รูปภาพ Field Day",
    size: att.fileSize ?? undefined,
    type: att.fileType ?? undefined,
  };
}

/**
 * Parses raw actual result string/payload into Type 10 Actual Record
 */
export function parseType10ActualResult(
  resultSummary?: string,
  rawPlanOrResult?: any,
): Type10ActualRecord {
  const record: Type10ActualRecord = {};

  const source = rawPlanOrResult?.type10Actual || rawPlanOrResult || {};

  // Extract attendees count
  const directAttendees =
    source.actualAttendees ??
    source.t10ActualAttendees ??
    source.actualAttendeesCount ??
    rawPlanOrResult?.actualAttendeesCount;

  if (directAttendees != null && directAttendees !== "") {
    record.actualAttendees = String(directAttendees);
  } else if (resultSummary) {
    const attendeesMatch = resultSummary.match(
      /(?:จำนวนผู้เข้าร่วมงานจริง|ผู้เข้าร่วมงาน|จำนวนผู้เข้าร่วม)[:\s]+([0-9,]+)/,
    );
    if (attendeesMatch) {
      record.actualAttendees = attendeesMatch[1].replace(/,/g, "");
    }
  }

  // Extract sales / booking
  const directSales =
    source.actualSalesOrBooking ??
    source.t10ActualSalesOrBooking ??
    source.salesResultAmount ??
    source.salesResult ??
    rawPlanOrResult?.salesResultAmount;

  if (directSales != null && directSales !== "") {
    record.actualSalesOrBooking = String(directSales);
  } else if (resultSummary) {
    const salesMatch = resultSummary.match(
      /(?:ยอดขายหรือยอดจองจริง|ยอดขายจริง|ยอดจองจริง)[:\s]+([0-9,.]+)/,
    );
    if (salesMatch) {
      record.actualSalesOrBooking = salesMatch[1].replace(/,/g, "");
    }
  }

  // Extract farmer feedback
  if (source.farmerFeedback) {
    record.farmerFeedback = source.farmerFeedback;
  } else if (resultSummary) {
    const feedbackMatch = resultSummary.match(
      /(?:ผลตอบรับจากเกษตรกร|ความสนใจ|feedback)[:\s]+(สูง|กลาง|ต่ำ)/,
    );
    if (feedbackMatch) {
      record.farmerFeedback = feedbackMatch[1] as any;
    }
  }

  // Extract target farmers list
  if (source.targetFarmersList) {
    record.targetFarmersList = source.targetFarmersList;
  } else if (resultSummary) {
    const farmersMatch = resultSummary.match(
      /(?:รายชื่อเกษตรกร|เกษตรกรเป้าหมาย)[:\s]+([^\n]+)/,
    );
    if (farmersMatch) {
      record.targetFarmersList = farmersMatch[1].trim();
    }
  }

  // Extract sold products
  const rawProducts =
    source.soldProducts ||
    source.productSalesDetails ||
    rawPlanOrResult?.saleItems ||
    rawPlanOrResult?.activityResultSaleItems ||
    [];

  if (Array.isArray(rawProducts) && rawProducts.length > 0) {
    record.soldProducts = rawProducts.map((p: any) => ({
      id: p.id,
      productId: p.productId || null,
      productName: p.productName || p.product?.name || "",
      productCode: p.productCode || p.product?.productCode || null,
      quantity: p.actualQuantity != null ? p.actualQuantity : p.quantity ?? "",
      actualQty: p.actualQuantity != null ? p.actualQuantity : p.actualQty ?? "",
      actualSales: p.actualAmount != null ? p.actualAmount : p.actualSales ?? "",
      unitPrice: p.unitPrice != null ? Number(p.unitPrice) : undefined,
      remarks: p.remarks || null,
    }));
    record.productSalesDetails = record.soldProducts;
  }

  // Extract atmosphere photos
  const rawAttachments =
    source.images ||
    rawPlanOrResult?.attachments ||
    rawPlanOrResult?.result?.attachments ||
    [];

  if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
    record.images = rawAttachments
      .filter(
        (att: any) =>
          att.workTypeCode === "TYPE_10" ||
          att.category === "FIELD_DAY" ||
          att.category === "ATMOSPHERE" ||
          att.category === "PLOT" ||
          att.category === "GENERAL",
      )
      .map(toImage);
  }

  return record;
}
