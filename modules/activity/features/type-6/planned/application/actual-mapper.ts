import type {
  Type6IssueRecord,
  Type6ImageFile,
} from "../../shared/types";

/**
 * Parse Type 6 Actual Results from raw backend ActivityResult payload
 */
export function parseType6ActualResult(resData: any): {
  t6IssueDetails?: Type6IssueRecord[];
  t6IssueRecord?: Type6IssueRecord;
  t6ProductId?: string | null;
  t6ProductName?: string | null;
  t6LotNumber?: string | null;
  t6PurchaseChannel?: string;
  t6StoreId?: string | null;
  t6StoreName?: string | null;
  t6IssueType?: string;
  t6Detail?: string | null;
  t6Status?: "เสร็จสิ้น" | "รอติดตาม";
  t6Images?: Type6ImageFile[];
  t6ProblemDetail?: string;
  t6InitialSolution?: string;
  t6NextAction?: string;
} {
  const result: {
    t6IssueDetails?: Type6IssueRecord[];
    t6IssueRecord?: Type6IssueRecord;
    t6ProductId?: string | null;
    t6ProductName?: string | null;
    t6LotNumber?: string | null;
    t6PurchaseChannel?: string;
    t6StoreId?: string | null;
    t6StoreName?: string | null;
    t6IssueType?: string;
    t6Detail?: string | null;
    t6Status?: "เสร็จสิ้น" | "รอติดตาม";
    t6Images?: Type6ImageFile[];
    t6ProblemDetail?: string;
    t6InitialSolution?: string;
    t6NextAction?: string;
  } = {};

  if (!resData) return result;

  const allAttachments: any[] =
    Array.isArray(resData.attachments) && resData.attachments.length > 0
      ? resData.attachments
      : Array.isArray(resData.result?.attachments) &&
          resData.result.attachments.length > 0
        ? resData.result.attachments
        : Array.isArray(resData.activityPlan?.attachments) &&
            resData.activityPlan.attachments.length > 0
          ? resData.activityPlan.attachments
          : [];

  const rawIssueResults: any[] =
    Array.isArray(resData.type6Results) && resData.type6Results.length > 0
      ? resData.type6Results
      : Array.isArray(resData.result?.type6Results) &&
          resData.result.type6Results.length > 0
        ? resData.result.type6Results
        : Array.isArray(resData.activityPlan?.type6Results) &&
            resData.activityPlan.type6Results.length > 0
          ? resData.activityPlan.type6Results
          : Array.isArray(resData.issueResults) && resData.issueResults.length > 0
            ? resData.issueResults
            : Array.isArray(resData.result?.issueResults) &&
                resData.result.issueResults.length > 0
              ? resData.result.issueResults
              : Array.isArray(resData.activityPlan?.result?.issueResults) &&
                  resData.activityPlan.result.issueResults.length > 0
                ? resData.activityPlan.result.issueResults
                : Array.isArray(resData.t6IssueDetails) &&
                    resData.t6IssueDetails.length > 0
                  ? resData.t6IssueDetails
                  : [];

  // 1. Direct from issueResults or type6Results relation
  if (rawIssueResults.length > 0) {
    result.t6IssueDetails = rawIssueResults.map((iss: any) => {
      let itemAttachments =
        Array.isArray(iss.attachments) && iss.attachments.length > 0
          ? iss.attachments
          : allAttachments.filter(
              (att: any) =>
                att.type6ResultId === iss.id ||
                att.issueItemId === iss.id ||
                (att.workTypeCode === "TYPE_6" && att.category === "ISSUE") ||
                att.category === "ISSUE",
            );

      const images: Type6ImageFile[] = itemAttachments.map((att: any) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "image.jpg",
        size: att.fileSize || att.size || undefined,
        type: att.mimeType || att.type || undefined,
      }));

      const isManual =
        iss.isManualCustomer != null
          ? Boolean(iss.isManualCustomer)
          : !iss.storeId;
      const custName =
        iss.customerName || iss.store?.name || iss.storeName || "";

      return {
        id: iss.id,
        targetId: iss.targetId || undefined,
        productId: iss.productId || null,
        productName: iss.product?.name || iss.productName || "",
        lotNumber: iss.lotNumber || "",
        purchaseChannel: iss.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        storeId: isManual ? null : iss.storeId || null,
        storeName: custName,
        customerName: custName,
        isManualCustomer: isManual,
        issueType: iss.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: iss.detail || "",
        status: (iss.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น") as "เสร็จสิ้น" | "รอติดตาม",
        problemFound: iss.problemFound || iss.detail || null,
        initialSolution: iss.initialSolution || null,
        nextAction: iss.nextAction || null,
        images,
      };
    });

    const firstIssue = result.t6IssueDetails?.[0];
    if (firstIssue) {
      result.t6IssueRecord = firstIssue;
      result.t6ProductId = firstIssue.productId;
      result.t6ProductName = firstIssue.productName;
      result.t6LotNumber = firstIssue.lotNumber;
      result.t6PurchaseChannel = firstIssue.purchaseChannel;
      result.t6StoreId = firstIssue.storeId;
      result.t6StoreName = firstIssue.storeName;
      result.t6IssueType = firstIssue.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
      result.t6Detail = firstIssue.detail || firstIssue.problemFound || "";
      result.t6ProblemDetail = firstIssue.problemFound || firstIssue.detail || "";
      result.t6InitialSolution = firstIssue.initialSolution || "";
      result.t6NextAction = firstIssue.nextAction || "";
      result.t6Status = firstIssue.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น";
      if (firstIssue.images && firstIssue.images.length > 0) {
        result.t6Images = firstIssue.images;
      }
    }
  }

  // Attachments fallback if issueResults didn't have images
  if (
    (!result.t6Images || result.t6Images.length === 0) &&
    allAttachments.length > 0
  ) {
    const t6Att = allAttachments.filter(
      (att: any) =>
        att.workTypeCode === "TYPE_6" ||
        att.category === "ISSUE" ||
        att.issueItemId,
    );
    if (t6Att.length > 0) {
      result.t6Images = t6Att.map((att: any) => ({
        id: att.id,
        url: att.fileUrl,
        name: att.fileName || "image.jpg",
        size: att.fileSize || undefined,
        type: att.mimeType || undefined,
      }));
    }
  }

  // 2. Summary text regex parsing (fallback for historical records)
  const summaryText = resData.resultSummary || resData.actualSummary || "";
  if (summaryText) {
    const t6ProbMatch = summaryText.match(/ปัญหาลูกค้าร้องเรียน:\s*(.+)/);
    if (t6ProbMatch && t6ProbMatch[1]) {
      result.t6ProblemDetail = t6ProbMatch[1].split("\n")[0].trim();
      if (!result.t6Detail) result.t6Detail = result.t6ProblemDetail;
    }

    const t6SolMatch = summaryText.match(/แนวทางแก้ไขเบื้องต้น:\s*(.+)/);
    if (t6SolMatch && t6SolMatch[1]) {
      result.t6InitialSolution = t6SolMatch[1].split("\n")[0].trim();
    }

    const t6StatusMatch = summaryText.match(/สถานะการแก้ปัญหา:\s*(.+)/);
    if (t6StatusMatch && t6StatusMatch[1]) {
      const sVal = t6StatusMatch[1].split("\n")[0].trim();
      if (sVal === "เสร็จสิ้น" || sVal === "รอติดตาม") {
        result.t6Status = sVal;
      }
    }

    const t6ImagesMatch = summaryText.match(
      /(?:รูปภาพปัญหา(?:\/การแก้ไข)?|ภาพถ่ายปัญหา|t6Images):\s*(\[.+\])/,
    );
    if (t6ImagesMatch && t6ImagesMatch[1] && (!result.t6Images || result.t6Images.length === 0)) {
      try {
        const parsed = JSON.parse(t6ImagesMatch[1]);
        if (Array.isArray(parsed)) result.t6Images = parsed;
      } catch (e) {
        console.error("Failed to parse t6Images JSON:", e);
      }
    }

    if (
      !result.t6IssueRecord &&
      (result.t6ProblemDetail || resData.problemFound || result.t6Status)
    ) {
      result.t6IssueRecord = {
        productName: "",
        lotNumber: "",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        storeName: "",
        issueType: "อื่นๆ ระบุ",
        detail: result.t6ProblemDetail || resData.problemFound || "",
        status: result.t6Status || "เสร็จสิ้น",
        images: result.t6Images || [],
      };
    }
  }

  return result;
}
