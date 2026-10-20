import type {
  Type4ActualData,
  TargetCollectCompanyItem,
} from "../types/actual.types";
import type { Type4ImageFile } from "../../shared/types";

/**
 * Parse Type 4 Actual Results from raw backend ActivityResult payload
 */
export function parseType4ActualResult(resData: any): {
  t4OrderNo?: string;
  t4BillingStatus?: string;
  t4ReceivedAmount?: string;
  t4BillingDetail?: string;
  t4CollectDetail?: string;
  t4Detail?: string;
  t4Items?: TargetCollectCompanyItem[];
  t4Images?: Type4ImageFile[];
} {
  const result: {
    t4OrderNo?: string;
    t4BillingStatus?: string;
    t4ReceivedAmount?: string;
    t4BillingDetail?: string;
    t4CollectDetail?: string;
    t4Detail?: string;
    t4Items?: TargetCollectCompanyItem[];
    t4Images?: Type4ImageFile[];
  } = {};

  if (!resData) return result;

  // 1. Direct from dedicated table ActivityResultType4 if present
  if (resData.type4Result) {
    const t4 = resData.type4Result;
    result.t4OrderNo = t4.orderNo || undefined;
    result.t4BillingStatus = t4.billingStatus || undefined;
    result.t4ReceivedAmount =
      t4.receivedAmount != null ? String(t4.receivedAmount) : undefined;
    result.t4BillingDetail = t4.billingDetail || undefined;
    result.t4CollectDetail = t4.collectDetail || undefined;
    result.t4Detail =
      t4.notes || t4.collectDetail || t4.billingDetail || undefined;

    if (t4.items && Array.isArray(t4.items) && t4.items.length > 0) {
      result.t4Items = t4.items.map((it: any) => ({
        id: it.id,
        storeId: it.storeId || undefined,
        customer: it.companyName || it.store?.name || undefined,
        companyName: it.companyName || it.store?.name || "ร้านค้า / ลูกค้า",
        collectType: (it.collectType === "BILLING" ? "BILLING" : "COLLECT") as
          | "BILLING"
          | "COLLECT",
        targetAmountNum: it.targetAmount != null ? Number(it.targetAmount) : undefined,
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

  // 2. Fallback: Parse from actualSummary text
  const summaryText = resData.actualSummary || "";
  if (summaryText) {
    const orderNoMatch = summaryText.match(/เลขที่บิล\/ใบแจ้งหนี้:\s*(.+)/);
    if (orderNoMatch && orderNoMatch[1] && !result.t4OrderNo) {
      result.t4OrderNo = orderNoMatch[1].split("\n")[0].trim();
    }

    const billingStatusMatch = summaryText.match(/สถานะการวางบิล:\s*(.+)/);
    if (billingStatusMatch && billingStatusMatch[1] && !result.t4BillingStatus) {
      result.t4BillingStatus = billingStatusMatch[1].split("\n")[0].trim();
    }

    const receivedMatch = summaryText.match(/ยอดเงินที่เก็บได้จริง:\s*(.+)/);
    if (receivedMatch && receivedMatch[1] && !result.t4ReceivedAmount) {
      result.t4ReceivedAmount = receivedMatch[1].split("\n")[0].trim();
    }

    const billingDetailMatch = summaryText.match(
      /(?:รายละเอียดเพิ่มเติม\s*\(วางบิล\)|รายละเอียดการวางบิล):\s*(.+)/,
    );
    if (billingDetailMatch && billingDetailMatch[1] && !result.t4BillingDetail) {
      result.t4BillingDetail = billingDetailMatch[1].split("\n")[0].trim();
    }

    const collectDetailMatch = summaryText.match(
      /(?:รายละเอียดเพิ่มเติม\s*\(เก็บเงิน\)|รายละเอียดการเก็บเงิน):\s*(.+)/,
    );
    if (collectDetailMatch && collectDetailMatch[1] && !result.t4CollectDetail) {
      result.t4CollectDetail = collectDetailMatch[1].split("\n")[0].trim();
    }

    const t4DetailMatch = summaryText.match(
      /(?:รายละเอียดเพิ่มเติม\s*\(วางบิล\/เก็บเงิน\)|รายละเอียดเพิ่มเติม):\s*(.+)/,
    );
    if (t4DetailMatch && t4DetailMatch[1] && !result.t4Detail) {
      const legacyVal = t4DetailMatch[1].split("\n")[0].trim();
      result.t4Detail = legacyVal;
      if (!result.t4BillingDetail && result.t4BillingStatus) {
        result.t4BillingDetail = legacyVal;
      }
      if (
        !result.t4CollectDetail &&
        (result.t4ReceivedAmount || !result.t4BillingStatus)
      ) {
        result.t4CollectDetail = legacyVal;
      }
    }
  }

  // Fallback: check collectResultAmount on activityResult directly
  if (!result.t4ReceivedAmount && resData.collectResultAmount != null) {
    result.t4ReceivedAmount = String(resData.collectResultAmount);
  }

  // 3. Attachments (receipts, slips, bills)
  if (resData.attachments && Array.isArray(resData.attachments)) {
    const t4Att = resData.attachments.filter(
      (a: any) =>
        a.workTypeCode === "TYPE_4" ||
        a.workTypeCode === "วางบิล / เก็บเงิน" ||
        a.category === "PAYMENT",
    );
    if (t4Att.length > 0) {
      result.t4Images = t4Att.map((a: any) => ({
        id:
          a.id ||
          `t4-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: a.fileUrl || "",
        name: a.fileName || "เอกสารชำระเงิน/วางบิล",
        size: a.fileSize || undefined,
        type: a.mimeType || undefined,
        workTypeCode: a.workTypeCode,
        storeId: a.storeId || undefined,
        targetId: a.targetId || undefined,
      }));
    }
  }

  return result;
}

/**
 * Maps actual form data to database payload for saveActual
 */
export function mapType4ActualFormToDb(
  actualData: Type4ActualData,
  activityPlanId: string,
): {
  activityPlanId: string;
  orderNo?: string | null;
  billingStatus?: string | null;
  receivedAmount?: number | null;
  billingDetail?: string | null;
  collectDetail?: string | null;
  notes?: string | null;
  items: Array<{
    storeId?: string | null;
    companyName?: string | null;
    collectType: "BILLING" | "COLLECT";
    targetAmount?: number | null;
    receivedAmount?: number | null;
    billingStatus?: string | null;
    billingDetail?: string | null;
    collectDetail?: string | null;
    notes?: string | null;
  }>;
} {
  const recAmt =
    actualData.receivedAmount != null && actualData.receivedAmount.trim() !== ""
      ? Number(actualData.receivedAmount.replace(/,/g, ""))
      : null;

  const items = (actualData.items || []).map((it) => {
    const itemRec =
      it.receivedAmount != null && it.receivedAmount.trim() !== ""
        ? Number(it.receivedAmount.replace(/,/g, ""))
        : null;

    return {
      storeId: it.storeId || null,
      companyName: it.companyName || it.customer || null,
      collectType: (it.collectType === "BILLING" ? "BILLING" : "COLLECT") as
        | "BILLING"
        | "COLLECT",
      targetAmount: it.targetAmountNum != null ? Number(it.targetAmountNum) : null,
      receivedAmount: itemRec,
      billingStatus: it.billingStatus || null,
      billingDetail: it.billingDetail || null,
      collectDetail: it.collectDetail || null,
      notes: it.detail || null,
    };
  });

  return {
    activityPlanId,
    orderNo: actualData.orderNo || null,
    billingStatus: actualData.billingStatus || null,
    receivedAmount: recAmt,
    billingDetail: actualData.billingDetail || null,
    collectDetail: actualData.collectDetail || null,
    notes: actualData.notes || null,
    items,
  };
}
