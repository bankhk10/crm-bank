import type {
  Type9TargetItem,
} from "../types/planned.types";
import type { Type9ProductItem, Type9TargetProductItem } from "../../shared/types";

/**
 * Extracts Type 9 (จัดกิจกรรมส่งเสริมการขายหน้าร้าน) Plan Targets from Activity Plan.
 * Supports single target fallback and multiple store targets.
 */
export function extractType9PlanTargets(
  plan: any,
  prevTarget?: Partial<Type9TargetItem>,
): {
  primary: Type9TargetItem;
  list: Type9TargetItem[];
} {
  const stores = (plan?.stores || plan?.planStores || []).filter(
    (s: any) =>
      s.workTypeCode === "TYPE_9" ||
      s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  );
  const products = (plan?.products || plan?.planProducts || []).filter(
    (pr: any) =>
      pr.workTypeCode === "TYPE_9" ||
      pr.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  );

  const allItems: Type9TargetProductItem[] = products.map(
    (pr: any, idx: number) => {
      const qty = pr.targetQuantity != null ? Number(pr.targetQuantity) : 0;
      const price = pr.unitPrice != null ? Number(pr.unitPrice) : 0;
      const totalAmount =
        pr.targetAmount != null
          ? Number(pr.targetAmount)
          : qty * price;

      return {
        id: pr.id || String(idx + 1),
        productId: pr.productId,
        storeId: pr.storeId || stores[0]?.storeId || null,
        productName: pr.productName || pr.product?.name || "",
        quantityCases: qty,
        pricePerCase: price,
        totalAmount,
      };
    },
  );

  const totalProductSales = allItems.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0,
  );

  const targetAttendeesStr = plan?.targetAttendeesCount
    ? `${plan.targetAttendeesCount} คน`
    : prevTarget?.targetAttendees || "";

  const list: Type9TargetItem[] = [];

  if (stores.length > 0) {
    for (const s of stores) {
      const storeName = s.store?.name || s.storeName || "";
      const isSubDealer = Boolean(s.subDealerStore);
      const subDealerStore = s.subDealerStore || "";
      const storeItems =
        stores.length === 1
          ? allItems
          : allItems.filter(
              (it) => it.storeId === s.storeId || (!it.storeId && s.storeId),
            );

      const storeSales =
        storeItems.length > 0
          ? storeItems.reduce((sum, it) => sum + (it.totalAmount || 0), 0)
          : s.targetAmount != null
            ? Number(s.targetAmount)
            : 0;

      const productSummary = storeItems
        .map((p) => `${p.productName} (${p.quantityCases || 0} ลัง)`)
        .filter(Boolean)
        .join(", ");

      list.push({
        id: s.id,
        storeId: s.storeId || null,
        store: storeName,
        isSubDealer,
        subDealerStore,
        province: s.province || "",
        product: productSummary,
        targetSales:
          storeSales > 0 ? `${storeSales.toLocaleString()} บาท` : "",
        targetAttendees: targetAttendeesStr,
        items: storeItems,
      });
    }
  } else {
    // No explicit store records, build fallback from products/header
    const fallbackSales =
      totalProductSales > 0
        ? `${totalProductSales.toLocaleString()} บาท`
        : prevTarget?.targetSales || "";

    const fallbackProductSummary = allItems
      .map((p) => `${p.productName} (${p.quantityCases || 0} ลัง)`)
      .filter(Boolean)
      .join(", ");

    list.push({
      store: prevTarget?.store || "",
      isSubDealer: prevTarget?.isSubDealer || false,
      subDealerStore: prevTarget?.subDealerStore || "",
      product: fallbackProductSummary || prevTarget?.product || "",
      targetSales: fallbackSales,
      targetAttendees: targetAttendeesStr,
      items: allItems,
    });
  }

  const primary: Type9TargetItem = list[0] || {
    store: prevTarget?.store || "",
    isSubDealer: prevTarget?.isSubDealer || false,
    subDealerStore: prevTarget?.subDealerStore || "",
    product: prevTarget?.product || "",
    targetSales: prevTarget?.targetSales || "",
    targetAttendees: targetAttendeesStr,
    items: allItems,
  };

  return { primary, list };
}

/**
 * Hydrates initial planned data for Type 9 from raw ActivityPlan object.
 */
export function hydrateType9PlannedData(initialData?: any): {
  subdealerId?: string;
  subdealerName?: string;
  isUnregisteredSubdealer?: boolean;
  subDealerStore?: string;
  province?: string;
  district?: string;
  parentDealerId?: string;
  parentDealerName?: string;
  type9Sales?: number;
  type9ProductItems?: Type9ProductItem[];
} {
  if (!initialData) return {};

  const primaryStore = (initialData.stores || initialData.planStores || []).find(
    (st: any) =>
      st.workTypeCode === "TYPE_9" ||
      st.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  );

  const isUnreg = Boolean(primaryStore?.subDealerStore && !primaryStore?.storeId);

  const productItems: Type9ProductItem[] = (
    initialData.products ||
    initialData.planProducts ||
    []
  )
    .filter(
      (p: any) =>
        p.workTypeCode === "TYPE_9" ||
        p.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    )
    .map((p: any, idx: number) => ({
      id: p.id || String(idx + 1),
      productId: p.productId,
      productName: p.product?.name || p.productName || "",
      quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
      pricePerCase: p.unitPrice != null ? Number(p.unitPrice) : 0,
    }));

  return {
    subdealerId: primaryStore?.storeId || "",
    subdealerName: primaryStore?.store?.name || primaryStore?.storeName || "",
    isUnregisteredSubdealer: isUnreg,
    subDealerStore: primaryStore?.subDealerStore || "",
    province: primaryStore?.province || initialData.province || "",
    district: initialData.district || "",
    parentDealerId: isUnreg ? primaryStore?.storeId || "" : "",
    parentDealerName: isUnreg ? primaryStore?.storeName || "" : "",
    type9Sales:
      primaryStore?.targetAmount != null
        ? Number(primaryStore.targetAmount)
        : 0,
    type9ProductItems:
      productItems.length > 0
        ? productItems
        : [
            {
              id: "1",
              productName: "",
              quantityCases: 0,
              pricePerCase: 0,
            },
          ],
  };
}

/**
 * Pure mapper for Type 9 Plan Detail View Section items
 */
export function mapType9ToSectionItems(
  type9Stores: any[] = [],
  type9Products: any[] = [],
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t9Line = objectiveLines.find(
    (l) => l.includes("[กิจกรรมหน้าร้าน") || l.includes("กิจกรรมหน้าร้าน"),
  );

  if (type9Stores.length === 0 && type9Products.length === 0 && !t9Line) {
    return null;
  }

  const list = type9Products.map((pr: any) => ({
    title: pr.productName || pr.product?.name || "สินค้า",
    subtitle: type9Stores[0]?.storeName || type9Stores[0]?.store?.name
      ? `ร้านค้า: ${type9Stores[0].storeName || type9Stores[0].store?.name}`
      : undefined,
    extraFields: [
      ...(pr.targetQuantity != null
        ? [{ label: "จำนวน", value: `${pr.targetQuantity} ลัง` }]
        : []),
      ...(pr.targetAmount != null
        ? [
            {
              label: "ยอดขายเป้าหมาย",
              value: `${Number(pr.targetAmount).toLocaleString()} บาท`,
            },
          ]
        : []),
    ],
  }));

  return {
    typeIndex: 9,
    title: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    badge: "กิจกรรมหน้าร้าน",
    items: list,
    rawSummary: t9Line ? t9Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
