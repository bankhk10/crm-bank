import type {
  Type11TargetItem,
  Type11TargetStoreItem,
} from "../types/planned.types";
import type { Type11StoreItem } from "../../shared/types";

/**
 * Extracts Type 11 plan targets (Store stock check list) from activity plan relations.
 * Reads dedicated relational storage (type11Targets) first, with fallback to legacy stores.
 */
export function extractType11PlanTargets(
  plan: any,
  prevTarget?: Type11TargetItem,
): { primary: Type11TargetItem; list: Type11TargetItem[] } {
  // 1. Dedicated relational storage support (type11Targets)
  const dedicatedTargets: any[] =
    plan?.type11Targets ||
    plan?.type11Data?.targets ||
    [];

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    const items: Type11TargetStoreItem[] = dedicatedTargets.map((t: any) => ({
      id: t.id,
      targetId: t.id,
      storeId: t.storeId || t.id,
      store: t.storeName || t.store?.name || "",
      storeName: t.storeName || t.store?.name || "",
      detail: t.notes || t.visitPurpose || "",
      notes: t.notes || "",
    }));

    const list: Type11TargetItem[] = dedicatedTargets.map((t: any) => ({
      id: t.id,
      targetId: t.id,
      storeId: t.storeId || null,
      store: t.storeName || t.store?.name || "",
      storeName: t.storeName || t.store?.name || "",
      isUnregisteredStore: Boolean(t.isUnregisteredStore),
      storeCode: t.storeCode || t.store?.customerCode || null,
      province: t.province || t.store?.province || null,
      district: t.district || t.store?.district || null,
      dealerId: t.dealerId || null,
      dealerName: t.dealerName || t.dealer?.name || null,
      visitPurpose: t.visitPurpose || null,
      detail: t.notes || t.visitPurpose || "",
      notes: t.notes || "",
      targetOpportunity: prevTarget?.targetOpportunity || "",
      products: t.products || [],
      result: t.result || null,
      items: [
        {
          id: t.id,
          targetId: t.id,
          storeId: t.storeId || t.id,
          store: t.storeName || t.store?.name || "",
          storeName: t.storeName || t.store?.name || "",
          detail: t.notes || t.visitPurpose || "",
          notes: t.notes || "",
        },
      ],
    }));

    const t11StoreNames = items
      .map((i) => i.store || i.storeName)
      .filter(Boolean)
      .join(", ");

    const t11Details = items
      .map((i) => i.detail)
      .filter(Boolean)
      .join(" | ");

    const first = list[0];
    const primary: Type11TargetItem = {
      id: first?.id,
      targetId: first?.targetId,
      storeId: first?.storeId,
      store: t11StoreNames || prevTarget?.store || "",
      storeName: t11StoreNames || prevTarget?.storeName || "",
      detail: t11Details || prevTarget?.detail || "",
      notes: t11Details || prevTarget?.notes || "",
      targetOpportunity: prevTarget?.targetOpportunity || "",
      items: items.length > 0 ? items : prevTarget?.items || [],
      products: first?.products || [],
      result: first?.result || null,
    };

    return { primary, list };
  }

  // 2. Legacy fallback to plan.stores (activity_plan_stores)
  const stores = Array.isArray(plan?.stores) ? plan.stores : [];
  const t11Stores = stores.filter(
    (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
  );

  const items: Type11TargetStoreItem[] = t11Stores.map((s: any) => ({
    storeId: s.storeId || s.id,
    store: s.storeName || s.store?.name || "",
    storeName: s.storeName || s.store?.name || "",
    detail: s.remarks || s.notes || "",
  }));

  const list: Type11TargetItem[] = t11Stores.map((s: any) => ({
    id: s.storeId || s.id,
    storeId: s.storeId || s.id,
    store: s.storeName || s.store?.name || "",
    storeName: s.storeName || s.store?.name || "",
    detail: s.remarks || s.notes || "",
    targetOpportunity: prevTarget?.targetOpportunity || "",
    items: [
      {
        storeId: s.storeId || s.id,
        store: s.storeName || s.store?.name || "",
        storeName: s.storeName || s.store?.name || "",
        detail: s.remarks || s.notes || "",
      },
    ],
  }));

  const t11StoreNames = items
    .map((i) => i.store || i.storeName)
    .filter(Boolean)
    .join(", ");

  const t11Details = items
    .map((i) => i.detail)
    .filter(Boolean)
    .join(" | ");

  const primary: Type11TargetItem = {
    store: t11StoreNames || prevTarget?.store || "",
    detail: t11Details || prevTarget?.detail || "",
    targetOpportunity: prevTarget?.targetOpportunity || "",
    items: items.length > 0 ? items : prevTarget?.items || [],
  };

  return { primary, list };
}

/**
 * Hydrates Type 11 planned state from existing plan or details
 */
export function hydrateType11PlannedData(
  initial: any,
  initDetails?: any,
): Type11StoreItem[] {
  // 1. Check dedicated type11Targets first
  const dedicatedTargets =
    initial?.type11Targets ||
    initDetails?.type11Targets ||
    initial?.type11Data?.targets;

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    return dedicatedTargets.map((t: any) => ({
      id: t.id,
      targetId: t.id,
      storeId: t.storeId,
      storeName: t.storeName || t.store?.name || "ร้านค้า",
      isUnregisteredStore: Boolean(t.isUnregisteredStore),
      storeCode: t.storeCode || t.store?.customerCode || null,
      province: t.province || t.store?.province || null,
      district: t.district || t.store?.district || null,
      dealerId: t.dealerId || null,
      dealerName: t.dealerName || t.dealer?.name || null,
      visitPurpose: t.visitPurpose || null,
      remarks: t.notes || t.remarks || undefined,
      notes: t.notes || t.remarks || undefined,
      products: t.products || [],
      result: t.result || null,
    }));
  }

  // 2. Check type11Stores
  if (Array.isArray(initial?.type11Stores) && initial.type11Stores.length > 0) {
    return initial.type11Stores;
  }

  // 3. Check legacy stores
  const stores =
    initial?.stores ||
    initDetails?.stores ||
    initDetails?.activityPlanStores ||
    [];

  if (Array.isArray(stores) && stores.length > 0) {
    const t11Stores = stores
      .filter((s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode)
      .map((s: any) => ({
        storeId: s.storeId || s.id,
        storeName: s.storeName || s.store?.name || s.name || "ร้านค้า",
        remarks: s.remarks || s.notes || undefined,
        notes: s.notes || s.remarks || undefined,
      }));
    if (t11Stores.length > 0) {
      return t11Stores;
    }
  }

  return [];
}

/**
 * Maps Type 11 stores to section display items for Detail View.
 */
export function mapType11ToSectionItems(
  type11Stores: any[],
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t11Line = objectiveLines.find(
    (l) => l.includes("[ตรวจเช็คสต๊อก") || l.includes("ตรวจเช็คสต๊อก"),
  );

  if ((!type11Stores || type11Stores.length === 0) && !t11Line) {
    return null;
  }

  const list = (type11Stores || []).map((s: any) => ({
    title: s.storeName || s.name || "ร้านค้า",
    details: s.remarks || s.notes || undefined,
  }));

  return {
    typeIndex: 11,
    title: "ตรวจเช็คสต๊อกหน้าร้าน",
    badge: "เช็กสต็อก",
    items: list,
    rawSummary: t11Line ? t11Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
