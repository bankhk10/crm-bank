import type {
  Type11TargetItem,
  Type11TargetStoreItem,
} from "../types/planned.types";
import type { Type11StoreItem } from "../../shared/types";

/**
 * Extracts Type 11 plan targets (Store stock check list) from activity plan relations.
 */
export function extractType11PlanTargets(
  plan: any,
  prevTarget?: Type11TargetItem,
): { primary: Type11TargetItem; list: Type11TargetItem[] } {
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
    store: s.storeName || s.store?.name || "",
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
export function hydrateType11PlannedData(initial: any, initDetails?: any): Type11StoreItem[] {
  if (Array.isArray(initial?.type11Stores) && initial.type11Stores.length > 0) {
    return initial.type11Stores;
  }

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
    (l) => l.includes("[ตรวจเช็กสต็อก") || l.includes("ตรวจเช็กสต็อก"),
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
