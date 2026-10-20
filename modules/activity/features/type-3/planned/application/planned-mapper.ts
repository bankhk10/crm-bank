import type {
  Type3TargetItem,
  TargetProductItem,
  Type3SalesItem,
  Type3SalesProductLine,
} from "../types/planned.types";
import type { StoreOption, ProductOption } from "../../shared/types";

/**
 * Extract Type 3 targets from an ActivityPlan (supports dedicated ActivityPlanType3Target and legacy relations)
 */
export function extractType3PlanTargets(
  plan: any,
  prevTarget?: Type3TargetItem,
): {
  primary: Type3TargetItem;
  list: Type3TargetItem[];
} {
  const fallbackItem: Type3TargetItem = {
    customer: "",
    detail: "",
    targetQty: "",
    unitPrice: "",
    targetSales: "",
    items: [],
    ...prevTarget,
  };

  // 1. Load directly from dedicated table ActivityPlanType3Target
  if (
    plan?.type3Targets &&
    Array.isArray(plan.type3Targets) &&
    plan.type3Targets.length > 0
  ) {
    const list: Type3TargetItem[] = plan.type3Targets.map(
      (t: any, idx: number) => {
        const isSub = Boolean(t.isSubDealer);
        const customerDisplayName = isSub
          ? `${t.subDealerStore || "ผู้แทนจำหน่ายย่อย"} (Dealer: ${t.store?.name || "-"})`
          : t.store?.name || "ร้านค้าตัวแทนจำหน่าย";

        const items: TargetProductItem[] = (t.products || []).map((p: any) => {
          const qtyVal =
            p.targetQuantity != null ? String(p.targetQuantity) : "";
          const unitPriceVal = p.unitPrice
            ? `${Number(p.unitPrice).toLocaleString()} บาท`
            : "";
          const targetSalesVal = p.targetAmount
            ? `${Number(p.targetAmount).toLocaleString()} บาท`
            : "";

          return {
            id: p.id,
            productId: p.productId,
            productName: p.product?.name || "สินค้าเสนอขาย",
            customer: customerDisplayName,
            storeId: t.storeId || undefined,
            isSubDealer: isSub,
            subDealerStore: t.subDealerStore || "",
            dealerName: t.store?.name || "",
            qty: qtyVal,
            unitPrice: unitPriceVal,
            price: unitPriceVal,
            targetSales: targetSalesVal,
            detail: p.notes || t.notes || "",
            notes: p.notes || "",
            isAdditional: false,
          };
        });

        const totalQty = (t.products || []).reduce(
          (sum: number, p: any) => sum + (Number(p.targetQuantity) || 0),
          0,
        );
        const totalAmount = (t.products || []).reduce(
          (sum: number, p: any) => sum + (Number(p.targetAmount) || 0),
          0,
        );

        return {
          id: t.id || `t3-dedicated-${idx}`,
          customer: customerDisplayName,
          storeId: t.storeId || undefined,
          storeName: t.store?.name || undefined,
          isSubDealer: isSub,
          subDealerStore: t.subDealerStore || "",
          dealerName: t.store?.name || "",
          product: (t.products || [])
            .map((p: any) => p.product?.name)
            .filter(Boolean)
            .join(", "),
          targetQty: totalQty > 0 ? String(totalQty) : "",
          unitPrice: "",
          targetSales:
            totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : "",
          detail: t.notes || "",
          items,
        };
      },
    );

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // 2. Fallback: Aggregate from activityPlanStore & activityPlanProduct
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t3Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_3" ||
      s.workTypeCode === "เสนอขายสินค้า",
  );
  const t3Products = products.filter(
    (pr) =>
      !pr.workTypeCode ||
      pr.workTypeCode === "TYPE_3" ||
      pr.workTypeCode === "เสนอขายสินค้า",
  );

  if (t3Stores.length === 0 && t3Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  const list: Type3TargetItem[] = t3Stores.map((s, idx) => {
    const isSub = Boolean(s.subDealerStore);
    const customerDisplayName = isSub
      ? `${s.subDealerStore || "ผู้แทนจำหน่ายย่อย"} (Dealer: ${s.storeName || s.store?.name || "-"})`
      : s.storeName || s.store?.name || "ร้านค้าตัวแทนจำหน่าย";

    const matchedProds = t3Products.filter(
      (pr) => !pr.storeId || pr.storeId === s.storeId,
    );
    const effectiveProds =
      matchedProds.length > 0 ? matchedProds : t3Products;

    const items: TargetProductItem[] = effectiveProds.map((p) => {
      const qtyVal =
        p.targetQuantity != null ? String(p.targetQuantity) : "";
      const unitPriceVal = p.unitPrice
        ? `${Number(p.unitPrice).toLocaleString()} บาท`
        : "";
      const targetSalesVal = p.targetAmount
        ? `${Number(p.targetAmount).toLocaleString()} บาท`
        : "";

      return {
        id: p.id,
        productId: p.productId,
        productName: p.productName || p.product?.name || "สินค้าเสนอขาย",
        customer: customerDisplayName,
        storeId: s.storeId || undefined,
        isSubDealer: isSub,
        subDealerStore: s.subDealerStore || "",
        dealerName: s.storeName || s.store?.name || "",
        qty: qtyVal,
        unitPrice: unitPriceVal,
        price: unitPriceVal,
        targetSales: targetSalesVal,
        detail: p.notes || s.notes || "",
        notes: p.notes || "",
        isAdditional: false,
      };
    });

    const totalQty = effectiveProds.reduce(
      (sum: number, p: any) => sum + (Number(p.targetQuantity) || 0),
      0,
    );
    const totalAmount = effectiveProds.reduce(
      (sum: number, p: any) => sum + (Number(p.targetAmount) || 0),
      0,
    );

    return {
      id: s.id || `t3-generic-${idx}`,
      customer: customerDisplayName,
      storeId: s.storeId || undefined,
      storeName: s.storeName || s.store?.name || undefined,
      isSubDealer: isSub,
      subDealerStore: s.subDealerStore || "",
      dealerName: s.storeName || s.store?.name || "",
      product: effectiveProds
        .map((p: any) => p.productName || p.product?.name)
        .filter(Boolean)
        .join(", "),
      targetQty: totalQty > 0 ? String(totalQty) : "",
      unitPrice: "",
      targetSales:
        totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : "",
      detail: s.notes || "",
      items,
    };
  });

  return {
    primary: list[0] || fallbackItem,
    list,
  };
}

/**
 * Hydrate Type 3 form items from existing ActivityPlan data when editing
 */
export function hydrateType3PlannedData(plan: any): Type3SalesItem[] {
  if (!plan) return [];

  // 1. From dedicated table ActivityPlanType3Target
  if (
    plan.type3Targets &&
    Array.isArray(plan.type3Targets) &&
    plan.type3Targets.length > 0
  ) {
    return plan.type3Targets.map((t: any, idx: number) => {
      const prodLines: Type3SalesProductLine[] = (t.products || []).map(
        (p: any, pIdx: number) => ({
          id: p.id || `p-${idx}-${pIdx}`,
          productId: p.productId,
          productName: p.product?.name || p.productName || "",
          quantity: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : 0,
          price: p.targetAmount
            ? Number(p.targetAmount)
            : (Number(p.targetQuantity) || 1) * (Number(p.unitPrice) || 0),
          notes: p.notes || "",
        }),
      );

      const firstProd = prodLines[0];
      const rowPrice = prodLines.reduce((sum, p) => sum + (p.price || 0), 0);

      return {
        id: t.id || String(idx + 1),
        storeId: t.storeId || undefined,
        customerName: t.store?.name || "",
        isSubDealer: Boolean(t.isSubDealer),
        subDealerStore: t.subDealerStore || "",
        products:
          prodLines.length > 0
            ? prodLines
            : [
                {
                  id: `p-${idx}-0`,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  price: 0,
                },
              ],
        productName: firstProd?.productName || "",
        quantity: firstProd?.quantity || 1,
        unitPrice: firstProd?.unitPrice || 0,
        price: rowPrice,
        detail: t.notes || "",
        notes: t.notes || "",
      };
    });
  }

  // 2. From generic stores and products
  const stores: any[] = plan.planStores || plan.stores || [];
  const products: any[] = plan.planProducts || plan.products || [];

  const t3Stores = stores.filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_3" ||
      s.workTypeCode === "เสนอขายสินค้า",
  );
  const t3Products = products.filter(
    (p: any) =>
      !p.workTypeCode ||
      p.workTypeCode === "TYPE_3" ||
      p.workTypeCode === "เสนอขายสินค้า",
  );

  if (t3Stores.length === 0 && t3Products.length === 0) {
    return [];
  }

  return t3Stores.map((s: any, idx: number) => {
    const matchedProds = t3Products.filter(
      (p: any) => !p.storeId || p.storeId === s.storeId,
    );
    const effectiveProds =
      matchedProds.length > 0 ? matchedProds : t3Products;

    const prodLines: Type3SalesProductLine[] = effectiveProds.map(
      (p: any, pIdx: number) => ({
        id: p.id || `p-${idx}-${pIdx}`,
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        quantity: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : 0,
        price: p.targetAmount
          ? Number(p.targetAmount)
          : (Number(p.targetQuantity) || 1) * (Number(p.unitPrice) || 0),
        notes: p.notes || "",
      }),
    );

    const firstProd = prodLines[0];
    const rowPrice = prodLines.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      id: s.id || String(idx + 1),
      storeId: s.storeId || undefined,
      customerName: s.storeName || s.store?.name || "",
      isSubDealer: Boolean(s.subDealerStore),
      subDealerStore: s.subDealerStore || "",
      products:
        prodLines.length > 0
          ? prodLines
          : [
              {
                id: `p-${idx}-0`,
                productName: "",
                quantity: 1,
                unitPrice: 0,
                price: 0,
              },
            ],
      productName: firstProd?.productName || "",
      quantity: firstProd?.quantity || 1,
      unitPrice: firstProd?.unitPrice || 0,
      price: rowPrice,
      detail: s.notes || "",
      notes: s.notes || "",
    };
  });
}

