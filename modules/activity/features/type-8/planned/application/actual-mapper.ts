import type { Type8ActualRecord } from "../types/actual.types";

/**
 * Parse Type 8 Actual Results from raw backend ActivityResult payload
 */
export function parseType8ActualResult(resData: any): Partial<Type8ActualRecord> {
  const result: Partial<Type8ActualRecord> = {};
  if (!resData) return result;

  const summaryText = resData.resultSummary || "";

  // 1. Direct fields from ActivityResult
  if (resData.actualAttendeesCount != null) {
    const num = Number(resData.actualAttendeesCount);
    if (!isNaN(num)) {
      result.t8ActualAttendees = String(num);
    }
  }

  // 2. Structured Sale Results
  if (Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t8Sales = resData.saleResults.filter(
      (s: any) =>
        s.workTypeCode === "TYPE_8_PROMOTION" || s.workTypeCode === "TYPE_8",
    );
    if (t8Sales.length > 0) {
      result.t8ProductSalesDetails = t8Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId,
        productName: s.productName || s.product?.name || "",
        actualQty: String(s.actualQuantity ?? ""),
        notes: s.unclosedReason || s.notes || "",
        isAdditional: Boolean(s.isAdditional),
      }));
    }
  }

  // 3. Text Parsing from summaryText
  const t8AttendeesMatch = summaryText.match(
    /จำนวนผู้เข้าร่วมประชุมจริง:\s*(.+)/,
  );
  if (t8AttendeesMatch && t8AttendeesMatch[1] && !result.t8ActualAttendees) {
    result.t8ActualAttendees = t8AttendeesMatch[1].split("\n")[0].trim();
  }

  const qnaMatch = summaryText.match(/Q&A:\s*(.+)/);
  if (qnaMatch && qnaMatch[1]) {
    result.t8FeedbackQnA = qnaMatch[1].split("\n")[0].trim();
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

  return result;
}
