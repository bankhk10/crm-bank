import type {
  Type11TargetItem,
  Type11TargetStoreItem,
} from "../types/planned.types";
import type { Type11StoreItem } from "../../shared/types";

/**
 * Extracts Type 11 plan targets (Store stock check list) from activity plan relations.
 * Reads strictly from dedicated relational storage (type11Targets).
 */
export function extractType11PlanTargets(
  plan: any,
  prevTarget?: Type11TargetItem,
): { primary: Type11TargetItem; list: Type11TargetItem[] } {
  const dedicatedTargets: any[] =
    plan?.type11Targets ||
    plan?.type11Data?.targets ||
    [];

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    const items: Type11TargetStoreItem[] = dedicatedTargets.map((t: any, idx: number) => ({
      id: t.id || `t11-item-${idx}`,
      targetId: t.id,
      storeId: t.storeId || t.id,
      store: t.storeName || t.store?.name || "",
      storeName: t.storeName || t.store?.name || "",
      detail: t.notes || t.visitPurpose || "",
      notes: t.notes || "",
    }));

    const list: Type11TargetItem[] = dedicatedTargets.map((t: any, idx: number) => ({
      id: t.id || `t11-target-${idx}`,
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
          id: t.id || `t11-item-${idx}`,
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
      ...first,
      id: first?.id,
      targetId: first?.targetId,
      storeId: first?.storeId,
      store: t11StoreNames || prevTarget?.store || "",
      storeName: t11StoreNames || prevTarget?.storeName || "",
      isUnregisteredStore: first?.isUnregisteredStore ?? false,
      dealerId: first?.dealerId || null,
      dealerName: first?.dealerName || null,
      province: first?.province || null,
      district: first?.district || null,
      detail: t11Details || prevTarget?.detail || "",
      notes: t11Details || prevTarget?.notes || "",
      targetOpportunity: prevTarget?.targetOpportunity || "",
      items: items.length > 0 ? items : prevTarget?.items || [],
      products: first?.products || [],
      result: first?.result || null,
    };

    return { primary, list };
  }

  const fallback: Type11TargetItem = {
    store: prevTarget?.store || "",
    detail: prevTarget?.detail || "",
    targetOpportunity: prevTarget?.targetOpportunity || "",
    items: prevTarget?.items || [],
  };

  return { primary: fallback, list: [] };
}

/**
 * Hydrates Type 11 planned state from existing plan or details
 */
export function hydrateType11PlannedData(
  initial: any,
  initDetails?: any,
): Type11StoreItem[] {
  // Check dedicated type11Targets first
  const dedicatedTargets =
    initial?.type11Targets ||
    initDetails?.type11Targets ||
    initial?.type11Data?.targets;

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    return dedicatedTargets.map((t: any, idx: number) => ({
      id: t.id || `t11-target-${idx}`,
      targetId: t.id,
      storeId: t.storeId ?? null,
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

  // If initDetails is already a hydrated array of Type11StoreItem, return it directly
  if (Array.isArray(initDetails) && initDetails.length > 0) {
    return initDetails.map((t: any, idx: number) => ({
      ...t,
      id: t.id || t.targetId || (t.storeId ? `store-${t.storeId}` : `t11-init-${idx}`),
      targetId: t.targetId || t.id,
      storeName: t.storeName || t.store || t.name || "ร้านค้า",
    }));
  }

  // Check type11Stores from form state
  if (Array.isArray(initial?.type11Stores) && initial.type11Stores.length > 0) {
    return initial.type11Stores.map((s: any, idx: number) => ({
      ...s,
      id: s.id || s.targetId || (s.storeId ? `store-${s.storeId}` : `t11-store-${idx}`),
      storeName: s.storeName || s.name || "ร้านค้า",
    }));
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
