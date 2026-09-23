import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";
import { WORK_TYPES, getWorkTypeName, getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { PlanSummaryData, ActualTargetsState } from "../types";

export interface ExtractedPlanData {
  planSummary: PlanSummaryData;
  resolvedWorkTypes: string[];
  targets: ActualTargetsState;
  t9Extra: {
    mainStore: string;
    isSubDealer: boolean;
    subDealerStore: string;
    productSummary: string;
    totalSales: number;
    items: any[];
  };
  t7StartDate?: string;
  t7PlotIdentifier?: string;
}

export function extractType2Customers(
  items: Array<{ customer?: string; customerName?: string }>,
  location?: string | null,
): { storeName: string; keyFarmer: string } {
  const customerNames = Array.from(
    new Set(
      items
        .map((i) => (i.customer || (i as any).customerName || "").trim())
        .filter(Boolean),
    ),
  );

  const stores: string[] = [];
  const farmers: string[] = [];

  for (const name of customerNames) {
    const isStore =
      name.startsWith("ร้าน") ||
      name.startsWith("บจก.") ||
      name.startsWith("บริษัท") ||
      name.startsWith("สหกรณ์") ||
      name.startsWith("วิสาหกิจ") ||
      name.includes("การค้า") ||
      name.includes("พาณิชย์");

    const isFarmer =
      name.startsWith("หจก.") ||
      name.startsWith("ห้างหุ้นส่วน") ||
      name.startsWith("นาย") ||
      name.startsWith("นาง") ||
      name.startsWith("น.ส.") ||
      name.startsWith("คุณ") ||
      name.includes("สวน") ||
      name.includes("ไร่") ||
      name.includes("แปลง") ||
      name.includes("เกษตรกร");

    if (isStore && !isFarmer) {
      stores.push(name);
    } else if (isFarmer && !isStore) {
      farmers.push(name);
    } else if (isStore) {
      stores.push(name);
    } else if (isFarmer) {
      farmers.push(name);
    } else {
      if (stores.length === 0) {
        stores.push(name);
      } else {
        farmers.push(name);
      }
    }
  }

  if (stores.length === 0 && location && location.trim()) {
    const loc = location.trim();
    if (
      loc.startsWith("ร้าน") ||
      loc.startsWith("บจก.") ||
      loc.startsWith("บริษัท")
    ) {
      stores.push(loc);
    }
  }

  return {
    storeName: stores.join(", "),
    keyFarmer: farmers.join(", "),
  };
}

export const DEFAULT_TARGETS: ActualTargetsState = {
  t1: {
    customer: "",
    topic: "",
    detail: "",
    opportunity: "",
    nextDate: "",
  },
  t2: {
    product: "",
    customer: "",
    detail: "",
    expectedResult: "",
    items: [],
  },
  t3: {
    product: "",
    customer: "",
    targetQty: "",
    targetSales: "",
    items: [],
  },
  t4: {
    customer: "",
    orderNo: "",
    targetCollect: "",
    items: [],
  },
  t5: {
    store: "",
    product: "",
    detail: "",
    items: [],
  },
  t6: {
    customer: "",
    issueType: "",
    detail: "",
    targetStatus: "",
    items: [],
  },
  t7: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t7a: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t7b: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t8: {
    topic: "",
    products: "",
    targetAttendees: "",
  },
  t9: {
    store: "",
    isSubDealer: false,
    subDealerStore: "",
    product: "",
    targetSales: "",
    targetAttendees: "",
    items: [],
  },
  t10: {
    plot: "",
    location: "",
    showcase: "",
    targetAttendees: "",
    targetSales: "",
  },
  t11: {
    store: "",
    detail: "",
    targetOpportunity: "",
  },
};

export function extractPlanData(
  p: ActivityPlanWithRelations,
  prevTargets: ActualTargetsState = DEFAULT_TARGETS,
): ExtractedPlanData {
  const start = p.startDate ? new Date(p.startDate) : new Date();
  const end = p.endDate ? new Date(p.endDate) : new Date();

  // Marketing Product Items from normalized relation
  const mktProductItems = (p.marketingItems || []).map((item) => ({
    id: item.id,
    productName: item.materialName || "สื่อส่งเสริมการขาย",
    quantityCases: item.quantity || 1,
    pricePerCase: item.unitPrice
      ? Number(item.unitPrice)
      : item.totalAmount
        ? Number(item.totalAmount)
        : 0,
  }));

  // Sales Promotion Items from normalized relation
  const salesPromoItems = (p.promotionItems || []).map((item) => ({
    id: item.id,
    detail: item.detail || "รายการส่งเสริมการขาย",
    amount: item.amount ? Number(item.amount) : 0,
    budgetType: item.budgetType || "งบส่งเสริมการขาย",
  }));

  // Helpers from normalized relation
  const extractedHelpers =
    p.helpers && Array.isArray(p.helpers)
      ? p.helpers
          .map((h: any) => {
            const emp = h.employee;
            const id = h.employeeId || emp?.id || h.id || "";
            const rawFullName =
              emp?.name?.trim() ||
              `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim() ||
              h.name ||
              h.employeeName ||
              "";
            const dept =
              emp?.department?.name ||
              emp?.departmentName ||
              h.departmentName ||
              h.department ||
              "";
            const pos =
              emp?.position?.title ||
              emp?.positionTitle ||
              h.positionTitle ||
              h.position ||
              "";

            return {
              id,
              employeeId: id,
              name: rawFullName || "-",
              employeeName: rawFullName || "-",
              departmentName: dept,
              positionTitle: pos,
              status: h.status || "PENDING",
            };
          })
          .filter((h: any) => Boolean(h.name && h.name !== "-"))
      : [];

  const helperNames =
    extractedHelpers.length > 0
      ? extractedHelpers.map((h: any) => h.name)
      : undefined;

  const t7Plot =
    p.demoPlotVisits?.[0]?.demoPlot || (p as any).demoPlot;

  const planSummary: PlanSummaryData = {
    planNo: p.code || "TP-DRAFT",
    title: p.title || "แผนงานกิจกรรม",
    startDateStr: format(start, "d MMMM yyyy", { locale: th }),
    endDateStr: format(end, "d MMMM yyyy", { locale: th }),
    startTimeStr: format(start, "HH:mm"),
    endTimeStr: format(end, "HH:mm"),
    timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
    locationStr: p.location || "ไม่ระบุสถานที่",
    location: p.location || undefined,
    province: p.province || t7Plot?.province || undefined,
    district: p.district || t7Plot?.district || undefined,
    marketingBudget: p.marketingBudgetRequested
      ? Number(p.marketingBudgetRequested)
      : undefined,
    salesPromotionBudget: p.salesPromotionBudgetRequested
      ? Number(p.salesPromotionBudgetRequested)
      : undefined,
    targetSales:
      (p.products || []).reduce(
        (sum, pr) =>
          sum +
          (Number(pr.targetAmount) ||
            (pr.targetQuantity || 0) * (Number(pr.unitPrice) || 0)),
        0,
      ) || undefined,
    isPromotionalMediaSelected: mktProductItems.length > 0,
    marketingProductItems: mktProductItems,
    isSalesPromotionSelected:
      salesPromoItems.length > 0 ||
      (p.salesPromotionBudgetRequested
        ? Number(p.salesPromotionBudgetRequested) > 0
        : false),
    salesPromotionItems: salesPromoItems,
    notes: p.notes || undefined,
    objective: p.objective || undefined,
    helpers: extractedHelpers.length > 0 ? extractedHelpers : undefined,
    helperEmployeeNames: helperNames,
  };

  // 1. Detect ALL selected work types from normalized relations
  const detectedWorkTypes = new Set<string>();

  const hasNormalizedWorkTypes =
    p.workTypes && Array.isArray(p.workTypes) && p.workTypes.length > 0;

  if (hasNormalizedWorkTypes) {
    for (const wt of p.workTypes) {
      const typeName = getWorkTypeName(
        wt.activityType?.code || wt.activityType?.name || wt.activityTypeId,
      );
      if (typeName && WORK_TYPES.includes(typeName)) {
        detectedWorkTypes.add(typeName);
      }
    }
  }

  if (p.tour) {
    detectedWorkTypes.add("ทัวร์");
  }

  // Fallback: only if no work types were resolved from normalized relations
  if (
    detectedWorkTypes.size === 0 ||
    (detectedWorkTypes.size === 1 &&
      detectedWorkTypes.has("ทัวร์") &&
      !hasNormalizedWorkTypes)
  ) {
    // Check normalized stores / products workTypeCode
    if (p.stores && Array.isArray(p.stores)) {
      for (const s of p.stores) {
        const typeName = getWorkTypeName(s.workTypeCode);
        if (typeName && WORK_TYPES.includes(typeName)) {
          detectedWorkTypes.add(typeName);
        }
      }
    }
    if (p.products && Array.isArray(p.products)) {
      for (const pr of p.products) {
        const typeName = getWorkTypeName(pr.workTypeCode);
        if (typeName && WORK_TYPES.includes(typeName)) {
          detectedWorkTypes.add(typeName);
        }
      }
    }

    // Primary activityType
    if (p.activityType) {
      if (typeof p.activityType === "object" && (p.activityType as any).name) {
        const actName = getWorkTypeName(
          (p.activityType as any).code || (p.activityType as any).name,
        );
        if (WORK_TYPES.includes(actName)) {
          detectedWorkTypes.add(actName);
        }
      } else if (
        typeof p.activityType === "object" &&
        (p.activityType as any).id
      ) {
        const idx =
          parseInt(String((p.activityType as any).id).replace("TYPE_", ""), 10) -
          1;
        if (idx >= 0 && idx < WORK_TYPES.length) {
          detectedWorkTypes.add(WORK_TYPES[idx]);
        }
      }
    } else if (p.activityTypeId) {
      const idx = parseInt(String(p.activityTypeId).replace("TYPE_", ""), 10) - 1;
      if (idx >= 0 && idx < WORK_TYPES.length) {
        detectedWorkTypes.add(WORK_TYPES[idx]);
      }
    }
  }

  const resolvedWorkTypes = WORK_TYPES.filter((t: string) =>
    detectedWorkTypes.has(t),
  );

  // 2. Populate targets from Normalized Tables
  const targets: ActualTargetsState = { ...prevTargets };

  const stores = p.stores || [];
  const products = p.products || [];

  const resolvedWorkTypeCodes = new Set(
    resolvedWorkTypes.map((t) => getWorkTypeCode(t)),
  );
  const isWorkTypePresent = (code: string) => resolvedWorkTypeCodes.has(code);

  // TYPE 1: Store / Topic / Detail (Farmer or Store Visit)
  if (isWorkTypePresent("TYPE_1")) {
    const t1Stores = stores.filter((s) => s.workTypeCode === "TYPE_1");
    const t1First = t1Stores[0];
    const t1CustomerName = t1First?.isUnregisteredFarmer
      ? t1First.unregisteredFarmerName || ""
      : (t1First as any)?.store?.name ||
        t1First?.storeName ||
        (t1Stores.length > 0
          ? t1Stores
              .map((s) => (s as any).store?.name || s.storeName)
              .filter(Boolean)
              .join(", ")
          : "") ||
        p.location ||
        "";

    let t1VisitPurpose: "FARMER" | "STORE" = (t1First as any)?.visitPurpose as
      | "FARMER"
      | "STORE";
    if (!t1VisitPurpose) {
      if (
        t1First?.isUnregisteredFarmer ||
        (t1First as any)?.store?.customerType === "FARMER"
      ) {
        t1VisitPurpose = "FARMER";
      } else if (
        ["DEALER", "SUBDEALER"].includes((t1First as any)?.store?.customerType)
      ) {
        t1VisitPurpose = "STORE";
      } else {
        t1VisitPurpose = "FARMER";
      }
    }

    targets.t1 = {
      ...prevTargets.t1,
      visitPurpose: t1VisitPurpose,
      customerType: (t1First as any)?.store?.customerType || undefined,
      customer: t1CustomerName,
      topic: t1First?.remarks || prevTargets.t1.topic,
      detail:
        t1First?.notes ||
        t1Stores
          .map((s) => s.notes)
          .filter(Boolean)
          .join(" | ") ||
        "",
      province:
        t1First?.province ||
        (t1First as any)?.store?.province ||
        p.province ||
        undefined,
      isUnregisteredFarmer: Boolean(t1First?.isUnregisteredFarmer),
      unregisteredFarmerName: t1First?.unregisteredFarmerName || undefined,
      unregisteredFarmerPhone: t1First?.unregisteredFarmerPhone || undefined,
    };
  }

  // TYPE 2: Store / Product / Detail
  if (isWorkTypePresent("TYPE_2")) {
    const t2Stores = stores.filter((s) => s.workTypeCode === "TYPE_2");
    const t2Products = products.filter((pr) => pr.workTypeCode === "TYPE_2");
    const t2StoreCustomerName =
      (t2Stores[0] as any)?.store?.name ||
      t2Stores[0]?.storeName ||
      (t2Stores.length > 0
        ? t2Stores
            .map((s) => (s as any).store?.name || s.storeName)
            .filter(Boolean)
            .join(", ")
        : "") ||
      "";
    const t2Items = t2Products.map((pr) => ({
      id: pr.id,
      productId: pr.productId,
      productName: pr.productName || (pr as any).product?.name || "สินค้า",
      customer:
        (pr as any)?.store?.name || (pr as any)?.storeName || t2StoreCustomerName,
      storeId: pr.storeId || t2Stores[0]?.storeId || undefined,
      detail: (pr as any)?.notes || t2Stores[0]?.notes || "",
      expectedResult: "พืชตอบสนองดี",
      isAdditional: false,
    }));
    const t2CustInfo = extractType2Customers(t2Items, p.location);
    targets.t2 = {
      ...prevTargets.t2,
      customer:
        t2Stores
          .map((s) => s.storeName)
          .filter(Boolean)
          .join(", ") || "",
      storeName: t2CustInfo.storeName,
      keyFarmer: t2CustInfo.keyFarmer,
      product: t2Products
        .map((pr) => pr.productName)
        .filter(Boolean)
        .join(", "),
      detail: t2Stores[0]?.notes || "",
      expectedResult: "พืชตอบสนองดี",
      items: t2Items,
    };
  }

  // TYPE 3: Store / Product / Quantity / Detail / Notes
  if (isWorkTypePresent("TYPE_3")) {
    const t3Stores = stores.filter((s) => s.workTypeCode === "TYPE_3");
    const t3Products = products.filter((pr) => pr.workTypeCode === "TYPE_3");
    const t3Items = t3Products.map((pr) => {
      const qtyVal = pr.targetQuantity != null ? String(pr.targetQuantity) : "";
      const matchedStore =
        t3Stores.find(
          (s) => s.storeId && pr.storeId && s.storeId === pr.storeId,
        ) || t3Stores[0];
      const isSub = Boolean(matchedStore?.subDealerStore);
      const custDisplay = isSub
        ? `${matchedStore?.subDealerStore} (Dealer: ${matchedStore?.storeName || "-"})`
        : matchedStore?.storeName || "";

      return {
        id: pr.id,
        productId: pr.productId,
        productName:
          pr.productName || (pr as any).product?.name || "สินค้าเสนอขาย",
        customer: custDisplay,
        storeId: pr.storeId || matchedStore?.storeId || undefined,
        isSubDealer: isSub,
        subDealerStore: matchedStore?.subDealerStore || "",
        dealerName: matchedStore?.storeName || "",
        qty: qtyVal,
        unitPrice: pr.unitPrice
          ? `${Number(pr.unitPrice).toLocaleString()} บาท`
          : "",
        price: "",
        targetSales: "",
        detail: pr.notes || matchedStore?.notes || "",
        notes: pr.notes || "",
        isAdditional: false,
      };
    });
    const t3TotalQty = t3Products.reduce(
      (sum, pr) => sum + (pr.targetQuantity || 0),
      0,
    );
    const t3PrimaryStore = t3Stores[0];
    const t3PrimaryIsSub = Boolean(t3PrimaryStore?.subDealerStore);
    const t3PrimaryCustDisplay = t3PrimaryIsSub
      ? `${t3PrimaryStore?.subDealerStore} (Dealer: ${t3PrimaryStore?.storeName || "-"})`
      : t3Stores
          .map((s) => s.storeName)
          .filter(Boolean)
          .join(", ") || "";

    targets.t3 = {
      ...prevTargets.t3,
      customer: t3PrimaryCustDisplay,
      isSubDealer: t3PrimaryIsSub,
      subDealerStore: t3PrimaryStore?.subDealerStore || "",
      dealerName: t3PrimaryStore?.storeName || "",
      product: t3Products
        .map((pr) => pr.productName)
        .filter(Boolean)
        .join(", "),
      targetQty: t3TotalQty > 0 ? String(t3TotalQty) : "",
      unitPrice: "",
      detail: t3Products[0]?.notes || t3PrimaryStore?.notes || "",
      targetSales: "",
      items: t3Items,
    };
  }

  // TYPE 4: Store / Target Amount (Collect)
  if (isWorkTypePresent("TYPE_4")) {
    const t4Stores = stores.filter((s) => s.workTypeCode === "TYPE_4");
    const t4CollectAmt = t4Stores.reduce(
      (sum, s) => sum + (Number(s.targetAmount ?? (s as any).collectAmount) || 0),
      0,
    );
    const primaryCollectType =
      t4Stores[0]?.remarks === "BILLING" || t4Stores[0]?.remarks === "วางบิล"
        ? "BILLING"
        : "COLLECT";

    const actualCollectAmount =
      (p as any).result?.collectResultAmount != null
        ? Number((p as any).result.collectResultAmount)
        : null;

    targets.t4 = {
      ...prevTargets.t4,
      customer:
        t4Stores
          .map((s) => s.storeName)
          .filter(Boolean)
          .join(", ") || "",
      targetCollect:
        t4CollectAmt > 0 ? `${t4CollectAmt.toLocaleString()} บาท` : "",
      targetAmountNum: t4CollectAmt,
      collectAmount: t4CollectAmt,
      actualCollectAmount,
      collectType: primaryCollectType,
      orderNo: "",
      items: t4Stores.map((s) => {
        const itemAmt = Number(s.targetAmount ?? (s as any).collectAmount) || 0;
        return {
          id: s.id,
          customer: s.storeName || "",
          companyName: s.storeName || "",
          collectType:
            s.remarks === "BILLING" || s.remarks === "วางบิล"
              ? "BILLING"
              : "COLLECT",
          targetCollect: itemAmt > 0 ? `${itemAmt.toLocaleString()} บาท` : "",
          targetAmountNum: itemAmt,
          collectAmount: itemAmt,
          notes: s.notes || "",
        };
      }),
    };
  }

  // TYPE 5: Store / Product / Survey
  if (isWorkTypePresent("TYPE_5")) {
    const t5Stores = stores.filter((s) => s.workTypeCode === "TYPE_5");
    const t5Products = products.filter((pr) => pr.workTypeCode === "TYPE_5");
    const t5Items = t5Products.map((pr) => {
      const matchedStore =
        t5Stores.find(
          (s) => s.storeId && pr.storeId && s.storeId === pr.storeId,
        ) || t5Stores[0];
      return {
        id: pr.id,
        storeId: pr.storeId || matchedStore?.storeId || undefined,
        store:
          (pr as any)?.store?.name ||
          (pr as any)?.storeName ||
          matchedStore?.storeName ||
          "",
        productId: pr.productId || undefined,
        product: pr.productName || (pr as any)?.product?.name || "",
        detail: (pr as any)?.notes || matchedStore?.notes || "",
      };
    });
    targets.t5 = {
      ...prevTargets.t5,
      storeId: t5Stores[0]?.storeId || undefined,
      store:
        t5Stores
          .map((s) => s.storeName)
          .filter(Boolean)
          .join(", ") || "",
      product: t5Products
        .map((pr) => pr.productName)
        .filter(Boolean)
        .join(", "),
      detail: "",
      items: t5Items,
    } as any;
  }

  // TYPE 6: Store / Issue data
  if (isWorkTypePresent("TYPE_6")) {
    const t6Stores = stores.filter((s) => s.workTypeCode === "TYPE_6");
    targets.t6 = {
      ...prevTargets.t6,
      customer:
        t6Stores
          .map((s) => (s as any).store?.name || s.storeName)
          .filter(Boolean)
          .join(", ") || "",
      issueType:
        t6Stores[0]?.remarks ||
        prevTargets.t6.issueType ||
        "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
      detail:
        t6Stores
          .map((s) => s.notes)
          .filter(Boolean)
          .join(" | ") || "",
      items: t6Stores.map((s) => ({
        customer: (s as any).store?.name || s.storeName || "",
        issueType: s.remarks || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: s.notes || "",
      })),
    };
  }

  // TYPE 7: Demo Plot (TYPE_7A & TYPE_7B)
  const isT7Present =
    isWorkTypePresent("TYPE_7A") ||
    isWorkTypePresent("TYPE_7B") ||
    Boolean(p.demoPlotVisits && p.demoPlotVisits.length > 0);

  let t7StartDate: string | undefined;
  let t7PlotIdentifier: string | undefined;

  if (isT7Present) {
    const t7Visit = p.demoPlotVisits?.[0];
    const t7Plot = t7Visit?.demoPlot || (p as any).demoPlot;
    const t7PlanProduct = products.find(
      (pr) =>
        pr.workTypeCode === "TYPE_7A" ||
        pr.workTypeCode === "TYPE_7B" ||
        pr.workTypeCode === "TYPE_7",
    );
    const resolvedT7ProductId = t7PlanProduct?.productId || undefined;

    if (p.startDate) {
      t7StartDate = new Date(p.startDate).toISOString().split("T")[0];
    }
    t7PlotIdentifier = t7Plot?.id || t7Plot?.ownerName || "";

    const hasT7B =
      isWorkTypePresent("TYPE_7B") ||
      resolvedWorkTypes.includes("ติดตามแปลงสาธิต");

    const commonT7Data = {
      owner: t7Plot?.ownerName || p.location || "",
      product: t7Plot?.primaryProductName || t7PlanProduct?.productName || "",
      productId: resolvedT7ProductId,
      plannedProductId: resolvedT7ProductId,
      crop: t7Plot?.cropName || "",
      plots: t7Plot?.areaRai ? `${Number(t7Plot.areaRai)} ไร่` : "",
      demoProductQuantity:
        t7Visit?.productUsedQty != null ? String(t7Visit.productUsedQty) : "-",
      objective: t7Plot?.objective || "",
      experimentDetail: t7Plot?.experimentDetail || "",
      detail: "",
      targetCondition: "",
      items: t7Plot
        ? [
            {
              activityType: hasT7B ? "FOLLOW_UP" : "CREATE",
              owner: t7Plot.ownerName || "",
              product: t7Plot.primaryProductName || "",
              crop: t7Plot.cropName || "",
              plots: t7Plot.areaRai ? `${Number(t7Plot.areaRai)} ไร่` : "",
              demoProductQuantity:
                t7Visit?.productUsedQty != null
                  ? String(t7Visit.productUsedQty)
                  : "-",
              objective: t7Plot.objective || "",
              experimentDetail: t7Plot.experimentDetail || "",
              detail: "",
            },
          ]
        : [],
    };

    const t7bProducts = products.filter(
      (pr) => pr.workTypeCode === "TYPE_7B",
    );
    const t7aProducts = products.filter(
      (pr) => pr.workTypeCode === "TYPE_7A" || pr.workTypeCode === "TYPE_7",
    );
    const firstT7aProduct = t7aProducts[0];
    const t7aCategory = (firstT7aProduct?.product as any)?.category;

    const t7bDetail =
      (hasT7B ? (p.objective || p.notes) : "") ||
      prevTargets.t7b?.detail ||
      "";

    targets.t7 = {
      ...prevTargets.t7,
      ...commonT7Data,
      activityType: hasT7B || t7Visit ? "FOLLOW_UP" : "CREATE",
      detail: hasT7B ? t7bDetail : commonT7Data.detail,
      dealerName: (t7Plot as any)?.customer?.name || "",
      dealerCode: (t7Plot as any)?.customer?.customerCode || "",
      demoProducts: (hasT7B ? t7bProducts : t7aProducts).map((pr) => ({
        productId: pr.productId,
        productName: pr.productName || (pr.product as any)?.name || "",
        quantity: pr.targetQuantity ?? 1,
        unit: (pr.product as any)?.unit || null,
      })),
    };

    targets.t7a = {
      ...(prevTargets.t7a || prevTargets.t7),
      ...commonT7Data,
      activityType: "CREATE",
      plotName: t7Plot?.name || "",
      dealerName: (t7Plot as any)?.customer?.name || "",
      dealerCode: (t7Plot as any)?.customer?.customerCode || "",
      province: t7Plot?.province || p.province || "",
      district: t7Plot?.district || p.district || "",
      cropCategory: t7Plot?.cropCategory || "",
      areaRai: t7Plot?.areaRai ? Number(t7Plot.areaRai) : null,
      treeCount: t7Plot?.treeCount ?? null,
      categoryName: t7aCategory?.description || t7aCategory?.name || "",
      categoryCode: t7aCategory?.code || "",
      chemicalGroupName: t7aCategory?.description || "",
      demoProducts: t7aProducts.map((pr) => ({
        productId: pr.productId,
        productName: pr.productName || (pr.product as any)?.name || "",
        quantity: pr.targetQuantity ?? 1,
        unit: (pr.product as any)?.unit || null,
      })),
    };

    targets.t7b = {
      ...(prevTargets.t7b || prevTargets.t7),
      ...commonT7Data,
      activityType: "FOLLOW_UP",
      plotName: t7Plot?.name || "",
      plotCode: t7Plot?.code || "",
      dealerName: (t7Plot as any)?.customer?.name || "",
      dealerCode: (t7Plot as any)?.customer?.customerCode || "",
      detail: t7bDetail,
      demoProducts: t7bProducts.map((pr) => ({
        productId: pr.productId,
        productName: pr.productName || (pr.product as any)?.name || "",
        quantity: pr.targetQuantity ?? 1,
        unit: (pr.product as any)?.unit || null,
      })),
    };
  }

  // TYPE 8: Meeting / Attendees
  if (isWorkTypePresent("TYPE_8")) {
    const t8Products = products.filter((pr) => pr.workTypeCode === "TYPE_8");
    targets.t8 = {
      ...prevTargets.t8,
      topic: p.title || "",
      products: t8Products
        .map((pr) => pr.productName)
        .filter(Boolean)
        .join(", "),
      targetAttendees: p.targetAttendeesCount
        ? `${p.targetAttendeesCount} คน`
        : "",
    };
  }

  // TYPE 9: Store / Product / Target Sales
  let t9Extra = {
    mainStore: "",
    isSubDealer: false,
    subDealerStore: "",
    productSummary: "",
    totalSales: 0,
    items: [] as any[],
  };

  if (isWorkTypePresent("TYPE_9")) {
    const t9Stores = stores.filter((s) => s.workTypeCode === "TYPE_9");
    const t9FirstStore = t9Stores[0];
    const t9Products = products.filter((pr) => pr.workTypeCode === "TYPE_9");
    const t9ItemsFromDb = t9Products.map((pr, idx) => ({
      id: pr.id || String(idx + 1),
      productName: pr.productName || "",
      quantityCases: pr.targetQuantity || 0,
      pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
      totalAmount: pr.targetAmount
        ? Number(pr.targetAmount)
        : (pr.targetQuantity || 0) * (Number(pr.unitPrice) || 0),
    }));
    const t9TotalSales = t9ItemsFromDb.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    const t9ProductSummary = t9ItemsFromDb
      .map((prod) => `${prod.productName} (${prod.quantityCases} ลัง)`)
      .join(", ");

    const t9MainStore = t9FirstStore?.storeName || "";
    const t9IsSubDealer = Boolean(t9FirstStore?.subDealerStore);
    const t9SubDealerStore = t9FirstStore?.subDealerStore || "";

    targets.t9 = {
      ...prevTargets.t9,
      store: t9MainStore,
      isSubDealer: t9IsSubDealer,
      subDealerStore: t9SubDealerStore,
      product: t9ProductSummary,
      targetSales: t9TotalSales > 0 ? `${t9TotalSales.toLocaleString()} บาท` : "",
      targetAttendees: p.targetAttendeesCount
        ? `${p.targetAttendeesCount} คน`
        : "",
      items: t9ItemsFromDb,
    };

    t9Extra = {
      mainStore: t9MainStore,
      isSubDealer: t9IsSubDealer,
      subDealerStore: t9SubDealerStore,
      productSummary: t9ProductSummary,
      totalSales: t9TotalSales,
      items: t9ItemsFromDb,
    };
  }

  // TYPE 10: Field Day (Demo plot + Attendees + Booking Sales)
  if (isWorkTypePresent("TYPE_10")) {
    const t10Plot = p.demoPlotVisits?.[0]?.demoPlot;
    targets.t10 = {
      ...prevTargets.t10,
      plot: t10Plot?.ownerName
        ? `${t10Plot.ownerName} (${t10Plot.name || ""})`
        : "",
      location: p.location || prevTargets.t10.location || "",
      showcase:
        t10Plot?.primaryProductName ||
        products.find((pr) => pr.workTypeCode === "TYPE_10")?.productName ||
        "",
      targetAttendees: p.targetAttendeesCount
        ? `${p.targetAttendeesCount} คน`
        : "",
      targetSales: p.targetBookingSales
        ? `฿${Number(p.targetBookingSales).toLocaleString()}`
        : "",
    };
  }

  // TYPE 11: Multiple Stores
  if (isWorkTypePresent("TYPE_11")) {
    const t11Stores = stores.filter((s) => s.workTypeCode === "TYPE_11");
    const t11StoreNames = t11Stores
      .map((s) => s.storeName)
      .filter(Boolean)
      .join(", ");
    targets.t11 = {
      ...prevTargets.t11,
      store: t11StoreNames || "",
      detail:
        t11Stores
          .map((s) => s.remarks || s.notes)
          .filter(Boolean)
          .join(" | ") || "",
      items: t11Stores.map((s) => ({
        store: s.storeName || "",
        detail: s.remarks || s.notes || "",
      })),
    };
  }

  return {
    planSummary,
    resolvedWorkTypes,
    targets,
    t9Extra,
    t7StartDate,
    t7PlotIdentifier,
  };
}
