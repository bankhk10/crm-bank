import type {
  Type6TargetItem,
  TargetIssueItem,
  Type6IssueRecord,
  Type6ImageFile,
} from "../types";

/**
 * Extract Type 6 targets from an ActivityPlan (supporting Multi-Target Complaint / Issue targets)
 */
export function extractType6PlanTargets(
  plan: any,
  prevTarget?: Type6TargetItem,
): {
  primary: Type6TargetItem;
  list: Type6TargetItem[];
} {
  const fallbackItem: Type6TargetItem = {
    customer: "",
    issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
    detail: "",
    targetStatus: "",
    items: [],
    ...prevTarget,
  };

  // 1. Support loading directly from dedicated table ActivityPlanType6Target
  if (plan?.type6Targets && Array.isArray(plan.type6Targets) && plan.type6Targets.length > 0) {
    const list: Type6TargetItem[] = plan.type6Targets.map((t: any, idx: number) => {
      const custName =
        t.customerName ||
        t.store?.name ||
        t.store?.storeName ||
        (t.isManualCustomer ? "ลูกค้าทั่วไป / เกษตรกร" : "ร้านค้าตัวแทนจำหน่าย");
      const issueType = t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
      const detail = t.detail || "";

      const issueItem: TargetIssueItem = {
        customer: custName,
        issueType,
        detail,
      };

      return {
        id: t.id || `t6-target-${idx}`,
        storeId: t.storeId || undefined,
        customer: custName,
        customerName: custName,
        manualCustomerName: t.isManualCustomer ? custName : undefined,
        isManualCustomer: Boolean(t.isManualCustomer),
        issueType,
        detail,
        targetStatus: "รอดำเนินการ",
        items: [issueItem],
      };
    });

    const primaryTarget: Type6TargetItem = {
      ...list[0],
      customer: list.map((l) => l.customer).filter(Boolean).join(", "),
      customerName: list.map((l) => l.customerName).filter(Boolean).join(", "),
      issueType: list[0]?.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail: list.map((l) => l.detail).filter(Boolean).join(" | "),
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // 2. Fallback: Generic stores table (activity_plan_stores)
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const t6Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_6" || s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
  );

  if (t6Stores.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  const list: Type6TargetItem[] = t6Stores.map((s, idx) => {
    const custName =
      (s as any).store?.name ||
      s.storeName ||
      (s.isManualCustomer ? "ลูกค้าทั่วไป / เกษตรกร" : "ร้านค้าตัวแทนจำหน่าย");
    const issueType = s.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
    const detail = s.notes || "";

    const issueItem: TargetIssueItem = {
      customer: custName,
      issueType,
      detail,
    };

    return {
      id: s.id || `t6-target-fallback-${idx}`,
      storeId: s.storeId || undefined,
      customer: custName,
      customerName: custName,
      isManualCustomer: Boolean(s.isManualCustomer || !s.storeId),
      issueType,
      detail,
      targetStatus: "รอดำเนินการ",
      items: [issueItem],
    };
  });

  const primaryTarget: Type6TargetItem = {
    ...list[0],
    customer: list.map((l) => l.customer).filter(Boolean).join(", "),
    customerName: list.map((l) => l.customerName).filter(Boolean).join(", "),
    issueType: list[0]?.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
    detail: list.map((l) => l.detail).filter(Boolean).join(" | "),
    items: list.flatMap((l) => l.items || []),
  };

  return {
    primary: primaryTarget,
    list,
  };
}

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
  } = {};

  if (!resData) return result;

  const allAttachments: any[] = Array.isArray(resData.attachments)
    ? resData.attachments
    : [];

  // 1. Direct from issueResults relation
  if (
    resData.issueResults &&
    Array.isArray(resData.issueResults) &&
    resData.issueResults.length > 0
  ) {
    result.t6IssueDetails = resData.issueResults.map((iss: any) => {
      const itemAttachments =
        Array.isArray(iss.attachments) && iss.attachments.length > 0
          ? iss.attachments
          : allAttachments.filter(
              (att: any) =>
                att.issueItemId === iss.id ||
                (att.workTypeCode === "TYPE_6" && att.category === "ISSUE"),
            );

      const images: Type6ImageFile[] = itemAttachments.map((att: any) => ({
        id: att.id,
        url: att.fileUrl,
        name: att.fileName || "image.jpg",
        size: att.fileSize || undefined,
        type: att.mimeType || undefined,
      }));

      return {
        id: iss.id,
        productId: iss.productId || null,
        productName: iss.product?.name || iss.productName || "",
        lotNumber: iss.lotNumber || "",
        purchaseChannel: iss.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย",
        storeId: iss.storeId || null,
        storeName: iss.store?.name || iss.storeName || "",
        issueType: iss.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: iss.detail || "",
        status: (iss.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น") as "เสร็จสิ้น" | "รอติดตาม",
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
      result.t6IssueType = firstIssue.issueType;
      result.t6Detail = firstIssue.detail;
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

/**
 * Map Type 6 data to Section items for detail view rendering
 */
export function mapType6ToSectionItems(
  parsedResults: any,
  target?: Type6TargetItem,
): Array<{ label: string; value: string; badge?: boolean }> {
  const items: Array<{ label: string; value: string; badge?: boolean }> = [];

  const rec = parsedResults?.t6IssueRecord;

  if (target?.customer || rec?.storeName) {
    items.push({
      label: "ลูกค้า / ร้านค้า",
      value: rec?.storeName || target?.customer || "-",
    });
  }

  if (rec?.issueType || target?.issueType) {
    items.push({
      label: "ประเภทปัญหา",
      value: rec?.issueType || target?.issueType || "-",
      badge: true,
    });
  }

  if (rec?.productName) {
    items.push({
      label: "สินค้าที่พบปัญหา",
      value: rec.productName,
    });
  }

  if (rec?.lotNumber) {
    items.push({
      label: "Lot Number",
      value: rec.lotNumber,
    });
  }

  if (rec?.purchaseChannel) {
    items.push({
      label: "ช่องทางการซื้อ",
      value: rec.purchaseChannel,
    });
  }

  if (rec?.detail || target?.detail) {
    items.push({
      label: "รายละเอียดปัญหา",
      value: rec?.detail || target?.detail || "-",
    });
  }

  if (parsedResults?.t6InitialSolution) {
    items.push({
      label: "แนวทางแก้ไขเบื้องต้น",
      value: parsedResults.t6InitialSolution,
    });
  }

  if (rec?.status || parsedResults?.t6Status) {
    items.push({
      label: "สถานะการแก้ไขปัญหา",
      value: rec?.status || parsedResults?.t6Status || "เสร็จสิ้น",
      badge: true,
    });
  }

  return items;
}
