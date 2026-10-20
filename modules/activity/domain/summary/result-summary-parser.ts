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

    // Type 9 Sale Results from relation table
    if (
      Array.isArray(resData.saleResults) &&
      resData.saleResults.length > 0 &&
      !result.t9ProductSalesDetails
    ) {
      const t9Sales = resData.saleResults.filter(
        (s: any) =>
          s.workTypeCode === "TYPE_9" ||
          s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
      );
      if (t9Sales.length > 0) {
        result.t9ProductSalesDetails = t9Sales.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || item.product?.name || "สินค้า",
          storeId: item.storeId,
          pricePerCase: Number(item.actualUnitPrice || 0),
          quantityCases: Number(item.actualQuantity || 0),
          actualQuantityCases: Number(item.actualQuantity || 0),
          actualSales: Number(item.actualTotal || 0),
          totalAmount: Number(item.actualTotal || 0),
        }));
        const totalSales = t9Sales.reduce(
          (sum: number, s: any) => sum + Number(s.actualTotal || 0),
          0,
        );
        if (totalSales > 0 && !result.t9ActualSales) {
          result.t9ActualSales = String(totalSales);
        }
      }
    }

    // Type 10 Sale Results from relation table
    if (
      Array.isArray(resData.saleResults) &&
      resData.saleResults.length > 0 &&
      !result.t10SoldProducts
    ) {
      const t10Sales = resData.saleResults.filter(
        (s: any) =>
          s.workTypeCode === "TYPE_10" ||
          s.workTypeCode === "จัดงาน Field Day",
      );
      if (t10Sales.length > 0) {
        result.t10SoldProducts = t10Sales.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || item.product?.name || "สินค้า",
          quantity: Number(item.actualQuantity || 1),
          amount: Number(item.actualTotal || 0),
        }));
        const totalSales = t10Sales.reduce(
          (sum: number, s: any) => sum + Number(s.actualTotal || 0),
          0,
        );
        if (totalSales > 0 && !result.t10SalesResult) {
          result.t10SalesResult = String(totalSales);
        }
      }
    }

    // Type 4 Billing / Collect Results from dedicated table or outcome
    if (resData.type4Result || resData.activityResultType4) {
      const t4 = resData.type4Result || resData.activityResultType4;
      if (!result.t4OrderNo && t4.orderNo) result.t4OrderNo = t4.orderNo;
      if (!result.t4BillingStatus && t4.billingStatus)
        result.t4BillingStatus = t4.billingStatus;
      if (!result.t4ReceivedAmount && t4.receivedAmount != null)
        result.t4ReceivedAmount = String(t4.receivedAmount);
      if (!result.t4BillingDetail && t4.billingDetail)
        result.t4BillingDetail = t4.billingDetail;
      if (!result.t4CollectDetail && t4.collectDetail)
        result.t4CollectDetail = t4.collectDetail;
      if (!result.t4Detail && t4.notes) result.t4Detail = t4.notes;

      if (Array.isArray(t4.items) && t4.items.length > 0 && !result.t4Items) {
        result.t4Items = t4.items.map((it: any) => ({
          id: it.id,
          storeId: it.storeId,
          customer: it.companyName || it.store?.name || "",
          companyName: it.companyName || it.store?.name || "",
          collectType: it.collectType || "COLLECT",
          targetAmountNum:
            it.targetAmount != null ? Number(it.targetAmount) : undefined,
          targetCollect:
            it.targetAmount != null
              ? `${Number(it.targetAmount).toLocaleString()} บาท`
              : undefined,
          receivedAmount:
            it.receivedAmount != null ? String(it.receivedAmount) : undefined,
          billingStatus: it.billingStatus || "",
          billingDetail: it.billingDetail || "",
          collectDetail: it.collectDetail || "",
          detail: it.notes || "",
        }));
      }
    }
    if (!result.t4ReceivedAmount && resData.collectResultAmount != null) {
      result.t4ReceivedAmount = String(resData.collectResultAmount);
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

    if (rawAttachments.length > 0 && !result.t4PaymentImages) {
      result.t4PaymentImages = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_4" ||
            att.workTypeCode === "วางบิล / เก็บเงิน" ||
            att.category === "PAYMENT",
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "เอกสารชำระเงิน/วางบิล",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }

    if (rawAttachments.length > 0 && !result.t7InitialPhotos) {
      result.t7InitialPhotos = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_7A" ||
            att.category === "PLOT" ||
            att.category === "INITIAL",
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "รูปถ่ายแปลงสาธิต",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }

    if (rawAttachments.length > 0 && !result.t7CropImages) {
      result.t7CropImages = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_7B" ||
            att.category === "CROP" ||
            att.category === "FOLLOW_UP",
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "รูปถ่ายการติดตามพืช",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }

    if (rawAttachments.length > 0 && !result.t9Images) {
      result.t9Images = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_9" ||
            att.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน" ||
            att.category === "STORE_EVENT",
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "ภาพถ่ายกิจกรรมหน้าร้าน",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }

    if (rawAttachments.length > 0 && !result.t10Images) {
      result.t10Images = rawAttachments
        .filter(
          (att) =>
            att.workTypeCode === "TYPE_10" ||
            att.workTypeCode === "จัดงาน Field Day" ||
            att.category === "FIELD_DAY" ||
            att.category === "ATMOSPHERE",
        )
        .map((att) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "ภาพถ่ายบรรยากาศงาน Field Day",
          size: att.fileSize || att.size || 0,
          type: att.mimeType || att.type || "image/jpeg",
        }));
    }
  }

  return result;
}