/**
 * Map Form State items to Payload for Server Actions
 */
export function mapType3FormToPayload(
  items: Type3SalesItem[],
  customers: StoreOption[] = [],
  products: ProductOption[] = [],
): {
  type3Targets: any[];
  planStores: any[];
  planProducts: any[];
} {
  const type3Targets: any[] = [];
  const planStores: any[] = [];
  const planProducts: any[] = [];

  items.forEach((item) => {
    const sId =
      item.storeId ||
      customers.find((c) => c.name === item.customerName)?.id;
    const storeName =
      item.customerName || customers.find((c) => c.id === sId)?.name || null;

    const prodLines =
      item.products && item.products.length > 0
        ? item.products
        : [
            {
              id: "fallback-p",
              productId: item.productId,
              productName: item.productName || "",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              price: item.price || 0,
              notes: item.notes || "",
            },
          ];

    const validProducts = prodLines
      .filter((p) => p.productName?.trim())
      .map((p) => {
        const matchedP = products.find(
          (prod) => prod.id === p.productId || prod.name === p.productName,
        );
        const pId = p.productId || matchedP?.id;
        const qty = Number(p.quantity) || 1;
        const uPrice = p.unitPrice != null ? Number(p.unitPrice) : null;
        const amount =
          p.price != null
            ? Number(p.price)
            : uPrice != null
              ? qty * uPrice
              : null;

        return {
          productId: pId,
          productName: p.productName || matchedP?.name || "",
          quantity: qty,
          unitPrice: uPrice,
          price: amount,
          notes: p.notes || null,
        };
      });

    type3Targets.push({
      storeId: sId || null,
      isSubDealer: Boolean(item.isSubDealer),
      subDealerStore: item.isSubDealer ? item.subDealerStore || null : null,
      notes: item.detail || item.notes || null,
      products: validProducts,
    });

    if (sId || storeName) {
      planStores.push({
        workTypeCode: "TYPE_3",
        storeId: sId || null,
        storeName,
        subDealerStore: item.isSubDealer ? item.subDealerStore || null : null,
        notes: item.detail || item.notes || null,
      });
    }

    validProducts.forEach((vp) => {
      if (vp.productId) {
        planProducts.push({
          workTypeCode: "TYPE_3",
          storeId: sId || null,
          productId: vp.productId,
          productName: vp.productName,
          targetQuantity: vp.quantity,
          unitPrice: vp.unitPrice,
          targetAmount: vp.price,
          notes: vp.notes,
        });
      }
    });
  });

  return { type3Targets, planStores, planProducts };
}

