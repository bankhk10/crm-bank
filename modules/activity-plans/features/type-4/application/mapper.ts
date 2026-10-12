import type {
  Type4TargetItem,
  TargetCollectCompanyItem,
  Type4ImageFile,
} from "../types";

/**
 * Extract Type 4 targets from an ActivityPlan (supporting Multi-Target: Billing & Collection Stores)
 */
export function extractType4PlanTargets(
  plan: any,
  prevTarget?: Type4TargetItem,
): {
  primary: Type4TargetItem;
  list: Type4TargetItem[];
} {
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const t4Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_4" || s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  const fallbackItem: Type4TargetItem = {
    customer: "",
    orderNo: "",
    targetCollect: "",
    collectType: "COLLECT",
    targetAmountNum: 0,
    collectAmount: 0,
    actualCollectAmount: null,
    items: [],
    ...prevTarget,
  };

  // 1. Support loading directly from dedicated table ActivityPlanType4Target
  if (plan?.type4Targets && Array.isArray(plan.type4Targets) && plan.type4Targets.length > 0) {
    const list: Type4TargetItem[] = plan.type4Targets.map((t: any, idx: number) => {
      const custDisplay = t.store?.name || "ร้านค้า / ลูกค้า";
      const amtNum = t.targetAmount != null ? Number(t.targetAmount) : 0;
      const targetCollectStr = amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "";
      const collectType = (t.collectType === "BILLING" ? "BILLING" : "COLLECT") as "BILLING" | "COLLECT";

      const companyItem: TargetCollectCompanyItem = {
        id: t.id || `t4-item-${idx}`,
        customer: custDisplay,
        companyName: custDisplay,
        storeId: t.storeId || undefined,
        collectType,
        targetCollect: targetCollectStr,
        targetAmountNum: amtNum,
        detail: t.notes || "",
      };

      return {
        id: t.id || `t4-dedicated-${idx}`,
        customer: custDisplay,
        companyName: custDisplay,
        storeId: t.storeId || undefined,
        storeName: t.store?.name || undefined,
        collectType,
        orderNo: t.invoiceNo || "",
        targetCollect: targetCollectStr,
        targetAmountNum: amtNum,
        collectAmount: amtNum,
        actualCollectAmount: null,
        detail: t.notes || "",
        notes: t.notes || "",
        items: [companyItem],
      };
    });

    // Compute aggregate for primary target if multiple stores exist
    const totalAmount = list.reduce((sum, item) => sum + (item.targetAmountNum || 0), 0);
    const primaryTarget: Type4TargetItem = {
      ...list[0],
      customer: list.map((l) => l.customer).filter(Boolean).join(", "),
      targetCollect: totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : list[0].targetCollect,
      targetAmountNum: totalAmount > 0 ? totalAmount : list[0].targetAmountNum,
      collectAmount: totalAmount > 0 ? totalAmount : list[0].collectAmount,
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  if (t4Stores.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  // 2. Fallback: Stores from generic tables
  const list: Type4TargetItem[] = t4Stores.map((s, idx) => {
    const custDisplay = s.storeName || (s as any).store?.name || "ร้านค้า / ลูกค้า";
    const amtNum = Number(s.targetAmount ?? (s as any).collectAmount) || 0;
    const targetCollectStr = amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "";

    // Determine collectType from remarks or field
    let collectType: "BILLING" | "COLLECT" = "COLLECT";
    const rawType = s.collectType || s.remarks;
    if (rawType === "BILLING" || rawType === "วางบิล") {
      collectType = "BILLING";
    }

    const companyItem: TargetCollectCompanyItem = {
      id: s.id || `t4-legacy-${idx}`,
      customer: custDisplay,
      companyName: custDisplay,
      storeId: s.storeId || undefined,
      collectType,
      targetCollect: targetCollectStr,
      targetAmountNum: amtNum,
      detail: s.notes || "",
    };

    return {
      id: s.id || `t4-store-${idx}`,
      customer: custDisplay,
      companyName: custDisplay,
      storeId: s.storeId || undefined,
      storeName: s.storeName || (s as any).store?.name || undefined,
      collectType,
      orderNo: s.invoiceNo || "",
      targetCollect: targetCollectStr,
      targetAmountNum: amtNum,
      collectAmount: amtNum,
      actualCollectAmount: null,
      detail: s.notes || "",
      notes: s.notes || "",
      items: [companyItem],
    };
  });

  const totalAmount = list.reduce((sum, item) => sum + (item.targetAmountNum || 0), 0);
  const primaryTarget: Type4TargetItem = {
    ...list[0],
    customer: list.map((l) => l.customer).filter(Boolean).join(", "),
    targetCollect: totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : list[0].targetCollect,
    targetAmountNum: totalAmount > 0 ? totalAmount : list[0].targetAmountNum,
    collectAmount: totalAmount > 0 ? totalAmount : list[0].collectAmount,
    items: list.flatMap((l) => l.items || []),
  };

  return {
    primary: primaryTarget,
    list,
  };
}

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
  t4Images?: Type4ImageFile[];
} {
  const result: {
    t4OrderNo?: string;
    t4BillingStatus?: string;
    t4ReceivedAmount?: string;
    t4BillingDetail?: string;
    t4CollectDetail?: string;
    t4Detail?: string;
    t4Images?: Type4ImageFile[];
  } = {};

  if (!resData) return result;

  // 1. Direct from dedicated table ActivityResultType4 if present
  if (resData.type4Result) {
    const t4 = resData.type4Result;
    result.t4OrderNo = t4.orderNo || undefined;
    result.t4BillingStatus = t4.billingStatus || undefined;
    result.t4ReceivedAmount = t4.receivedAmount != null ? String(t4.receivedAmount) : undefined;
    result.t4BillingDetail = t4.billingDetail || undefined;
    result.t4CollectDetail = t4.collectDetail || undefined;
    result.t4Detail = t4.notes || t4.collectDetail || t4.billingDetail || undefined;
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
      if (!result.t4CollectDetail && (result.t4ReceivedAmount || !result.t4BillingStatus)) {
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
        id: a.id || `t4-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
 * Map Type 4 Stores to Section Items for Detail View
 */
export function mapType4ToSectionItems(
  stores: any[],
): Array<{ title: string; subtitle?: string; details?: string; extraFields?: Array<{ label: string; value: string }> }> {
  const type4Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_4" || s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  if (type4Stores.length === 0) {
    return [];
  }

  return type4Stores.map((s) => {
    const custName = s.storeName || (s as any).store?.name || "ร้านค้า / ลูกค้า";
    const amtNum = Number(s.targetAmount ?? (s as any).collectAmount) || 0;
    const isBilling = s.collectType === "BILLING" || s.remarks === "BILLING" || s.remarks === "วางบิล";

    const extraFields: Array<{ label: string; value: string }> = [];
    extraFields.push({
      label: "ประเภทการดำเนินการ",
      value: isBilling ? "วางบิล" : "เก็บเงิน",
    });

    if (amtNum > 0) {
      extraFields.push({
        label: isBilling ? "ยอดเงินตามบิล" : "จำนวนเงินที่ต้องเก็บ",
        value: `${amtNum.toLocaleString()} บาท`,
      });
    }

    if (s.invoiceNo) {
      extraFields.push({
        label: "เลขที่บิล / ใบแจ้งหนี้",
        value: s.invoiceNo,
      });
    }

    if (s.notes) {
      extraFields.push({
        label: "รายละเอียด",
        value: s.notes,
      });
    }

    return {
      title: custName,
      subtitle: isBilling ? "วางบิล" : "เก็บเงิน",
      details: s.notes || undefined,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
    };
  });
}
