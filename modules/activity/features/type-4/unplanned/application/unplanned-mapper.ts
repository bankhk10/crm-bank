import type { StoreOption, Type4ImageFile } from "../../shared/types";
import type {
  Type4UnplannedItem,
  Type4UnplannedPayload,
} from "../types/unplanned.types";

/**
 * Hydrates unplanned items (Target Store + Billing / Collect 2-in-1 Outcome) from an ActivityPlan record
 */
export function hydrateType4UnplannedData(plan: any): Type4UnplannedItem[] {
  if (!plan) return [];

  const rawResults: any[] =
    Array.isArray(plan.type4Results)
      ? plan.type4Results
      : Array.isArray(plan.result?.type4Results)
        ? plan.result.type4Results
        : plan.type4Result
          ? [plan.type4Result]
          : [];
  const t4Result = rawResults[0] || plan.type4Result || plan.result?.type4Result;
  const resultItems: any[] =
    rawResults.length > 0 ? rawResults : t4Result?.items || [];
  const attachments: any[] =
    plan.attachments || plan.result?.attachments || [];

  // Extract images for type 4
  const t4Images: Type4ImageFile[] = attachments
    .filter(
      (a: any) =>
        a.workTypeCode === "TYPE_4" ||
        a.workTypeCode === "วางบิล / เก็บเงิน" ||
        a.category === "PAYMENT",
    )
    .map((a: any) => ({
      id: a.id || `att-${Date.now()}`,
      url: a.fileUrl || "",
      name: a.fileName || "เอกสาร",
      size: a.fileSize,
      type: a.mimeType,
      workTypeCode: a.workTypeCode,
      storeId: a.storeId || undefined,
      targetId: a.targetId || undefined,
    }));

  // 1. From dedicated table ActivityPlanType4Target
  if (
    plan.type4Targets &&
    Array.isArray(plan.type4Targets) &&
    plan.type4Targets.length > 0
  ) {
    return plan.type4Targets.map((t: any, idx: number) => {
      const isBilling = t.collectType === "BILLING";
      const matchedItem =
        resultItems.find(
          (ri: any) =>
            (t.storeId && ri.storeId === t.storeId) ||
            (t.store?.name && ri.companyName === t.store?.name),
        ) || resultItems[idx];

      return {
        id: t.id || String(idx + 1),
        storeId: t.storeId || undefined,
        customerName:
          t.store?.name ||
          matchedItem?.companyName ||
          plan.planStores?.[idx]?.storeName ||
          "",
        collectType: isBilling ? "BILLING" : "COLLECT",
        invoiceNo: t.invoiceNo || matchedItem?.invoiceNo || "",
        targetAmount: t.targetAmount != null ? Number(t.targetAmount) : 0,
        receivedAmount:
          matchedItem?.receivedAmount != null
            ? Number(matchedItem.receivedAmount)
            : t4Result?.receivedAmount != null
              ? Number(t4Result.receivedAmount)
              : 0,
        billingStatus:
          matchedItem?.billingStatus ||
          t4Result?.billingStatus ||
          (isBilling ? "วางบิลสำเร็จ" : ""),
        billingDetail:
          matchedItem?.billingDetail || t4Result?.billingDetail || "",
        collectDetail:
          matchedItem?.collectDetail || t4Result?.collectDetail || "",
        notes: t.notes || matchedItem?.notes || t4Result?.notes || "",
        images: t4Images.filter((img) => !img.storeId || img.storeId === t.storeId),
      };
    });
  }

  // 2. From generic stores
  const stores: any[] = plan.planStores || plan.stores || [];
  const t4Stores = stores.filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_4" ||
      s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  if (t4Stores.length > 0) {
    return t4Stores.map((s: any, idx: number) => {
      const isBilling =
        s.collectType === "BILLING" ||
        s.remarks === "BILLING" ||
        s.remarks === "วางบิล";

      const matchedItem = resultItems.find(
        (ri: any) => (s.storeId && ri.storeId === s.storeId) || ri.companyName === s.storeName,
      );

      return {
        id: s.id || String(idx + 1),
        storeId: s.storeId || undefined,
        customerName: s.store?.name || s.storeName || "",
        collectType: isBilling ? "BILLING" : "COLLECT",
        invoiceNo: s.invoiceNo || matchedItem?.invoiceNo || "",
        targetAmount:
          s.targetAmount != null ? Number(s.targetAmount) : 0,
        receivedAmount:
          matchedItem?.receivedAmount != null
            ? Number(matchedItem.receivedAmount)
            : t4Result?.receivedAmount != null
              ? Number(t4Result.receivedAmount)
              : 0,
        billingStatus:
          matchedItem?.billingStatus ||
          t4Result?.billingStatus ||
          (isBilling ? "วางบิลสำเร็จ" : ""),
        billingDetail:
          matchedItem?.billingDetail || t4Result?.billingDetail || "",
        collectDetail:
          matchedItem?.collectDetail || t4Result?.collectDetail || "",
        notes: s.notes || matchedItem?.notes || t4Result?.notes || "",
        images: t4Images.filter((img) => !img.storeId || img.storeId === s.storeId),
      };
    });
  }

  // 3. From result items (ActivityResultType4) if targets were not populated
  if (resultItems && resultItems.length > 0) {
    return resultItems.map((ri: any, idx: number) => {
      const isBilling = ri.collectType === "BILLING";
      return {
        id: ri.id || String(idx + 1),
        storeId: ri.storeId || undefined,
        customerName: ri.companyName || ri.store?.name || "",
        collectType: isBilling ? "BILLING" : "COLLECT",
        invoiceNo: ri.orderNo || "",
        targetAmount: ri.targetAmount != null ? Number(ri.targetAmount) : 0,
        receivedAmount: ri.receivedAmount != null ? Number(ri.receivedAmount) : 0,
        billingStatus: ri.billingStatus || (isBilling ? "วางบิลสำเร็จ" : ""),
        billingDetail: ri.billingDetail || "",
        collectDetail: ri.collectDetail || "",
        notes: ri.notes || "",
        images: t4Images.filter((img) => !img.storeId || img.storeId === ri.storeId),
      };
    });
  }

  // Fallback: Default single item
  return [
    {
      id: "1",
      customerName: "",
      collectType: "COLLECT",
      targetAmount: 0,
      receivedAmount: 0,
      billingStatus: "วางบิลสำเร็จ",
      billingDetail: "",
      collectDetail: "",
      notes: "",
      images: [],
    },
  ];
}