/**
 * Map Type 3 Stores & Products to Section Items for Detail View
 */
export function mapType3ToSectionItems(
  stores: any[] = [],
  products: any[] = [],
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  const t3Stores = stores.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_3" ||
      s.workTypeCode === "เสนอขายสินค้า",
  );
  const t3Products = products.filter(
    (pr) =>
      !pr.workTypeCode ||
      pr.workTypeCode === "TYPE_3" ||
      pr.workTypeCode === "เสนอขายสินค้า",
  );

  if (t3Stores.length === 0 && t3Products.length === 0) {
    return [];
  }

  if (t3Products.length > 0) {
    return t3Products.map((pr) => {
      const matchedStore =
        t3Stores.find(
          (s) => s.storeId && pr.storeId && s.storeId === pr.storeId,
        ) || t3Stores[0];
      const isSub = Boolean(matchedStore?.subDealerStore);
      const storeDisplay = isSub
        ? `${matchedStore?.subDealerStore} (Dealer: ${matchedStore?.storeName || (matchedStore as any)?.store?.name || "-"})`
        : matchedStore?.storeName || (matchedStore as any)?.store?.name || "-";

      const extraFields: Array<{ label: string; value: string }> = [];
      if (pr.targetQuantity != null) {
        extraFields.push({
          label: "จำนวนเป้าหมาย",
          value: `${pr.targetQuantity} หน่วย`,
        });
      }
      if (pr.unitPrice != null) {
        extraFields.push({
          label: "ราคาต่อหน่วย",
          value: `${Number(pr.unitPrice).toLocaleString()} บาท`,
        });
      }
      if (pr.notes || matchedStore?.notes) {
        extraFields.push({
          label: "รายละเอียด",
          value: pr.notes || matchedStore?.notes || "",
        });
      }

      return {
        title: pr.productName || (pr as any).product?.name || "สินค้า",
        subtitle: `ร้านค้า: ${storeDisplay}`,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  return t3Stores.map((s) => {
    const isSub = Boolean(s.subDealerStore);
    const storeDisplay = isSub
      ? `${s.subDealerStore} (Dealer: ${s.storeName || (s as any).store?.name || "-"})`
      : s.storeName || (s as any).store?.name || "-";

    return {
      title: storeDisplay,
      subtitle: isSub ? "ผู้แทนจำหน่ายย่อย" : "ร้านค้าตัวแทนจำหน่าย",
      details: s.notes || undefined,
    };
  });
}
