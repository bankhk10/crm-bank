import type {
  Type2TargetItem,
  FollowupProductItem,
  Type2ImageFile,
} from "../types";

/**
 * Extract Type 2 targets from an ActivityPlan (supporting Multi-Target: Stores and Farmers)
 */
export function extractType2PlanTargets(
  plan: any,
  prevTarget?: Type2TargetItem,
): {
  primary: Type2TargetItem;
  list: Type2TargetItem[];
} {
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const products: any[] = plan?.planProducts || plan?.products || [];

  const t2Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_2" || s.workTypeCode === "ติดตามผลการใช้สินค้า",
  );
  const t2Products = products.filter(
    (pr) => !pr.workTypeCode || pr.workTypeCode === "TYPE_2" || pr.workTypeCode === "ติดตามผลการใช้สินค้า",
  );

  const fallbackItem: Type2TargetItem = {
    customer: "",
    detail: "",
    expectedResult: "พืชตอบสนองดี",
    items: [],
    ...prevTarget,
  };

  if (t2Stores.length === 0 && t2Products.length === 0) {
    return {
      primary: fallbackItem,
      list: [],
    };
  }

  // 1. Support loading directly from dedicated table ActivityPlanType2Target
  if (plan?.type2Targets && Array.isArray(plan.type2Targets) && plan.type2Targets.length > 0) {
    const list: Type2TargetItem[] = plan.type2Targets.map((t: any) => {
      const isUnregistered = Boolean(t.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? t.unregisteredFarmerName || "เกษตรกรทั่วไป (ไม่ระบุชื่อ)"
        : t.store?.name || "ร้านค้า/เกษตรกร";

      const items: FollowupProductItem[] = (t.products || []).map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.name || "สินค้า",
        customer: customerDisplayName,
        storeId: t.storeId || undefined,
        detail: p.notes || t.notes || "",
        expectedResult: "พืชตอบสนองดี",
        isAdditional: false,
      }));

      return {
        id: t.id,
        storeId: t.storeId || undefined,
        storeName: t.store?.name || undefined,
        customer: customerDisplayName,
        keyFarmer: isUnregistered ? t.unregisteredFarmerName : undefined,
        province: t.province || t.store?.province || plan?.province || plan?.location || undefined,
        visitPurpose: t.visitPurpose,
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: t.unregisteredFarmerName || undefined,
        unregisteredFarmerPhone: t.unregisteredFarmerPhone || t.store?.phone || undefined,
        detail: t.notes || "",
        expectedResult: "พืชตอบสนองดี",
        product: (t.products || []).map((p: any) => p.product?.name).filter(Boolean).join(", "),
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // 2. Fallback: Stores from generic tables
  if (t2Stores.length > 0) {
    const list: Type2TargetItem[] = t2Stores.map((s, idx) => {
      // Find products associated with this store (by storeId, or if single store, all products)
      const matchedProducts = t2Stores.length === 1
        ? t2Products
        : t2Products.filter((p) => p.storeId && s.storeId && p.storeId === s.storeId);

      // If matchedProducts is empty but products exist without storeId, and this is first store, associate them
      const effectiveProducts = matchedProducts.length > 0
        ? matchedProducts
        : (idx === 0 && t2Products.some((p) => !p.storeId)
            ? t2Products.filter((p) => !p.storeId)
            : []);

      const items: FollowupProductItem[] = effectiveProducts.map((pr) => ({
        id: pr.id,
        productId: pr.productId,
        productName: pr.productName || (pr as any).product?.name || "สินค้า",
        customer: s.storeName || (s as any).store?.name || (s.isUnregisteredFarmer ? s.unregisteredFarmerName : "") || "",
        storeId: s.storeId || undefined,
        detail: pr.notes || s.notes || "",
        expectedResult: "พืชตอบสนองดี",
        isAdditional: false,
      }));

      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const customerDisplayName = isUnregistered
        ? s.unregisteredFarmerName || "เกษตรกรทั่วไป (ไม่ระบุชื่อ)"
        : s.storeName || (s as any).store?.name || "ร้านค้า/เกษตรกร";

      let visitPurpose: "FARMER" | "STORE" = s.visitPurpose as ("FARMER" | "STORE");
      if (!visitPurpose) {
        if (isUnregistered || (s as any)?.store?.customerType === "FARMER") {
          visitPurpose = "FARMER";
        } else {
          visitPurpose = "STORE";
        }
      }

      return {
        id: s.id || `t2-store-${idx}`,
        storeId: s.storeId || undefined,
        storeName: s.storeName || (s as any).store?.name || undefined,
        customer: customerDisplayName,
        keyFarmer: isUnregistered ? s.unregisteredFarmerName : undefined,
        province: s.province || (s as any)?.store?.province || plan?.province || plan?.location || undefined,
        visitPurpose,
        isUnregisteredFarmer: isUnregistered,
        unregisteredFarmerName: s.unregisteredFarmerName || undefined,
        unregisteredFarmerPhone: s.unregisteredFarmerPhone || (s as any)?.store?.phone || undefined,
        detail: s.notes || s.remarks || "",
        expectedResult: "พืชตอบสนองดี",
        product: effectiveProducts.map((p) => p.productName || (p as any).product?.name).filter(Boolean).join(", "),
        items,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // Fallback: Products exist but no stores defined
  const items: FollowupProductItem[] = t2Products.map((pr) => ({
    id: pr.id,
    productId: pr.productId,
    productName: pr.productName || (pr as any).product?.name || "สินค้า",
    customer: (pr as any)?.store?.name || pr.storeName || "ลูกค้าทั่วไป",
    storeId: pr.storeId || undefined,
    detail: pr.notes || "",
    expectedResult: "พืชตอบสนองดี",
    isAdditional: false,
  }));

  const singleTarget: Type2TargetItem = {
    customer: items[0]?.customer || "ลูกค้าทั่วไป",
    product: t2Products.map((p) => p.productName || (p as any).product?.name).filter(Boolean).join(", "),
    detail: t2Products[0]?.notes || "",
    expectedResult: "พืชตอบสนองดี",
    province: plan?.province || plan?.location || undefined,
    items,
  };

  return {
    primary: singleTarget,
    list: [singleTarget],
  };
}

/**
 * Parse Type 2 Actual Results from raw backend ActivityResult payload
 */
export function parseType2ActualResult(resData: any): {
  t2CustomerName?: string;
  t2UsageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  t2FollowupDetail?: string;
  t2ProblemDetail?: string;
  t2FollowupResults?: FollowupProductItem[];
  t2Images?: Type2ImageFile[];
} {
  const result: {
    t2CustomerName?: string;
    t2UsageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
    t2FollowupDetail?: string;
    t2ProblemDetail?: string;
    t2FollowupResults?: FollowupProductItem[];
    t2Images?: Type2ImageFile[];
  } = {};

  if (!resData) return result;

  // 1. Parse from summary text if present
  const summaryText = resData.actualSummary || "";
  const custMatch = summaryText.match(/ลูกค้า\/ร้านค้า:\s*(.+)/);
  if (custMatch && custMatch[1]) {
    result.t2CustomerName = custMatch[1].split("\n")[0].trim();
  }

  const usageMatch = summaryText.match(/ผลการใช้สินค้า:\s*(.+)/);
  if (usageMatch && usageMatch[1]) {
    const val = usageMatch[1].split("\n")[0].trim();
    if (val === "ลูกค้าพึงพอใจ" || val === "พืชตอบสนองดี" || val === "พบปัญหา") {
      result.t2UsageResult = val;
    }
  }

  const followupMatch = summaryText.match(/รายละเอียดการติดตาม:\s*(.+)/);
  if (followupMatch && followupMatch[1]) {
    result.t2FollowupDetail = followupMatch[1].split("\n")[0].trim();
  }

  const problemMatch = summaryText.match(/ปัญหาการใช้สินค้า:\s*(.+)/);
  if (problemMatch && problemMatch[1]) {
    result.t2ProblemDetail = problemMatch[1].split("\n")[0].trim();
  }

  // 2. Structured followupResults
  if (
    resData.followupResults &&
    Array.isArray(resData.followupResults) &&
    resData.followupResults.length > 0
  ) {
    result.t2FollowupResults = resData.followupResults.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || "สินค้า",
      customer: item.store?.name || undefined,
      storeId: item.storeId || undefined,
      usageResult: item.usageResult === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ",
      followupDetail: item.followupDetail || "",
      problemDetail: item.problemDetail || "",
      isAdditional: Boolean(item.isAdditional),
    }));
  }

  // 3. Attachments
  if (resData.attachments && Array.isArray(resData.attachments)) {
    const t2Att = resData.attachments.filter(
      (a: any) => a.workTypeCode === "TYPE_2" || a.workTypeCode === "ติดตามผลการใช้สินค้า",
    );
    if (t2Att.length > 0) {
      result.t2Images = t2Att.map((a: any) => ({
        id: a.id || `t2-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: a.fileUrl || "",
        name: a.fileName || "รูปภาพ",
        size: a.fileSize || undefined,
        type: a.mimeType || undefined,
        workTypeCode: a.workTypeCode,
        storeId: a.storeId || undefined,
        targetId: a.targetId || undefined,
      }));
    }
  }

  return result;
}

/**
 * Map Type 2 Stores & Products to Section Items for Detail View
 */
export function mapType2ToSectionItems(
  stores: any[],
  products: any[],
): Array<{ title: string; subtitle?: string; details?: string }> {
  const type2Stores = stores.filter(
    (s) => !s.workTypeCode || s.workTypeCode === "TYPE_2" || s.workTypeCode === "ติดตามผลการใช้สินค้า",
  );
  const type2Products = products.filter(
    (pr) => !pr.workTypeCode || pr.workTypeCode === "TYPE_2" || pr.workTypeCode === "ติดตามผลการใช้สินค้า",
  );

  if (type2Stores.length === 0 && type2Products.length === 0) {
    return [];
  }

  // Group by store if stores exist
  if (type2Stores.length > 0) {
    return type2Stores.map((s, idx) => {
      const matchedProducts = type2Stores.length === 1
        ? type2Products
        : type2Products.filter((p) => p.storeId && s.storeId && p.storeId === s.storeId);

      const effectiveProducts = matchedProducts.length > 0
        ? matchedProducts
        : (idx === 0 && type2Products.some((p) => !p.storeId)
            ? type2Products.filter((p) => !p.storeId)
            : []);

      const productNames = effectiveProducts.map((p) => p.productName || (p as any).product?.name).filter(Boolean).join(", ");
      const isUnregistered = Boolean(s.isUnregisteredFarmer);
      const custName = isUnregistered
        ? s.unregisteredFarmerName || "เกษตรกรทั่วไป"
        : s.storeName || (s as any).store?.name || "ร้านค้า/เกษตรกร";

      const detailsParts = [
        s.province ? `จังหวัด: ${s.province}` : null,
        s.unregisteredFarmerPhone ? `โทร: ${s.unregisteredFarmerPhone}` : null,
        productNames ? `สินค้า: ${productNames}` : null,
        s.notes ? `รายละเอียด: ${s.notes}` : null,
      ].filter(Boolean);

      return {
        title: custName,
        subtitle: isUnregistered ? "เกษตรกรทั่วไป (ไม่ได้ลงทะเบียน)" : "ร้านค้า / เกษตรกร",
        details: detailsParts.length > 0 ? detailsParts.join(" • ") : undefined,
      };
    });
  }

  // Fallback: Products only
  return type2Products.map((pr) => ({
    title: pr.productName || (pr as any).product?.name || "สินค้า",
    subtitle: undefined,
    details: pr.notes || undefined,
  }));
}
