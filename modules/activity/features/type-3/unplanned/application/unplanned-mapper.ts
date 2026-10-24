import type { StoreOption, ProductOption } from "../../shared/types";
import type {
  Type3UnplannedItem,
  Type3UnplannedProductItem,
} from "../types/unplanned.types";

/**
 * Hydrates unplanned items (Target Store + Products + Actual Sales Outcome) from an ActivityPlan record
 */
export function hydrateType3UnplannedData(plan: any): Type3UnplannedItem[] {
  if (!plan) return [];

  const saleResults: any[] =
    plan.type3Results ||
    plan.result?.type3Results ||
    plan.result?.saleResults ||
    plan.saleResults ||
    plan.productSalesDetails ||
    [];

  // 1. From dedicated table ActivityPlanType3Target
  if (
    plan.type3Targets &&
    Array.isArray(plan.type3Targets) &&
    plan.type3Targets.length > 0
  ) {
    return plan.type3Targets.map((t: any, idx: number) => {
      const isSubDealer = Boolean(t.isSubDealer);
      const storeDisplayName = isSubDealer
        ? t.subDealerStore || ""
        : t.store?.name || "";

      const targetResults = Array.isArray(t.results) ? t.results : [];
      let targetProducts: Type3UnplannedProductItem[] = (t.products || []).map(
        (p: any, pIdx: number) => {
          const matchedSale =
            targetResults.find((r: any) => r.productId === p.productId) ||
            saleResults.find(
              (s: any) =>
                (s.productId && s.productId === p.productId) ||
                (s.productName &&
                  (s.productName === p.product?.name ||
                    s.productName === p.productName)),
            );

          const targetQty = Number(p.targetQuantity) || 1;
          const actualQty = matchedSale
            ? Number(matchedSale.actualQuantity ?? matchedSale.actualQty ?? 0)
            : targetQty;
          const unitPrice = matchedSale
            ? Number(matchedSale.actualUnitPrice ?? matchedSale.unitPrice ?? 0)
            : Number(p.unitPrice ?? 0);
          const actualTotal = matchedSale
            ? Number(
                matchedSale.actualTotal ??
                  matchedSale.actualSales ??
                  actualQty * unitPrice,
              )
            : actualQty * unitPrice;

          return {
            id: p.id || `p-${idx}-${pIdx}`,
            productId: p.productId,
            productName: p.product?.name || p.productName || "สินค้า",
            targetQuantity: targetQty,
            actualQuantity: actualQty,
            unitPrice,
            actualTotal,
            unclosedReason: matchedSale?.unclosedReason || "",
            notes: p.notes || "",
          };
        },
      );

      // If target had no products in ActivityPlanType3Product, but saleResults exist for this store
      if (targetProducts.length === 0 && saleResults.length > 0) {
        const storeSales = t.storeId
          ? saleResults.filter((s: any) => s.storeId === t.storeId)
          : saleResults;

        if (storeSales.length > 0) {
          targetProducts = storeSales.map((s: any, sIdx: number) => {
            const qty = Number(s.actualQuantity ?? s.actualQty ?? 0);
            const price = Number(s.actualUnitPrice ?? s.unitPrice ?? 0);
            return {
              id: s.id || `p-${idx}-${sIdx}`,
              productId: s.productId,
              productName: s.product?.name || s.productName || "สินค้า",
              targetQuantity: qty,
              actualQuantity: qty,
              unitPrice: price,
              actualTotal: Number(
                s.actualTotal ?? s.actualSales ?? qty * price,
              ),
              unclosedReason: s.unclosedReason || "",
              notes: "",
            };
          });
        }
      }

      return {
        id: t.id || String(idx + 1),
        storeId: t.storeId || undefined,
        storeName: storeDisplayName,
        isSubDealer,
        subDealerStore: t.subDealerStore || "",
        notes: t.notes || "",
        products:
          targetProducts.length > 0
            ? targetProducts
            : [
                {
                  id: `p-${idx}-0`,
                  productId: "",
                  productName: "",
                  targetQuantity: 1,
                  actualQuantity: 1,
                  unitPrice: 0,
                  actualTotal: 0,
                  unclosedReason: "",
                  notes: "",
                },
              ],
      };
    });
  }

  // 1.1 Backward compatibility: From plan.stores / plan.products
  const t3Stores = (plan.stores || []).filter(
    (s: any) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_3" ||
      s.workTypeCode === "เสนอขายสินค้า",
  );

  if (t3Stores.length > 0) {
    return t3Stores.map((s: any, idx: number) => {
      const isSubDealer = Boolean(s.subDealerStore);
      const storeDisplayName = isSubDealer
        ? s.subDealerStore || ""
        : s.store?.name || s.storeName || "";

      const storeProducts = (plan.products || []).filter(
        (p: any) =>
          (!p.workTypeCode ||
            p.workTypeCode === "TYPE_3" ||
            p.workTypeCode === "เสนอขายสินค้า") &&
          (s.storeId ? p.storeId === s.storeId : true),
      );

      let targetProducts: Type3UnplannedProductItem[] = storeProducts.map(
        (p: any, pIdx: number) => {
          const matchedSale = saleResults.find(
            (sale: any) =>
              (sale.productId && sale.productId === p.productId) ||
              (sale.productName &&
                (sale.productName === p.product?.name ||
                  sale.productName === p.productName)),
          );

          const targetQty = Number(p.targetQuantity) || 1;
          const actualQty = matchedSale
            ? Number(
                matchedSale.actualQuantity ?? matchedSale.actualQty ?? 0,
              )
            : targetQty;
          const unitPrice = matchedSale
            ? Number(
                matchedSale.actualUnitPrice ?? matchedSale.unitPrice ?? 0,
              )
            : Number(p.unitPrice ?? 0);
          const actualTotal = matchedSale
            ? Number(
                matchedSale.actualTotal ??
                  matchedSale.actualSales ??
                  actualQty * unitPrice,
              )
            : actualQty * unitPrice;

          return {
            id: p.id || `p-${idx}-${pIdx}`,
            productId: p.productId,
            productName: p.product?.name || p.productName || "สินค้า",
            targetQuantity: targetQty,
            actualQuantity: actualQty,
            unitPrice,
            actualTotal,
            unclosedReason: matchedSale?.unclosedReason || "",
            notes: p.notes || "",
          };
        },
      );

      if (targetProducts.length === 0 && saleResults.length > 0) {
        const storeSales = s.storeId
          ? saleResults.filter((sale: any) => sale.storeId === s.storeId)
          : saleResults;

        if (storeSales.length > 0) {
          targetProducts = storeSales.map((sale: any, sIdx: number) => {
            const qty = Number(sale.actualQuantity ?? sale.actualQty ?? 0);
            const price = Number(sale.actualUnitPrice ?? sale.unitPrice ?? 0);
            return {
              id: sale.id || `p-${idx}-${sIdx}`,
              productId: sale.productId,
              productName: sale.product?.name || sale.productName || "สินค้า",
              targetQuantity: qty,
              actualQuantity: qty,
              unitPrice: price,
              actualTotal: Number(
                sale.actualTotal ?? sale.actualSales ?? qty * price,
              ),
              unclosedReason: sale.unclosedReason || "",
              notes: "",
            };
          });
        }
      }

      return {
        id: s.id || String(idx + 1),
        storeId: s.storeId || undefined,
        storeName: storeDisplayName,
        isSubDealer,
        subDealerStore: s.subDealerStore || "",
        notes: s.notes || "",
        products:
          targetProducts.length > 0
            ? targetProducts
            : [
                {
                  id: `p-${idx}-0`,
                  productId: "",
                  productName: "",
                  targetQuantity: 1,
                  actualQuantity: 1,
                  unitPrice: 0,
                  actualTotal: 0,
                  unclosedReason: "",
                  notes: "",
                },
              ],
      };
    });
  }

  // 2. Fallback: Default single item
  return [
    {
      id: "1",
      storeId: "",
      storeName: "",
      isSubDealer: false,
      subDealerStore: "",
      notes: "",
      products: [
        {
          id: "p0",
          productId: "",
          productName: "",
          targetQuantity: 1,
          actualQuantity: 1,
          unitPrice: 0,
          actualTotal: 0,
          unclosedReason: "",
          notes: "",
        },
      ],
    },
  ];
}

