import type { Type8ActualRecord } from "../types/actual.types";

/**
 * Parse Type 8 Actual Results from raw backend ActivityResult payload
 */
export function parseType8ActualResult(resData: any): Partial<Type8ActualRecord> {
  const result: Partial<Type8ActualRecord> = {};
  if (!resData) return result;

  const summaryText = resData.resultSummary || "";

  // 1. Direct fields from ActivityResult & Dedicated Tables (activity_type_8_result)
  const dedicatedResult =
    resData.type8Results?.[0] ||
    resData.result?.type8Results?.[0] ||
    resData.type8Targets?.[0]?.result ||
    resData.type8Targets?.find?.((t: any) => t.result)?.result ||
    resData.activityPlan?.type8Results?.[0] ||
    resData.activityPlan?.type8Targets?.[0]?.result ||
    resData.activityPlan?.type8Targets?.find?.((t: any) => t.result)?.result ||
    resData.dedicatedResult ||
    null;

  if (dedicatedResult) {
    if (dedicatedResult.actualAttendeesCount != null && dedicatedResult.actualAttendeesCount !== "") {
      result.t8ActualAttendees = String(dedicatedResult.actualAttendeesCount);
    }
    if (dedicatedResult.feedbackQnA) {
      result.t8FeedbackQnA = dedicatedResult.feedbackQnA;
    }
  }

  if (result.t8ActualAttendees == null || result.t8ActualAttendees === "") {
    const rawAttendees =
      resData.actualAttendeesCount ??
      resData.result?.actualAttendeesCount ??
      resData.activityPlan?.result?.actualAttendeesCount ??
      resData.activityPlan?.actualAttendeesCount ??
      resData.actualAttendees ??
      resData.t8ActualAttendees ??
      resData.type8Actual?.t8ActualAttendees ??
      resData.type8Actual?.actualAttendees;
    if (rawAttendees != null && rawAttendees !== "") {
      const num = Number(rawAttendees);
      result.t8ActualAttendees = isNaN(num) ? String(rawAttendees) : String(num);
    }
  }

  // 1.1 Direct feedbackQnA
  if (!result.t8FeedbackQnA) {
    result.t8FeedbackQnA =
      resData.feedbackQnA ||
      resData.t8FeedbackQnA ||
      resData.type8Actual?.t8FeedbackQnA ||
      resData.type8Actual?.feedbackQnA ||
      resData.activityPlan?.result?.feedbackQnA;
  }

  // 2. Structured Sale Results (Dedicated Table: activity_type_8_products & Legacy saleResults)
  let dedicatedProducts: any[] = [];
  if (Array.isArray(resData.type8Products) && resData.type8Products.length > 0) {
    dedicatedProducts = resData.type8Products;
  } else if (Array.isArray(resData.activityPlan?.type8Products) && resData.activityPlan.type8Products.length > 0) {
    dedicatedProducts = resData.activityPlan.type8Products;
  } else if (Array.isArray(resData.type8Targets) && resData.type8Targets.length > 0) {
    dedicatedProducts = resData.type8Targets.flatMap((t: any) => t.products || []);
  } else if (Array.isArray(resData.activityPlan?.type8Targets) && resData.activityPlan.type8Targets.length > 0) {
    dedicatedProducts = resData.activityPlan.type8Targets.flatMap((t: any) => t.products || []);
  }

  const dedicatedSales = Array.isArray(dedicatedProducts)
    ? dedicatedProducts.filter(
        (p: any) =>
          p.actualQuantity != null ||
          p.actualNotes != null ||
          p.productRole === "ADDITIONAL_SALE" ||
          p.actualTotal != null,
      )
    : [];

  if (dedicatedSales.length > 0) {
    result.t8ProductSalesDetails = dedicatedSales.map((s: any) => ({
      id: s.id,
      productId: s.productId || s.product?.id,
      productName: s.productName || s.product?.name || "",
      actualQty:
        s.actualQuantity != null && s.actualQuantity !== ""
          ? String(isNaN(Number(s.actualQuantity)) ? s.actualQuantity : Number(s.actualQuantity))
          : "",
      actualSales:
        s.actualTotal != null && s.actualTotal !== ""
          ? String(isNaN(Number(s.actualTotal)) ? s.actualTotal : Number(s.actualTotal))
          : "",
      unitPrice: s.actualUnitPrice != null ? Number(s.actualUnitPrice) : undefined,
      notes: s.actualNotes || "",
      isAdditional: s.productRole === "ADDITIONAL_SALE",
    }));
  }

  if (!result.t8ProductSalesDetails) {
    const existingSales =
      resData.t8ProductSalesDetails ||
      resData.productSalesDetails ||
      resData.type8Actual?.t8ProductSalesDetails ||
      resData.type8Actual?.productSalesDetails;
    if (Array.isArray(existingSales) && existingSales.length > 0) {
      result.t8ProductSalesDetails = existingSales;
    }
  }

  // 3. Text Parsing from summaryText
  const t8AttendeesMatch = summaryText.match(
    /(?:จำนวนผู้เข้าร่วมประชุมจริง|จำนวนผู้เข้าร่วมจริง|ผู้เข้าร่วมจริง):\s*([0-9]+)/,
  );
  if (t8AttendeesMatch && t8AttendeesMatch[1] && !result.t8ActualAttendees) {
    result.t8ActualAttendees = t8AttendeesMatch[1].trim();
  }

  const qnaMatch = summaryText.match(/(?:Q&A|ข้อเสนอแนะ):\s*([^|\n]+)/);
  if (qnaMatch && qnaMatch[1] && !result.t8FeedbackQnA) {
    result.t8FeedbackQnA = qnaMatch[1].trim();
  }

  const t8SalesMatch = summaryText.match(
    /(?:ยอดขายแยกสินค้าประชุม|t8ProductSalesDetails):\s*(\[.+\])/,
  );
  if (t8SalesMatch && t8SalesMatch[1] && !result.t8ProductSalesDetails) {
    try {
      const trimmed = t8SalesMatch[1].trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          result.t8ProductSalesDetails = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  const t8ImagesMatch = summaryText.match(
    /(?:รูปภาพบรรยากาศการประชุม|ภาพถ่ายบรรยากาศการประชุม|รูปภาพการประชุม|t8Images):\s*(\[.+\])/,
  );
  if (t8ImagesMatch && t8ImagesMatch[1]) {
    try {
      const parsed = JSON.parse(t8ImagesMatch[1]);
      if (Array.isArray(parsed)) result.t8Images = parsed;
    } catch {
      // ignore
    }
  }

  const t8RegMatch = summaryText.match(
    /(?:รูปใบลงทะเบียนผู้เข้าร่วมงาน|ภาพใบลงทะเบียน|รูปใบลงทะเบียน|t8RegistrationImages):\s*(\[.+\])/,
  );
  if (t8RegMatch && t8RegMatch[1]) {
    try {
      const parsed = JSON.parse(t8RegMatch[1]);
      if (Array.isArray(parsed)) result.t8RegistrationImages = parsed;
    } catch {
      // ignore
    }
  }

  // 4. Attachments fallback
  const rawAtts: any[] = Array.isArray(resData.attachments) ? resData.attachments : [];
  if ((!result.t8Images || result.t8Images.length === 0) && rawAtts.length > 0) {
    const atmos = rawAtts
      .filter(
        (a) =>
          a.workTypeCode === "TYPE_8" &&
          (a.category === "ATMOSPHERE" ||
            a.category === "MEETING" ||
            a.group === "ATMOSPHERE" ||
            a.fileUrl?.includes("/atmosphere/") ||
            a.fileUrl?.includes("/meeting/") ||
            a.fileName?.includes("บรรยากาศ")),
      )
      .map((a) => ({
        id: a.id,
        url: a.fileUrl || a.url,
        name: a.fileName || a.name || "ภาพถ่ายบรรยากาศการประชุม",
        size: a.fileSize || a.size || 0,
        type: a.mimeType || a.type || "image/jpeg",
      }));
    if (atmos.length > 0) {
      result.t8Images = atmos;
    }
  }

  if (
    (!result.t8RegistrationImages || result.t8RegistrationImages.length === 0) &&
    rawAtts.length > 0
  ) {
    const reg = rawAtts
      .filter(
        (a) =>
          a.workTypeCode === "TYPE_8" &&
          (a.category === "REGISTRATION" ||
            a.group === "REGISTRATION" ||
            a.fileUrl?.includes("/registration/") ||
            a.fileName?.includes("ใบลงทะเบียน") ||
            a.fileName?.includes("registration")),
      )
      .map((a) => ({
        id: a.id,
        url: a.fileUrl || a.url,
        name: a.fileName || a.name || "รูปใบลงทะเบียนผู้เข้าร่วมงาน",
        size: a.fileSize || a.size || 0,
        type: a.mimeType || a.type || "image/jpeg",
      }));
    if (reg.length > 0) {
      result.t8RegistrationImages = reg;
    }
  }

  return result;
}
