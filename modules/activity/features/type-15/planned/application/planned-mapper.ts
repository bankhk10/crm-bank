/**
 * Type 15 Feature: Planned Mapper (บูมทีม / คาราวาน)
 */

import type { Type15BoomItem } from "../../shared/types";
import { TYPE_15_CODE } from "../../shared/constants";

export function mapType15InitialData(initial: any): Type15BoomItem[] {
  if (!initial) {
    return [
      {
        id: "1",
        isSubDealer: false,
        isUnregisteredSubdealer: false,
        village: "",
        objective: "",
        detail: "",
      },
    ];
  }

  // 1. From type15Targets relation in DB
  const rawTargets =
    initial.type15Targets ||
    initial.targets ||
    (Array.isArray(initial.type15Items) ? initial.type15Items : null);

  if (Array.isArray(rawTargets) && rawTargets.length > 0) {
    return rawTargets.map((t: any, index: number) => ({
      id: t.id || String(index + 1),
      storeId: t.storeId || undefined,
      dealerName: t.store?.name || t.dealerName || "",
      customerName: t.store?.name || t.customerName || "",
      isSubDealer: Boolean(t.isSubDealer),
      subdealerId: t.subdealerId || undefined,
      subdealerName: t.subdealer?.name || t.subdealerName || "",
      isUnregisteredSubdealer: Boolean(t.isUnregisteredSubdealer),
      subDealerStore: t.subDealerStore || "",
      village: t.village || "",
      objective: t.objective || "",
      detail: t.detail || "",
    }));
  }

  // 2. From planStores fallback
  if (Array.isArray(initial.planStores)) {
    const type15Stores = initial.planStores.filter(
      (s: any) => s.workTypeCode === TYPE_15_CODE,
    );
    if (type15Stores.length > 0) {
      return type15Stores.map((s: any, index: number) => ({
        id: String(index + 1),
        storeId: s.storeId || undefined,
        customerName: s.storeName || "",
        dealerName: s.storeName || "",
        isSubDealer: false,
        isUnregisteredSubdealer: false,
        village: "",
        objective: "",
        detail: s.notes || s.remarks || "",
      }));
    }
  }

  return [
    {
      id: "1",
      isSubDealer: false,
      isUnregisteredSubdealer: false,
      village: "",
      objective: "",
      detail: "",
    },
  ];
}

export function mapType15ToPayload(
  items: Type15BoomItem[],
  customers: any[] = [],
) {
  const planStores = items.map((item) => {
    let resolvedStoreName = item.customerName || item.dealerName || "";
    if (item.storeId && !resolvedStoreName && customers.length > 0) {
      const found = customers.find((c: any) => c.id === item.storeId);
      if (found) resolvedStoreName = found.name;
    }

    return {
      workTypeCode: TYPE_15_CODE,
      storeId: item.storeId || null,
      storeName: resolvedStoreName || item.subDealerStore || null,
      remarks: item.village ? `หมู่บ้าน: ${item.village}` : null,
      notes: item.detail || item.objective || null,
    };
  });

  return {
    planStores,
    type15Items: items,
  };
}

export function extractType15PlanTargets(
  plan: any,
  prevTarget?: any,
): {
  primary: any;
  list: any[];
} {
  const rawTargets =
    plan?.type15Targets ||
    plan?.type15Items ||
    plan?.targets ||
    [];

  const list = Array.isArray(rawTargets) && rawTargets.length > 0
    ? rawTargets.map((t: any, idx: number) => {
        const isSub = Boolean(t.isSubDealer);
        const resolvedName = isSub
          ? (t.isUnregisteredSubdealer ? t.subDealerStore : t.subdealer?.name || t.subdealerName || t.subDealerStore) || t.store?.name || ""
          : t.store?.name || t.dealerName || t.customerName || "";

        return {
          id: t.id || String(idx + 1),
          storeId: t.storeId,
          storeName: t.store?.name || t.dealerName || t.customerName || "",
          customerName: t.store?.name || t.dealerName || t.customerName || "",
          dealerName: t.store?.name || t.dealerName || t.customerName || "",
          name: resolvedName,
          customer: resolvedName,
          isSubDealer: isSub,
          subdealerId: t.subdealerId,
          subdealerName: t.subdealer?.name || t.subdealerName || "",
          isUnregisteredSubdealer: Boolean(t.isUnregisteredSubdealer),
          subDealerStore: t.subDealerStore || "",
          village: t.village || "",
          objective: t.objective || "",
          detail: t.detail || "",
          store: t.store,
          subdealer: t.subdealer,
          results: t.results,
        };
      })
    : [];

  const primary = list[0] || {
    id: "1",
    isSubDealer: false,
    name: "",
    customer: "",
    village: "",
    objective: "",
    detail: "",
  };

  return { primary, list };
}
