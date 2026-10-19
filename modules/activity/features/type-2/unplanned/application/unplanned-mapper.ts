import type { CustomerOption, ProductOption } from "../../shared/types";
import type {
  Type2UnplannedItem,
  Type2UnplannedProductItem,
} from "../types/unplanned.types";

/**
 * Hydrates unplanned items (Target + Products + Actual Feedback) from an ActivityPlan record
 */
export function hydrateType2UnplannedData(plan: any): Type2UnplannedItem[] {
  if (!plan) return [];

  const rawAttachments: any[] = plan.attachments || [];
  const plotImages = rawAttachments
    .filter((att) => att.category === "PLOT" || att.category === "GENERAL")
    .map((att) => ({
      id: att.id,
      url: att.fileUrl,
      name: att.fileName || "รูปภาพ",
    }));

  const followupResults: any[] =
    plan.result?.followupResults ||
    plan.followupResults ||
    [];

  // 1. From dedicated table ActivityPlanType2Target
  if (
    plan.type2Targets &&
    Array.isArray(plan.type2Targets) &&
    plan.type2Targets.length > 0
  ) {
    return plan.type2Targets.map((t: any, idx: number) => {
      const isUnregistered = Boolean(t.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? t.unregisteredFarmerName || ""
        : t.store?.name || "";

      const targetProducts: Type2UnplannedProductItem[] = (t.products || []).map(
        (p: any, pIdx: number) => {
          const matchedResult = followupResults.find(
            (f: any) =>
              (f.productId && f.productId === p.productId) ||
              (f.productName && f.productName === p.product?.name),
          );

          return {
            id: p.id || `p-${idx}-${pIdx}`,
            productId: p.productId,
            productName: p.product?.name || "สินค้า",
            notes: p.notes || "",
            usageResult: matchedResult?.usageResult || "",
            followupDetail: matchedResult?.followupDetail || "",
            problemDetail: matchedResult?.problemDetail || "",
            isAdditional: Boolean(matchedResult?.isAdditional),
          };
        },
      );

      return {
        id: t.id || String(idx + 1),
        visitPurpose: (t.visitPurpose as "FARMER" | "STORE") || "FARMER",
        storeId: t.storeId || undefined,
        customerName: customerDisplayName,
        province: t.province || plan.province || "",
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: t.unregisteredFarmerName || "",
        unregisteredFarmerPhone: t.unregisteredFarmerPhone || "",
        notes: t.notes || "",
        products:
          targetProducts.length > 0
            ? targetProducts
            : [
                {
                  id: `p-${idx}-0`,
                  productName: "",
                  notes: "",
                  usageResult: "",
                  followupDetail: "",
                  problemDetail: "",
                },
              ],
        images: plotImages,
      };
    });
  }

  // 2. Fallback: Default single item
  return [
    {
      id: "1",
      visitPurpose: "FARMER",
      province: plan.province || "",
      isUnregisteredFarmer: false,
      storeId: "",
      customerName: "",
      unregisteredFarmerName: "",
      unregisteredFarmerPhone: "",
      notes: "",
      products: [
        {
          id: "p0",
          productName: "",
          notes: "",
          usageResult: "",
          followupDetail: "",
          problemDetail: "",
        },
      ],
      images: plotImages,
    },
  ];
}

/**
 * Maps Type 2 Unplanned items to database payload for savePlan
 */
export function mapType2UnplannedToPayload(
  items: Type2UnplannedItem[],
  customersList: CustomerOption[] = [],
  productsList: ProductOption[] = [],
) {
  const planStores: any[] = [];
  const planProducts: any[] = [];
  const followupResults: any[] = [];

  items.forEach((item) => {
    let resolvedStoreId = item.storeId;
    if (!resolvedStoreId && item.customerName) {
      const found = customersList.find((c) => c.name === item.customerName);
      if (found) resolvedStoreId = found.id;
    }

    // 1. Target Store
    planStores.push({
      workTypeCode: "TYPE_2",
      visitPurpose: item.visitPurpose || "FARMER",
      storeId: item.isUnregisteredFarmer ? null : resolvedStoreId || null,
      storeName: item.customerName || null,
      province: item.province || null,
      isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
      unregisteredFarmerName: item.isUnregisteredFarmer
        ? item.unregisteredFarmerName || null
        : null,
      unregisteredFarmerPhone: item.isUnregisteredFarmer
        ? item.unregisteredFarmerPhone || null
        : null,
      notes: item.notes || null,
    });

    // 2. Tracked Products
    (item.products || []).forEach((p) => {
      let pId = p.productId;
      let pName = p.productName;

      if (!pId && pName) {
        const found = productsList.find((prod) => prod.name === pName);
        if (found) pId = found.id;
      }

      if (pId) {
        planProducts.push({
          workTypeCode: "TYPE_2",
          storeId: item.isUnregisteredFarmer ? null : resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          notes: p.notes || null,
        });

        followupResults.push({
          storeId: item.isUnregisteredFarmer ? null : resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          usageResult: p.usageResult || null,
          followupDetail: p.followupDetail || null,
          problemDetail: p.problemDetail || null,
          isAdditional: Boolean(p.isAdditional),
        });
      }
    });
  });

  return {
    planStores,
    planProducts,
    followupResults,
    t2FollowupResults: followupResults,
  };
}
