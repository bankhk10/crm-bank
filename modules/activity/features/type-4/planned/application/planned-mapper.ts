import type {
  Type4TargetItem,
  TargetCollectCompanyItem,
  Type4CollectItem,
} from "../types/planned.types";
import type { StoreOption } from "../../shared/types";

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
  if (
    plan?.type4Targets &&
    Array.isArray(plan.type4Targets) &&
    plan.type4Targets.length > 0
  ) {
    const list: Type4TargetItem[] = plan.type4Targets.map(
      (t: any, idx: number) => {
        const custDisplay = t.store?.name || "ร้านค้า / ลูกค้า";
        const amtNum = t.targetAmount != null ? Number(t.targetAmount) : 0;
        const targetCollectStr =
          amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "";
        const collectType = (
          t.collectType === "BILLING" ? "BILLING" : "COLLECT"
        ) as "BILLING" | "COLLECT";

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
      },
    );

    // Compute aggregate for primary target if multiple stores exist
    const totalAmount = list.reduce(
      (sum, item) => sum + (item.targetAmountNum || 0),
      0,
    );
    const primaryTarget: Type4TargetItem = {
      ...list[0],
      customer: list
        .map((l) => l.customer)
        .filter(Boolean)
        .join(", "),
      targetCollect:
        totalAmount > 0
          ? `${totalAmount.toLocaleString()} บาท`
          : list[0].targetCollect,
      targetAmountNum: totalAmount > 0 ? totalAmount : list[0].targetAmountNum,
      collectAmount: totalAmount > 0 ? totalAmount : list[0].collectAmount,
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // 2. Fallback: Stores from generic tables
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const t4Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_4" ||
      s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  if (t4Stores.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  const list: Type4TargetItem[] = t4Stores.map((s, idx) => {
    const custDisplay =
      s.storeName || (s as any).store?.name || "ร้านค้า / ลูกค้า";
    const amtNum = Number(s.targetAmount ?? (s as any).collectAmount) || 0;
    const targetCollectStr =
      amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "";

    let collectType: "BILLING" | "COLLECT" = "COLLECT";
    const rawType = s.collectType || s.remarks;
    if (rawType === "BILLING" || rawType === "วางบิล") {
      collectType = "BILLING";
    }

    const companyItem: TargetCollectCompanyItem = {
      id: s.id || `t4-store-${idx}`,
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

  const totalAmount = list.reduce(
    (sum, item) => sum + (item.targetAmountNum || 0),
    0,
  );
  const primaryTarget: Type4TargetItem = {
    ...list[0],
    customer: list
      .map((l) => l.customer)
      .filter(Boolean)
      .join(", "),
    targetCollect:
      totalAmount > 0
        ? `${totalAmount.toLocaleString()} บาท`
        : list[0].targetCollect,
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
 * Hydrate Type 4 form items from existing ActivityPlan data when editing
 */
export function hydrateType4PlannedData(plan: any): Type4CollectItem[] {
  if (!plan) return [];

  // 1. From dedicated table ActivityPlanType4Target
  if (
    plan.type4Targets &&
    Array.isArray(plan.type4Targets) &&
    plan.type4Targets.length > 0
  ) {
    return plan.type4Targets.map((t: any, idx: number) => ({
      id: t.id || String(idx + 1),
      collectType: (t.collectType === "BILLING" ? "BILLING" : "COLLECT") as
        | "BILLING"
        | "COLLECT",
      storeId: t.storeId || undefined,
      customerName: t.store?.name || "",
      collectAmount: t.targetAmount != null ? Number(t.targetAmount) : 0,
      detail: t.notes || "",
      invoiceNo: t.invoiceNo || "",
    }));
  }

  // 2. From generic stores
  const stores: any[] = plan.planStores || plan.stores || [];
  const t4Stores = stores.filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_4" ||
      s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  if (t4Stores.length === 0) {
    return [];
  }

  return t4Stores.map((s: any, idx: number) => {
    const isBilling =
      s.collectType === "BILLING" ||
      s.remarks === "BILLING" ||
      s.remarks === "วางบิล";

    return {
      id: s.id || String(idx + 1),
      collectType: isBilling ? "BILLING" : "COLLECT",
      storeId: s.storeId || undefined,
      customerName: s.store?.name || s.storeName || "",
      collectAmount:
        s.targetAmount != null
          ? Number(s.targetAmount)
          : s.collectAmount != null
            ? Number(s.collectAmount)
            : 0,
      detail: s.notes || s.detail || "",
      invoiceNo: s.invoiceNo || s.orderNo || "",
    };
  });
}

/**
 * Map Form State items to Payload for Server Actions
 */
export function mapType4FormToPayload(
  items: Type4CollectItem[],
  customers: StoreOption[] = [],
): {
  type4Targets: any[];
  planStores: any[];
} {
  const type4Targets: any[] = [];
  const planStores: any[] = [];

  items.forEach((item) => {
    const sId =
      item.storeId ||
      customers.find((c) => c.name === item.customerName)?.id;
    const storeName =
      item.customerName || customers.find((c) => c.id === sId)?.name || null;
    const isBilling = item.collectType === "BILLING";
    const amt =
      item.collectAmount != null ? Number(item.collectAmount) : null;

    type4Targets.push({
      storeId: sId || null,
      collectType: isBilling ? "BILLING" : "COLLECT",
      targetAmount: amt,
      invoiceNo: item.invoiceNo || null,
      notes: item.detail || null,
    });
  });

  return { type4Targets, planStores };
}

/**
 * Map Type 4 Stores to Section Items for Detail View
 */
export function mapType4ToSectionItems(
  stores: any[],
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  const type4Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_4" ||
      s.workTypeCode === "วางบิล / เก็บเงิน",
  );

  if (type4Stores.length === 0) {
    return [];
  }

  return type4Stores.map((s) => {
    const custName =
      s.storeName || (s as any).store?.name || "ร้านค้า / ลูกค้า";
    const amtNum =
      Number(s.targetAmount ?? (s as any).collectAmount) || 0;
    const isBilling =
      s.collectType === "BILLING" ||
      s.remarks === "BILLING" ||
      s.remarks === "วางบิล";

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