/**
 * Maps Type 4 Unplanned items to database payload for savePlan & saveActual
 */
export function mapType4UnplannedToPayload(
  items: Type4UnplannedItem[],
  customersList: StoreOption[] = [],
): Type4UnplannedPayload {
  const targets: Type4UnplannedPayload["targets"] = [];
  const planStores: Type4UnplannedPayload["planStores"] = [];
  const resultItems: Type4UnplannedPayload["items"] = [];

  let overallReceivedAmount = 0;
  const overallBillingStatuses: string[] = [];
  const overallBillingDetails: string[] = [];
  const overallCollectDetails: string[] = [];
  const overallNotes: string[] = [];
  const overallInvoices: string[] = [];

  items.forEach((item) => {
    const rawCustomer = item.customerName || (item as any).customer || "";
    let resolvedStoreId = item.storeId;
    if (!resolvedStoreId && rawCustomer) {
      const found = customersList.find(
        (c) => c.name === rawCustomer || c.id === rawCustomer,
      );
      if (found) resolvedStoreId = found.id;
    }

    let resolvedCustomerName = rawCustomer;
    if (
      resolvedStoreId &&
      (!resolvedCustomerName || resolvedCustomerName === resolvedStoreId)
    ) {
      const found = customersList.find((c) => c.id === resolvedStoreId);
      if (found) resolvedCustomerName = found.name;
    }

    const invoiceOrOrderNo = item.invoiceNo || (item as any).orderNo || null;
    const isBilling = item.collectType === "BILLING";
    const rawRec =
      item.receivedAmount != null
        ? String(item.receivedAmount).replace(/,/g, "").trim()
        : "";
    const recAmt =
      rawRec !== "" && !isNaN(Number(rawRec)) ? Number(rawRec) : null;
    const rawTarget =
      item.targetAmount != null
        ? String(item.targetAmount).replace(/,/g, "").trim()
        : "";
    const targetAmt =
      rawTarget !== "" && !isNaN(Number(rawTarget))
        ? Number(rawTarget)
        : recAmt;
    const bStatus = isBilling ? item.billingStatus || "วางบิลสำเร็จ" : null;

    if (recAmt != null) {
      overallReceivedAmount += recAmt;
    }

    if (invoiceOrOrderNo) overallInvoices.push(invoiceOrOrderNo);
    if (bStatus) overallBillingStatuses.push(bStatus);
    if (item.billingDetail) overallBillingDetails.push(item.billingDetail);
    if (item.collectDetail) overallCollectDetails.push(item.collectDetail);
    if (item.notes) overallNotes.push(item.notes);

    // 1. Dedicated Target
    targets.push({
      storeId: resolvedStoreId || null,
      storeName: resolvedCustomerName || null,
      collectType: isBilling ? "BILLING" : "COLLECT",
      targetAmount: targetAmt,
      invoiceNo: invoiceOrOrderNo,
      notes: item.notes || null,
    });

    // 2. Multi-Item Result
    resultItems.push({
      storeId: resolvedStoreId || null,
      companyName: resolvedCustomerName || null,
      collectType: isBilling ? "BILLING" : "COLLECT",
      targetAmount: targetAmt,
      receivedAmount: recAmt,
      orderNo: invoiceOrOrderNo,
      invoiceNo: invoiceOrOrderNo,
      billingStatus: bStatus,
      billingDetail: item.billingDetail || null,
      collectDetail: item.collectDetail || null,
      notes: item.notes || null,
    });
  });

  const attachments: Type4UnplannedPayload["attachments"] = items.flatMap((item) => {
    let sId = item.storeId;
    if (!sId && item.customerName) {
      const found = customersList.find((c) => c.name === item.customerName);
      if (found) sId = found.id;
    }

    return (item.images || []).map((img) => ({
      fileUrl: img.url,
      fileName: img.name || "หลักฐานการชำระเงิน",
      fileSize: img.size,
      mimeType: img.type,
      workTypeCode: "TYPE_4",
      category: "PAYMENT",
      storeId: sId || undefined,
    }));
  });

  return {
    targets,
    planStores,
    result: {
      orderNo: overallInvoices.length > 0 ? overallInvoices.join(", ") : null,
      billingStatus:
        overallBillingStatuses.length > 0
          ? overallBillingStatuses.join(", ")
          : null,
      receivedAmount:
        overallReceivedAmount > 0 ? overallReceivedAmount : null,
      billingDetail:
        overallBillingDetails.length > 0
          ? overallBillingDetails.join("\n")
          : null,
      collectDetail:
        overallCollectDetails.length > 0
          ? overallCollectDetails.join("\n")
          : null,
      notes: overallNotes.length > 0 ? overallNotes.join("\n") : null,
    },
    items: resultItems,
    attachments,
  };
}
