import type {
  Type6TargetItem,
  TargetIssueItem,
  Type6IssueItem,
} from "../../shared/types";
import { normalizeType6Issue } from "../hooks/use-type6-planned-form";

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
 * Hydrate Type 6 initial form items from raw plan data
 */
export function hydrateType6PlannedData(initialData: any): Type6IssueItem[] {
  if (!initialData) {
    return [
      {
        id: "1",
        customerName: "",
        manualCustomerName: "",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "",
      },
    ];
  }

  // 1. From dedicated table
  if (Array.isArray(initialData.type6Targets) && initialData.type6Targets.length > 0) {
    return initialData.type6Targets.map((t: any, idx: number) => {
      const isManual = Boolean(t.isManualCustomer);
      return {
        id: t.id || String(idx + 1),
        storeId: isManual ? null : t.storeId || null,
        customerName: isManual ? "" : t.customerName || t.store?.name || "",
        manualCustomerName: isManual ? t.customerName || "" : "",
        isManualCustomer: isManual,
        issueType: normalizeType6Issue(t.issueType),
        detail: t.detail || "",
      };
    });
  }

  // 2. From type6Items
  if (Array.isArray(initialData.type6Items) && initialData.type6Items.length > 0) {
    return initialData.type6Items.map((item: any, idx: number) => {
      const isManual =
        item.isManualCustomer !== undefined
          ? item.isManualCustomer
          : !item.storeId && Boolean(item.manualCustomerName || item.customerName);
      return {
        id: item.id || String(idx + 1),
        storeId: isManual ? null : item.storeId || null,
        customerName: isManual ? "" : item.customerName || "",
        manualCustomerName: isManual
          ? item.manualCustomerName || item.customerName || ""
          : "",
        isManualCustomer: isManual,
        issueType: normalizeType6Issue(item.issueType),
        detail: item.detail || "",
      };
    });
  }

  // 3. From stores (activity_plan_stores)
  const stores = initialData.stores || initialData.planStores || [];
  const type6Stores = stores.filter(
    (s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_6" || s.workTypeCode === "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
  );
  if (type6Stores.length > 0) {
    return type6Stores.map((s: any, idx: number) => {
      const isManual = !s.storeId && Boolean(s.storeName);
      return {
        id: s.id || String(idx + 1),
        storeId: s.storeId || null,
        customerName: isManual ? "" : s.store?.name || s.storeName || "",
        manualCustomerName: isManual ? s.storeName || "" : "",
        isManualCustomer: isManual,
        issueType: normalizeType6Issue(s.remarks),
        detail: s.notes || "",
      };
    });
  }

  return [
    {
      id: "1",
      customerName: "",
      manualCustomerName: "",
      isManualCustomer: false,
      issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail: "",
    },
  ];
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
