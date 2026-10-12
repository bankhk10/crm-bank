import type {
  Type3TargetItem,
  TargetProductItem,
  Type3ProductSaleDetail,
} from "../types";

/**
 * Extract Type 3 targets from an ActivityPlan (supporting Multi-Target: Store/SubDealer and Products)
 */
export function extractType3PlanTargets(
  plan: any,
  prevTarget?: Type3TargetItem,
): {
  primary: Type3TargetItem;
  list: Type3TargetItem[];
} {
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t3Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
  );
  const t3Products = products.filter(
    (pr) => !pr.workTypeCode || pr.workTypeCode === "TYPE_3" || pr.workTypeCode === "เสนอขายสินค้า",
  );

  const fallbackItem: Type3TargetItem = {
    customer: "",
    detail: "",
    targetQty: "",
    unitPrice: "",
    targetSales: "",
    items: [],
    ...prevTarget,
  };

  // 1. Support loading directly from dedicated table ActivityPlanType3Target
  if (plan?.type3Targets && Array.isArray(plan.type3Targets) && plan.type3Targets.length > 0) {
    const list: Type3TargetItem[] = plan.type3Targets.map((t: any, idx: number) => {
      const isSub = Boolean(t.isSubDealer);
      const customerDisplayName = isSub
        ? `${t.subDealerStore || "ผู้แทนจำหน่ายย่อย"} (Dealer: ${t.store?.name || "-"})`
        : t.store?.name || "ร้านค้าตัวแทนจำหน่าย";

      const items: TargetProductItem[] = (t.products || []).map((p: any) => {
        const qtyVal = p.targetQuantity != null ? String(p.targetQuantity) : "";
        const unitPriceVal = p.unitPrice ? `${Number(p.unitPrice).toLocaleString()} บาท` : "";
        const targetSalesVal = p.targetAmount ? `${Number(p.targetAmount).toLocaleString()} บาท` : "";

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
        product: (t.products || []).map((p: any) => p.product?.name).filter(Boolean).join(", "),
        targetQty: totalQty > 0 ? String(totalQty) : "",
        unitPrice: "",
        targetSales: totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : "",
        detail: t.notes || "",
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  if (t3Stores.length === 0 && t3Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  // 2. Fallback: Stores from generic tables
  if (t3Stores.length > 0) {
    const list: Type3TargetItem[] = t3Stores.map((s, idx) => {
      // Find products associated with this store (by storeId, or if single store, all products)
      const matchedProducts = t3Stores.length === 1
        ? t3Products
        : t3Products.filter((p) => p.storeId && s.storeId && p.storeId === s.storeId);

      const effectiveProducts = matchedProducts.length > 0
        ? matchedProducts
        : (idx === 0 && t3Products.some((p) => !p.storeId)
            ? t3Products.filter((p) => !p.storeId)
            : []);

      const isSub = Boolean(s.subDealerStore);
      const custDisplay = isSub
        ? `${s.subDealerStore} (Dealer: ${s.storeName || (s as any).store?.name || "-"})`
        : s.storeName || (s as any).store?.name || "ร้านค้าตัวแทนจำหน่าย";

      const items: TargetProductItem[] = effectiveProducts.map((pr) => {
        const qtyVal = pr.targetQuantity != null ? String(pr.targetQuantity) : "";
        const unitPriceVal = pr.unitPrice ? `${Number(pr.unitPrice).toLocaleString()} บาท` : "";
        const targetSalesVal = pr.targetAmount ? `${Number(pr.targetAmount).toLocaleString()} บาท` : "";

        return {
          id: pr.id,
          productId: pr.productId,
          productName: pr.productName || (pr as any).product?.name || "สินค้าเสนอขาย",
          customer: custDisplay,
          storeId: pr.storeId || s.storeId || undefined,
          isSubDealer: isSub,
          subDealerStore: s.subDealerStore || "",
          dealerName: s.storeName || (s as any).store?.name || "",
          qty: qtyVal,
          unitPrice: unitPriceVal,
          price: unitPriceVal,
          targetSales: targetSalesVal,
          detail: pr.notes || s.notes || s.remarks || "",
          notes: pr.notes || "",
          isAdditional: false,
        };
      });

      const totalQty = effectiveProducts.reduce(
        (sum, pr) => sum + (Number(pr.targetQuantity) || 0),
        0,
      );
      const totalAmount = effectiveProducts.reduce(
        (sum, pr) => sum + (Number(pr.targetAmount) || 0),
        0,
      );

      return {
        id: s.id || `t3-store-${idx}`,
        customer: custDisplay,
        storeId: s.storeId || undefined,
        storeName: s.storeName || (s as any).store?.name || undefined,
        isSubDealer: isSub,
        subDealerStore: s.subDealerStore || "",
        dealerName: s.storeName || (s as any).store?.name || "",
        product: effectiveProducts.map((p) => p.productName || (p as any).product?.name).filter(Boolean).join(", "),
        targetQty: totalQty > 0 ? String(totalQty) : "",
        unitPrice: "",
        targetSales: totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : "",
        detail: s.notes || s.remarks || effectiveProducts[0]?.notes || "",
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // 3. Fallback: Products exist but no stores defined
  const items: TargetProductItem[] = t3Products.map((pr) => {
    const qtyVal = pr.targetQuantity != null ? String(pr.targetQuantity) : "";
    const unitPriceVal = pr.unitPrice ? `${Number(pr.unitPrice).toLocaleString()} บาท` : "";
    const targetSalesVal = pr.targetAmount ? `${Number(pr.targetAmount).toLocaleString()} บาท` : "";

    return {
      id: pr.id,
      productId: pr.productId,
      productName: pr.productName || (pr as any).product?.name || "สินค้าเสนอขาย",
      customer: (pr as any)?.store?.name || pr.storeName || "ร้านค้าตัวแทนจำหน่าย",
      storeId: pr.storeId || undefined,
      qty: qtyVal,
      unitPrice: unitPriceVal,
      price: unitPriceVal,
      targetSales: targetSalesVal,
      detail: pr.notes || "",
      notes: pr.notes || "",
      isAdditional: false,
    };
  });

  const totalQty = t3Products.reduce(
    (sum, pr) => sum + (Number(pr.targetQuantity) || 0),
    0,
  );
  const totalAmount = t3Products.reduce(
    (sum, pr) => sum + (Number(pr.targetAmount) || 0),
    0,
  );

  const singleTarget: Type3TargetItem = {
    customer: items[0]?.customer || "ร้านค้าตัวแทนจำหน่าย",
    product: t3Products.map((p) => p.productName || (p as any).product?.name).filter(Boolean).join(", "),
    targetQty: totalQty > 0 ? String(totalQty) : "",
    unitPrice: "",
    targetSales: totalAmount > 0 ? `${totalAmount.toLocaleString()} บาท` : "",
    detail: t3Products[0]?.notes || "",
    items,
  };

  return {
    primary: singleTarget,
    list: [singleTarget],
  };
}

/**
 * Parse Type 3 Actual Results from raw backend ActivityResult payload
 */
export function parseType3ActualResult(resData: any): {
  t3ProductSalesDetails?: Type3ProductSaleDetail[];
  t3SoldProducts?: string;
  t3ActualSales?: string;
  t3ActualQuantity?: string;
  t3UnclosedReason?: string;
} {
  const result: {
    t3ProductSalesDetails?: Type3ProductSaleDetail[];
    t3SoldProducts?: string;
    t3ActualSales?: string;
    t3ActualQuantity?: string;
    t3UnclosedReason?: string;
  } = {};

  if (!resData) return result;

  // 1. Structured saleResults from normalized relations
  if (
    resData.saleResults &&
    Array.isArray(resData.saleResults) &&
    resData.saleResults.length > 0
  ) {
    const t3Sales = resData.saleResults.filter(
      (s: any) => s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
    );
    if (t3Sales.length > 0) {
      result.t3ProductSalesDetails = t3Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId,
        productName: s.productName || s.product?.name || "",
        actualQty: String(s.actualQuantity ?? ""),
        unitPrice: s.actualUnitPrice != null ? String(s.actualUnitPrice) : "",
        actualSales: String(s.actualTotal ?? ""),
        storeId: s.storeId,
        customer: s.store?.name || undefined,
        unclosedReason: s.unclosedReason || "",
        isAdditional: Boolean(s.isAdditional),
      }));

      // Summarize sold products string
      const soldNames = t3Sales
        .map((s: any) => s.productName || s.product?.name)
        .filter(Boolean);
      if (soldNames.length > 0) {
        result.t3SoldProducts = soldNames.join(", ");
      }

      // Summarize total sales amount
      const totalSales = t3Sales.reduce(
        (sum: number, s: any) => sum + (Number(s.actualTotal) || 0),
        0,
      );
      if (totalSales > 0) {
        result.t3ActualSales = String(totalSales);
      }

      // Summarize total quantity
      const totalQty = t3Sales.reduce(
        (sum: number, s: any) => sum + (Number(s.actualQuantity) || 0),
        0,
      );
      if (totalQty > 0) {
        result.t3ActualQuantity = String(totalQty);
      }
    }
  }

  // 2. Fallback: Parse from actualSummary text if present
  const summaryText = resData.actualSummary || "";
  if (summaryText) {
    const prodMatch = summaryText.match(/สินค้าที่เสนอขาย:\s*(.+)/);
    if (prodMatch && prodMatch[1] && !result.t3SoldProducts) {
      result.t3SoldProducts = prodMatch[1].split("\n")[0].trim();
    }

    const salesMatch = summaryText.match(/ยอดขายที่ได้:\s*(.+)/);
    if (salesMatch && salesMatch[1] && !result.t3ActualSales) {
      result.t3ActualSales = salesMatch[1].split("\n")[0].trim();
    }

    const qtyMatch = summaryText.match(/จำนวนที่ขายได้:\s*(.+)/);
    if (qtyMatch && qtyMatch[1] && !result.t3ActualQuantity) {
      result.t3ActualQuantity = qtyMatch[1].split("\n")[0].trim();
    }

    const reasonMatch = summaryText.match(/เหตุผลที่ไม่สามารถปิดการขายได้:\s*(.+)/);
    if (reasonMatch && reasonMatch[1] && !result.t3UnclosedReason) {
      result.t3UnclosedReason = reasonMatch[1].split("\n")[0].trim();
    }
  }

  return result;
}

/**
 * Map Type 3 Stores & Products to Section Items for Detail View
 */
export function mapType3ToSectionItems(
  stores: any[],
  products: any[],
): Array<{ title: string; subtitle?: string; details?: string; extraFields?: Array<{ label: string; value: string }> }> {
  const type3Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
  );
  const type3Products = products.filter(
    (pr) => !pr.workTypeCode || pr.workTypeCode === "TYPE_3" || pr.workTypeCode === "เสนอขายสินค้า",
  );

  if (type3Stores.length === 0 && type3Products.length === 0) {
    return [];
  }

  if (type3Products.length > 0) {
    return type3Products.map((pr) => {
      const matchedStore =
        type3Stores.find(
          (s) => s.storeId && pr.storeId && s.storeId === pr.storeId,
        ) || type3Stores[0];
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

  // Fallback: Stores only
  return type3Stores.map((s) => {
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
