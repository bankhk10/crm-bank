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
      const matchedItem = resultItems.find(
        (ri: any) => (t.storeId && ri.storeId === t.storeId) || ri.companyName === t.store?.name,
      );

      return {
        id: t.id || String(idx + 1),
        storeId: t.storeId || undefined,
        customerName: t.store?.name || "",
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

  // Fallback: Default single item
  return [
    {
      id: "1",
      customerName: "",
      collectType: "COLLECT",
      targetAmount: 0,
      receivedAmount: 0,
      billingStatus: "",
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
    let resolvedStoreId = item.storeId;
    if (!resolvedStoreId && item.customerName) {
      const found = customersList.find((c) => c.name === item.customerName);
      if (found) resolvedStoreId = found.id;
    }

    const isBilling = item.collectType === "BILLING";
    const recAmt = item.receivedAmount != null ? Number(item.receivedAmount) : null;
    const targetAmt =
      item.targetAmount != null
        ? Number(item.targetAmount)
        : recAmt;
    const bStatus = isBilling ? item.billingStatus || "วางบิลสำเร็จ" : null;

    if (!isBilling && recAmt != null) {
      overallReceivedAmount += recAmt;
    }

    if (item.invoiceNo) overallInvoices.push(item.invoiceNo);
    if (bStatus) overallBillingStatuses.push(bStatus);
    if (item.billingDetail) overallBillingDetails.push(item.billingDetail);
    if (item.collectDetail) overallCollectDetails.push(item.collectDetail);
    if (item.notes) overallNotes.push(item.notes);

    // 1. Dedicated Target
    targets.push({
      storeId: resolvedStoreId || null,
      collectType: isBilling ? "BILLING" : "COLLECT",
      targetAmount: targetAmt,
      invoiceNo: item.invoiceNo || null,
      notes: item.notes || null,
    });

    // 2. Generic Plan Store
    planStores.push({
      workTypeCode: "TYPE_4",
      storeId: resolvedStoreId || null,
      storeName: item.customerName || null,
      targetAmount: targetAmt,
      remarks: isBilling ? "BILLING" : "COLLECT",
      notes: item.notes || null,
    });

    // 3. Multi-Item Result
    resultItems.push({
      storeId: resolvedStoreId || null,
      companyName: item.customerName || null,
      collectType: isBilling ? "BILLING" : "COLLECT",
      targetAmount: targetAmt,
      receivedAmount: recAmt,
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
