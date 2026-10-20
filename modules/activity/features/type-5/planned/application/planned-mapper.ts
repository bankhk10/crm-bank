import type {
  Type5TargetItem,
  TargetSurveyItem,
  Type5SurveyItem,
} from "../types/planned.types";
import type { CustomerOption, ProductOption } from "../../shared/types";

/**
 * Extract Type 5 targets from an ActivityPlan (supporting Multi-Target Survey items)
 */
export function extractType5PlanTargets(
  plan: any,
  prevTarget?: Type5TargetItem,
): {
  primary: Type5TargetItem;
  list: Type5TargetItem[];
} {
  const fallbackItem: Type5TargetItem = {
    store: "",
    product: "",
    detail: "",
    items: [],
    ...prevTarget,
  };

  // 1. Support loading directly from dedicated table ActivityPlanType5Target
  if (
    plan?.type5Targets &&
    Array.isArray(plan.type5Targets) &&
    plan.type5Targets.length > 0
  ) {
    const list: Type5TargetItem[] = plan.type5Targets.map(
      (t: any, idx: number) => {
        const storeName =
          t.store?.shopName ||
          t.store?.name ||
          t.storeName ||
          "ร้านค้า / ลูกค้า";
        const productName =
          t.product?.name || t.productName || "สินค้าที่นำไปเปรียบเทียบ";
        const detail = t.detail || t.notes || "";

        const surveyItem: TargetSurveyItem = {
          id: t.id || `t5-item-${idx}`,
          storeId: t.storeId || undefined,
          store: storeName,
          storeName,
          productId: t.productId || undefined,
          product: productName,
          productName,
          detail,
          notes: detail,
        };

        return {
          id: t.id || `t5-target-${idx}`,
          storeId: t.storeId || undefined,
          store: storeName,
          storeName,
          productId: t.productId || undefined,
          product: productName,
          productName,
          detail,
          notes: detail,
          items: [surveyItem],
        };
      },
    );

    const primaryTarget: Type5TargetItem = {
      ...list[0],
      store: list
        .map((l) => l.store)
        .filter(Boolean)
        .join(", "),
      product: list
        .map((l) => l.product)
        .filter(Boolean)
        .join(", "),
      detail: list
        .map((l) => l.detail)
        .filter(Boolean)
        .join(" | "),
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // 2. Fallback: Generic stores & products tables
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t5Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_5" ||
      s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  const t5Products = products.filter(
    (p) =>
      !p.workTypeCode ||
      p.workTypeCode === "TYPE_5" ||
      p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );

  if (t5Stores.length === 0 && t5Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  const maxCount = Math.max(t5Stores.length, t5Products.length);
  const list: Type5TargetItem[] = [];

  for (let idx = 0; idx < maxCount; idx++) {
    const st = t5Stores[idx] || t5Stores[0] || {};
    const pr = t5Products[idx] || t5Products[0] || {};

    const storeName =
      st.storeName || st.store?.shopName || st.store?.name || "ร้านค้า / ลูกค้า";
    const productName =
      pr.productName || pr.product?.name || "สินค้าที่นำไปเปรียบเทียบ";
    const detail = pr.notes || st.notes || "";

    const surveyItem: TargetSurveyItem = {
      id: pr.id || st.id || `t5-generic-${idx}`,
      storeId: st.storeId || undefined,
      store: storeName,
      storeName,
      productId: pr.productId || undefined,
      product: productName,
      productName,
      detail,
      notes: detail,
    };

    list.push({
      id: pr.id || st.id || `t5-legacy-${idx}`,
      storeId: st.storeId || undefined,
      store: storeName,
      storeName,
      productId: pr.productId || undefined,
      product: productName,
      productName,
      detail,
      notes: detail,
      items: [surveyItem],
    });
  }

  const primaryTarget: Type5TargetItem = {
    ...list[0],
    store: list
      .map((l) => l.store)
      .filter(Boolean)
      .join(", "),
    product: list
      .map((l) => l.product)
      .filter(Boolean)
      .join(", "),
    detail: list
      .map((l) => l.detail)
      .filter(Boolean)
      .join(" | "),
    items: list.flatMap((l) => l.items || []),
  };

  return {
    primary: primaryTarget,
    list,
  };
}

/**
 * Hydrates initial Type 5 planned form items from raw activity plan payload
 */
export function hydrateType5PlannedData(initialData?: any): Type5SurveyItem[] {
  if (!initialData) return [];

  if (
    Array.isArray(initialData.type5Items) &&
    initialData.type5Items.length > 0
  ) {
    return initialData.type5Items;
  }

  if (
    Array.isArray(initialData.type5Targets) &&
    initialData.type5Targets.length > 0
  ) {
    return initialData.type5Targets.map((t: any, idx: number) => ({
      id: t.id || String(idx + 1),
      storeId: t.storeId || "",
      storeName:
        t.store?.shopName ||
        t.store?.name ||
        t.storeName ||
        "",
      productId: t.productId || "",
      comparedProduct:
        t.product?.name || t.productName || "",
      detail: t.detail || t.notes || "",
    }));
  }

  const stores = (initialData.planStores || initialData.stores || []).filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_5" ||
      s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  const products = (
    initialData.planProducts ||
    initialData.products ||
    []
  ).filter(
    (p: any) =>
      !p.workTypeCode ||
      p.workTypeCode === "TYPE_5" ||
      p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );

  if (stores.length > 0 || products.length > 0) {
    const count = Math.max(stores.length, products.length);
    return Array.from({ length: count }).map((_, idx) => {
      const s = stores[idx] || stores[0] || {};
      const p = products[idx] || products[0] || {};
      return {
        id: s.id || p.id || String(idx + 1),
        storeId: s.storeId || "",
        storeName: s.storeName || s.store?.shopName || s.store?.name || "",
        productId: p.productId || "",
        comparedProduct: p.productName || p.product?.name || "",
        detail: s.notes || p.notes || "",
      };
    });
  }

  return [];
}

/**
 * Maps Type 5 Form state into submission payload
 */
export function mapType5FormToPayload(
  items: Type5SurveyItem[],
  customersList: CustomerOption[] = [],
  productsList: ProductOption[] = [],
) {
  const planStores = items
    .filter((it) => it.storeId || it.storeName)
    .map((it) => {
      const foundStore = customersList.find((c) => c.id === it.storeId);
      return {
        workTypeCode: "TYPE_5",
        storeId: it.storeId || "",
        storeName: foundStore?.name || it.storeName || null,
        notes: it.detail || null,
      };
    });

  const planProducts = items
    .filter((it) => it.productId || it.comparedProduct)
    .map((it) => {
      const foundProd = productsList.find((p) => p.id === it.productId);
      return {
        workTypeCode: "TYPE_5",
        storeId: it.storeId || null,
        productId: it.productId || "",
        productName: foundProd?.name || it.comparedProduct || null,
        notes: it.detail || null,
        isPriceOverridden: false,
      };
    });

  return {
    type5Items: items,
    planStores,
    planProducts,
  };
}

/**
 * Map Type 5 Survey items to Section Items for Detail View
 */
export function mapType5ToSectionItems(
  targetsOrStores: any[],
  products: any[] = [],
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  if (
    targetsOrStores.length > 0 &&
    targetsOrStores[0]?.product !== undefined &&
    targetsOrStores[0]?.store !== undefined
  ) {
    return targetsOrStores.map((t) => {
      const prodName =
        t.product?.name || t.product || "สินค้าที่นำไปเปรียบเทียบ";
      const storeName =
        t.store?.shopName || t.store?.name || t.store || "ร้านค้า / ลูกค้า";
      const extraFields: Array<{ label: string; value: string }> = [];

      if (storeName) {
        extraFields.push({ label: "ร้านค้าเป้าหมาย", value: storeName });
      }
      if (t.detail || t.notes) {
        extraFields.push({ label: "รายละเอียด", value: t.detail || t.notes });
      }

      return {
        title: prodName,
        subtitle: storeName ? `ร้านค้า: ${storeName}` : undefined,
        details: t.detail || t.notes || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  const type5Products = products.filter(
    (pr) =>
      !pr.workTypeCode ||
      pr.workTypeCode === "TYPE_5" ||
      pr.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );
  const type5Stores = targetsOrStores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_5" ||
      s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
  );

  if (type5Products.length === 0 && type5Stores.length === 0) {
    return [];
  }

  const maxItems = Math.max(type5Products.length, type5Stores.length);
  const items: Array<{
    title: string;
    subtitle?: string;
    details?: string;
    extraFields?: Array<{ label: string; value: string }>;
  }> = [];

  for (let i = 0; i < maxItems; i++) {
    const pr = type5Products[i] || type5Products[0] || {};
    const st = type5Stores[i] || type5Stores[0] || {};

    const prodName =
      pr.productName || pr.product?.name || "สินค้าที่นำไปเปรียบเทียบ";
    const storeName =
      st.storeName || st.store?.shopName || st.store?.name || "";
    const detail = pr.notes || st.notes || "";

    const extraFields: Array<{ label: string; value: string }> = [];
    if (storeName) {
      extraFields.push({ label: "ร้านค้าเป้าหมาย", value: storeName });
    }
    if (detail) {
      extraFields.push({ label: "รายละเอียด", value: detail });
    }

    items.push({
      title: prodName,
      subtitle: storeName ? `ร้านค้า: ${storeName}` : undefined,
      details: detail || undefined,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
    });
  }

  return items;
}
