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
 * Parses raw actual result string/payload into Type 10 Actual Record.
 * Supports reading from dedicated tables (type10Results, type10Products, type10Targets)
 * with backward compatibility fallback.
 */
export function parseType10ActualResult(
  resultSummary?: string,
  rawPlanOrResult?: any,
): Type10ActualRecord {
  const record: Type10ActualRecord = {};

  const source = rawPlanOrResult?.type10Actual || rawPlanOrResult || {};

  // 1. Dedicated result table support (activity_type_10_result)
  const dedicatedResult =
    (source.targetId &&
      (rawPlanOrResult?.type10Results?.find(
        (r: any) => r.targetId === source.targetId,
      ) ||
        rawPlanOrResult?.type10Targets?.find(
          (t: any) => t.id === source.targetId,
        )?.result)) ||
    rawPlanOrResult?.type10Results?.[0] ||
    rawPlanOrResult?.type10Targets?.[0]?.result ||
    source.type10Result ||
    source.result;

  if (dedicatedResult) {
    if (dedicatedResult.targetId) {
      record.targetId = dedicatedResult.targetId;
    }
    if (dedicatedResult.actualAttendeesCount != null) {
      record.actualAttendees = String(dedicatedResult.actualAttendeesCount);
    }
    if (dedicatedResult.actualTotalSales != null) {
      record.actualSalesOrBooking = String(dedicatedResult.actualTotalSales);
    }
    if (dedicatedResult.farmerFeedback) {
      record.farmerFeedback = dedicatedResult.farmerFeedback;
    }
    if (dedicatedResult.targetFarmersList) {
      record.targetFarmersList = dedicatedResult.targetFarmersList;
    }
    if (dedicatedResult.summary) {
      record.summary = dedicatedResult.summary;
    }
  }

  // 2. Extract attendees count fallback
  if (!record.actualAttendees) {
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
  }

  // 3. Extract sales / booking fallback
  if (!record.actualSalesOrBooking) {
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
  }

  // 4. Extract farmer feedback fallback
  if (!record.farmerFeedback) {
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
  }

  // 5. Extract target farmers list fallback
  if (!record.targetFarmersList) {
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
  }

  // 6. Extract summary fallback
  if (!record.summary) {
    if (source.summary) {
      record.summary = source.summary;
    } else if (resultSummary) {
      record.summary = resultSummary;
    }
  }

  // 7. Extract sold products from dedicated activity_type_10_products or legacy tables
  const dedicatedProducts =
    rawPlanOrResult?.type10Products ||
    rawPlanOrResult?.type10Targets?.[0]?.products ||
    source.type10Products;

  if (Array.isArray(dedicatedProducts) && dedicatedProducts.length > 0) {
    record.soldProducts = dedicatedProducts
      .filter((p: any) => {
        if (!p) return false;
        // กรองสินค้าจัดแสดง (SHOWCASE) ที่ไม่ได้มีการขายหรือสั่งจองจริงออก
        if (
          p.productRole === "SHOWCASE" &&
          p.actualQuantity == null &&
          p.actualTotal == null &&
          p.actualQty == null &&
          p.actualSales == null
        ) {
          return false;
        }
        return true;
      })
      .map((p: any) => {
        const actualQty =
          p.actualQuantity != null && p.actualQuantity !== ""
            ? String(p.actualQuantity)
            : p.actualQty != null && p.actualQty !== ""
              ? String(p.actualQty)
              : undefined;

        const targetQty =
          p.targetQuantity != null && p.targetQuantity !== ""
            ? String(p.targetQuantity)
            : p.quantity != null && p.quantity !== ""
              ? String(p.quantity)
              : undefined;

        const actualSales =
          p.actualTotal != null && p.actualTotal !== ""
            ? String(p.actualTotal)
            : p.actualSales != null && p.actualSales !== ""
              ? String(p.actualSales)
              : undefined;

        const unitPrice =
          p.actualUnitPrice != null && p.actualUnitPrice !== ""
            ? Number(p.actualUnitPrice)
            : p.targetUnitPrice != null && p.targetUnitPrice !== ""
              ? Number(p.targetUnitPrice)
              : p.unitPrice != null && p.unitPrice !== ""
                ? Number(p.unitPrice)
                : undefined;

        return {
          id: p.id,
          targetId: p.targetId,
          productId: p.productId || null,
          productName: p.productName || p.product?.name || "",
          productCode: p.productCode || p.product?.productCode || null,
          productRole: p.productRole || "TARGET",
          quantity: targetQty,
          actualQty,
          actualQuantity: actualQty,
          actualSales,
          actualTotal: actualSales,
          unitPrice,
          remarks: p.actualNotes || p.remarks || null,
        };
      });
    record.productSalesDetails = record.soldProducts;
  } else {
    // Legacy fallback
    const rawProducts =
      source.soldProducts ||
      source.productSalesDetails ||
      rawPlanOrResult?.saleItems ||
      rawPlanOrResult?.activityResultSaleItems ||
      [];

    if (Array.isArray(rawProducts) && rawProducts.length > 0) {
      record.soldProducts = rawProducts.map((p: any) => {
        const actualQty =
          p.actualQuantity != null && p.actualQuantity !== ""
            ? String(p.actualQuantity)
            : p.actualQty != null && p.actualQty !== ""
              ? String(p.actualQty)
              : undefined;

        const targetQty =
          p.quantity != null && p.quantity !== ""
            ? String(p.quantity)
            : undefined;

        const actualSales =
          p.actualAmount != null && p.actualAmount !== ""
            ? String(p.actualAmount)
            : p.actualSales != null && p.actualSales !== ""
              ? String(p.actualSales)
              : undefined;

        const unitPrice =
          p.unitPrice != null && p.unitPrice !== ""
            ? Number(p.unitPrice)
            : undefined;

        return {
          id: p.id,
          productId: p.productId || null,
          productName: p.productName || p.product?.name || "",
          productCode: p.productCode || p.product?.productCode || null,
          quantity: targetQty,
          actualQty,
          actualQuantity: actualQty,
          actualSales,
          actualTotal: actualSales,
          unitPrice,
          remarks: p.remarks || null,
        };
      });
      record.productSalesDetails = record.soldProducts;
    }
  }

  // 8. Extract atmosphere photos
  const rawAttachments =
    source.images ||
    source.attachments ||
    rawPlanOrResult?.attachments ||
    rawPlanOrResult?.result?.attachments ||
    rawPlanOrResult?.activityPlan?.attachments ||
    [];

  if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
    record.images = rawAttachments
      .filter(
        (att: any) =>
          att.workTypeCode === "TYPE_10" ||
          att.workTypeCode === "จัดงาน Field Day" ||
          att.category === "FIELD_DAY" ||
          att.category === "ATMOSPHERE" ||
          att.category === "PLOT" ||
          att.category === "GENERAL" ||
          att.group === "atmosphere" ||
          att.group === "type10" ||
          att.group === "type10_atmosphere",
      )
      .map(toImage);
  }

  return record;
}
