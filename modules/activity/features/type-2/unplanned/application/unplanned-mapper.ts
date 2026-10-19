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

  const rawAttachments: any[] = [
    ...(plan.attachments || []),
    ...(plan.result?.attachments || []),
  ];
  const plotImages = rawAttachments
    .filter(
      (att) =>
        att.category === "PLOT" ||
        att.category === "GENERAL" ||
        att.workTypeCode === "TYPE_2" ||
        !att.category,
    )
    .filter(
      (att, idx, arr) =>
        idx ===
        arr.findIndex(
          (a) => (a.fileUrl || a.url) === (att.fileUrl || att.url),
        ),
    )
    .map((att) => ({
      id: att.id,
      url: att.fileUrl || att.url,
      name: att.fileName || att.name || "รูปภาพ",
      size: att.fileSize || att.size || 0,
      type: att.mimeType || att.type || "image/jpeg",
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

      let targetProducts: Type2UnplannedProductItem[] = (t.products || []).map(
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
            usageResult: matchedResult?.usageResult || "ลูกค้าพึงพอใจ",
            followupDetail: matchedResult?.followupDetail || "",
            problemDetail: matchedResult?.problemDetail || "",
            isAdditional: Boolean(matchedResult?.isAdditional),
          };
        },
      );

      // If target had no products in ActivityPlanType2Product, but followupResults has items for this target/store
      if (targetProducts.length === 0 && followupResults.length > 0) {
        const storeFollowups = t.storeId
          ? followupResults.filter((f: any) => f.storeId === t.storeId)
          : followupResults;

        if (storeFollowups.length > 0) {
          targetProducts = storeFollowups.map((f: any, fIdx: number) => ({
            id: f.id || `p-${idx}-${fIdx}`,
            productId: f.productId,
            productName: f.product?.name || f.productName || "สินค้า",
            notes: "",
            usageResult: f.usageResult || "ลูกค้าพึงพอใจ",
            followupDetail: f.followupDetail || "",
            problemDetail: f.problemDetail || "",
            isAdditional: Boolean(f.isAdditional),
          }));
        }
      }

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
                  usageResult: "ลูกค้าพึงพอใจ",
                  followupDetail: "",
                  problemDetail: "",
                },
              ],
        images: plotImages,
      };
    });
  }

  // 1.1 Backward compatibility: From plan.stores / plan.products
  const t2Stores = (plan.stores || []).filter(
    (s: any) => s.workTypeCode === "TYPE_2",
  );
  if (t2Stores.length > 0) {
    return t2Stores.map((s: any, idx: number) => {
      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? s.unregisteredFarmerName || ""
        : s.store?.name || s.storeName || "";

      const storeProducts = (plan.products || []).filter(
        (p: any) =>
          p.workTypeCode === "TYPE_2" &&
          (s.storeId ? p.storeId === s.storeId : true),
      );

      let targetProducts: Type2UnplannedProductItem[] = storeProducts.map(
        (p: any, pIdx: number) => {
          const matchedResult = followupResults.find(
            (f: any) =>
              (f.productId && f.productId === p.productId) ||
              (f.productName &&
                (f.productName === p.product?.name ||
                  f.productName === p.productName)),
          );

          return {
            id: p.id || `p-${idx}-${pIdx}`,
            productId: p.productId,
            productName: p.product?.name || p.productName || "สินค้า",
            notes: p.notes || "",
            usageResult: matchedResult?.usageResult || "ลูกค้าพึงพอใจ",
            followupDetail: matchedResult?.followupDetail || "",
            problemDetail: matchedResult?.problemDetail || "",
            isAdditional: Boolean(matchedResult?.isAdditional),
          };
        },
      );

      if (targetProducts.length === 0 && followupResults.length > 0) {
        const storeFollowups = s.storeId
          ? followupResults.filter((f: any) => f.storeId === s.storeId)
          : followupResults;

        if (storeFollowups.length > 0) {
          targetProducts = storeFollowups.map((f: any, fIdx: number) => ({
            id: f.id || `p-${idx}-${fIdx}`,
            productId: f.productId,
            productName: f.product?.name || f.productName || "สินค้า",
            notes: "",
            usageResult: f.usageResult || "ลูกค้าพึงพอใจ",
            followupDetail: f.followupDetail || "",
            problemDetail: f.problemDetail || "",
            isAdditional: Boolean(f.isAdditional),
          }));
        }
      }

      return {
        id: s.id || String(idx + 1),
        visitPurpose: (s.visitPurpose as "FARMER" | "STORE") || "FARMER",
        storeId: s.storeId || undefined,
        customerName: customerDisplayName,
        province: s.province || plan.province || "",
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: s.unregisteredFarmerName || "",
        unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
        notes: s.notes || "",
        products:
          targetProducts.length > 0
            ? targetProducts
            : [
                {
                  id: `p-${idx}-0`,
                  productName: "",
                  notes: "",
                  usageResult: "ลูกค้าพึงพอใจ",
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
          usageResult: "ลูกค้าพึงพอใจ",
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
  const type2Targets: any[] = [];

  items.forEach((item) => {
    let resolvedStoreId = item.storeId;
    if (!resolvedStoreId && item.customerName) {
      const found = customersList.find((c) => c.name === item.customerName);
      if (found) resolvedStoreId = found.id;
    }

    const isUnregistered = Boolean(item.isUnregisteredFarmer);

    // 1. Target Store (Backward compatibility)
    planStores.push({
      workTypeCode: "TYPE_2",
      visitPurpose: item.visitPurpose || "FARMER",
      storeId: isUnregistered ? null : resolvedStoreId || null,
      storeName: item.customerName || null,
      province: item.province || null,
      isUnregisteredFarmer: isUnregistered,
      unregisteredFarmerName: isUnregistered
        ? item.unregisteredFarmerName || null
        : null,
      unregisteredFarmerPhone: item.isUnregisteredFarmer
        ? item.unregisteredFarmerPhone || null
        : null,
      notes: item.notes || null,
    });

    const targetProducts: any[] = [];

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
          storeId: isUnregistered ? null : resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          notes: p.notes || null,
        });

        const effectiveUsage =
          p.usageResult === "พบปัญหา"
            ? "พบปัญหา"
            : (p.usageResult || "ลูกค้าพึงพอใจ");

        followupResults.push({
          storeId: isUnregistered ? null : resolvedStoreId || null,
          productId: pId,
          productName: pName || null,
          usageResult: effectiveUsage,
          followupDetail:
            effectiveUsage === "พบปัญหา" ? null : (p.followupDetail || null),
          problemDetail:
            effectiveUsage === "พบปัญหา" ? (p.problemDetail || null) : null,
          isAdditional: Boolean(p.isAdditional),
        });

        targetProducts.push({
          productId: pId,
          notes: p.notes || null,
        });
      }
    });

    // 3. Dedicated Type 2 Targets
    type2Targets.push({
      visitPurpose: item.visitPurpose || "FARMER",
      storeId: isUnregistered ? null : resolvedStoreId || null,
      province: item.province || "",
      isUnregisteredFarmer: isUnregistered,
      unregisteredFarmerName: isUnregistered
        ? item.unregisteredFarmerName || null
        : null,
      unregisteredFarmerPhone: item.isUnregisteredFarmer
        ? item.unregisteredFarmerPhone || null
        : null,
      notes: item.notes || null,
      products: targetProducts,
    });
  });

  return {
    planStores,
    planProducts,
    followupResults,
    t2FollowupResults: followupResults,
    type2Targets,
  };
}