/**
 * Maps Type 3 Unplanned items to database payload for savePlan & saveActual
 */
export function mapType3UnplannedToPayload(
  items: Type3UnplannedItem[],
  customersList: StoreOption[] = [],
  productsList: ProductOption[] = [],
) {
  const planStores: any[] = [];
  const planProducts: any[] = [];
  const productSalesDetails: any[] = [];
  const type3Targets: any[] = [];

  items.forEach((item) => {
    let resolvedStoreId = item.storeId;
    if (!resolvedStoreId && item.storeName) {
      const found = customersList.find((c) => c.name === item.storeName);
      if (found) resolvedStoreId = found.id;
    }

    const isSubDealer = Boolean(item.isSubDealer);

    // 1. Target Store (Generic relation table)
    planStores.push({
      workTypeCode: "TYPE_3",
      storeId: resolvedStoreId || null,
      storeName: isSubDealer
        ? item.subDealerStore || null
        : item.storeName || null,
      subDealerStore: isSubDealer ? item.subDealerStore || null : null,
      notes: item.notes || null,
    });

    const targetProducts: any[] = [];

    // 2. Products and Sales Details
    (item.products || []).forEach((p) => {
      let pId = p.productId;
      let pName = p.productName;

      if (!pId && pName) {
        const found = productsList.find((pr) => pr.name === pName);
        if (found) pId = found.id;
      }

      if (pId || pName) {
        const targetQty = Number(p.targetQuantity) || 1;
        const actualQty = Number(p.actualQuantity) || 0;
        const unitPrice = Number(p.unitPrice) || 0;
        const targetAmount = targetQty * unitPrice;
        const actualTotal = Number(p.actualTotal) || actualQty * unitPrice;

        // Generic Plan Product
        planProducts.push({
          workTypeCode: "TYPE_3",
          storeId: resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          targetQuantity: targetQty,
          unitPrice,
          targetAmount,
          notes: p.notes || null,
        });

        // Dedicated Target Product
        targetProducts.push({
          productId: pId,
          productName: pName || null,
          quantity: targetQty,
          targetQuantity: targetQty,
          unitPrice,
          price: targetAmount,
          targetAmount,
          notes: p.notes || null,
        });

        // Actual Result Sale Item
        productSalesDetails.push({
          workTypeCode: "TYPE_3",
          storeId: resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          actualQuantity: actualQty,
          actualQty,
          actualUnitPrice: unitPrice,
          unitPrice,
          actualTotal,
          actualSales: actualTotal,
          unclosedReason: p.unclosedReason || null,
          isAdditional: false,
        });
      }
    });

    // 3. Dedicated Type 3 Target
    type3Targets.push({
      storeId: resolvedStoreId || null,
      isSubDealer,
      subDealerStore: isSubDealer ? item.subDealerStore || null : null,
      notes: item.notes || null,
      products: targetProducts,
    });
  });

  return {
    planStores,
    planProducts,
    productSalesDetails,
    saleResults: productSalesDetails,
    t3ProductSalesDetails: productSalesDetails,
    type3Targets,
    type3Items: type3Targets,
  };
}
