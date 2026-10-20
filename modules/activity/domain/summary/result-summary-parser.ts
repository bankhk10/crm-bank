import type { ParsedSummaryValues } from "./types";

/**
 * Parses the raw JSON string or ActivityResult object
 * into structured ParsedSummaryValues.
 */
export function parseResultSummary(resData: any): ParsedSummaryValues {
  const result: ParsedSummaryValues = {};

  if (!resData) return result;

  // 1. Direct fields from ActivityResult model / object
  if (typeof resData === "object") {
    if (resData.resultStatus) result.activityResultStatus = resData.resultStatus;
    if (resData.cancelReason) result.cancelReason = resData.cancelReason;
    if (resData.actualStartDate) {
      result.actualStartDate =
        typeof resData.actualStartDate === "string"
          ? resData.actualStartDate.split("T")[0]
          : new Date(resData.actualStartDate).toISOString().split("T")[0];
      result.t7StartDate = result.actualStartDate;
    }
    if (resData.postponedDate) {
      result.postponedDate =
        typeof resData.postponedDate === "string"
          ? resData.postponedDate.split("T")[0]
          : new Date(resData.postponedDate).toISOString().split("T")[0];
    }
    if (resData.postponedTime) result.postponedTime = resData.postponedTime;
    if (resData.postponedReason) result.postponedReason = resData.postponedReason;
    if (resData.postponedNotes) result.postponedNotes = resData.postponedNotes;
  }

  // 2. Parse resultSummary JSON payload (if exists)
  const rawSummary = typeof resData === "string" ? resData : resData?.resultSummary;
  if (rawSummary) {
    try {
      const parsed =
        typeof rawSummary === "string" ? JSON.parse(rawSummary) : rawSummary;
      if (parsed && typeof parsed === "object") {
        Object.assign(result, parsed);
      }
    } catch (err) {
      console.error("Failed to parse resultSummary JSON:", err);
    }
  }

  // 3. Fallback: If resData itself has extra fields, merge them
  if (typeof resData === "object") {
    if (resData.problemFound && !result.problemFound) {
      result.problemFound = resData.problemFound;
    }
    if (resData.nextAction && !result.nextAction) {
      result.nextAction = resData.nextAction;
    }

    // Type 2 Follow-up Results from relation table
    if (
      Array.isArray(resData.followupResults) &&
      resData.followupResults.length > 0 &&
      !result.t2FollowupResults
    ) {
      result.t2FollowupResults = resData.followupResults.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.product?.name || "สินค้า",
        storeId: item.storeId,
        customer:
          item.store?.name || item.customerName || item.customer || "",
        usageResult: item.usageResult as any,
        followupDetail: item.followupDetail || "",
        problemDetail: item.problemDetail || "",
        isAdditional: Boolean(item.isAdditional),
      }));

      const primary: any = result.t2FollowupResults?.[0];
      if (primary) {
        if (!result.t2CustomerName) result.t2CustomerName = primary.customer;
        if (!result.t2UsageResult) result.t2UsageResult = primary.usageResult;
        if (!result.t2FollowupDetail)
          result.t2FollowupDetail = primary.followupDetail;
        if (!result.t2ProblemDetail)
          result.t2ProblemDetail = primary.problemDetail;
        if (!result.t2Detail) result.t2Detail = primary.followupDetail;
      }
    }

    // Type 3 Sale Results from relation table
    if (
      Array.isArray(resData.saleResults) &&
      resData.saleResults.length > 0 &&
      !result.t3ProductSalesDetails
    ) {
      const t3Sales = resData.saleResults.filter(
        (s: any) =>
          !s.workTypeCode ||
          s.workTypeCode === "TYPE_3" ||
          s.workTypeCode === "เสนอขายสินค้า",
      );

      if (t3Sales.length > 0) {
        result.t3ProductSalesDetails = t3Sales.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || item.product?.name || "สินค้า",
          storeId: item.storeId,
          customer:
            item.store?.name || item.customerName || item.customer || "",
          actualQty: item.actualQuantity ?? item.actualQty ?? 0,
          actualSales:
            item.actualTotal != null
              ? Number(item.actualTotal)
              : item.actualSales,
          unitPrice:
            item.actualUnitPrice != null
              ? Number(item.actualUnitPrice)
              : item.unitPrice,
          unclosedReason: item.unclosedReason || "",
          isAdditional: Boolean(item.isAdditional),
        }));

        const totalQty = t3Sales.reduce(
          (sum: number, s: any) => sum + Number(s.actualQuantity ?? 0),
          0,
        );
        const totalSales = t3Sales.reduce(
          (sum: number, s: any) => sum + Number(s.actualTotal ?? 0),
          0,
        );
        const soldProductNames = t3Sales
          .map((s: any) => s.productName || s.product?.name)
          .filter(Boolean);

        if (!result.t3ActualQuantity) result.t3ActualQuantity = totalQty;
        if (!result.t3ActualSales) result.t3ActualSales = String(totalSales);
        if (!result.t3SoldProducts)
          result.t3SoldProducts = Array.from(new Set(soldProductNames)).join(
            ", ",
          );
        if (!result.t3UnclosedReason) {
          const reasons = t3Sales
            .map((s: any) => s.unclosedReason)
            .filter(Boolean);
          if (reasons.length > 0) {
            result.t3UnclosedReason = reasons.join("; ");
          }
        }
      }
    }

    // Type 2 Attachments / Images
    const rawAttachmentsList: any[] = [
      ...(Array.isArray(resData.attachments) ? resData.attachments : []),
      ...(Array.isArray(resData.activityPlan?.attachments)
        ? resData.activityPlan.attachments
        : []),
    ];
    const seenAttIds = new Set<string>();
    const seenAttUrls = new Set<string>();
    const rawAttachments = rawAttachmentsList.filter((att) => {
      if (!att) return false;
      const attId = att.id;
      const attUrl = att.fileUrl || att.url;
      if (attId && seenAttIds.has(attId)) return false;
      if (attUrl && seenAttUrls.has(attUrl)) return false;
      if (attId) seenAttIds.add(attId);
      if (attUrl) seenAttUrls.add(attUrl);
      return true;
    });

    if (rawAttachments.length > 0 && !result.t2Images) {
      result.t2Images = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_2" ||
            att.category === "PLOT" ||
            !att.workTypeCode,
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "รูปภาพ",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }
  }

  return result;
}
