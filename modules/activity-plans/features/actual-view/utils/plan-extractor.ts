import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ActivityPlanWithRelations } from "../../../types";
import { WORK_TYPES, getWorkTypeName } from "../../../constants";
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
    pricePerCase: item.unitPrice ? Number(item.unitPrice) : (item.totalAmount ? Number(item.totalAmount) : 0),
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
    province: p.province || undefined,
    district: p.district || undefined,
    marketingBudget: p.marketingBudgetRequested
      ? Number(p.marketingBudgetRequested)
      : undefined,
    salesPromotionBudget: p.salesPromotionBudgetRequested
      ? Number(p.salesPromotionBudgetRequested)
      : undefined,
    targetSales: (p.products || []).reduce(
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

  if (p.workTypes && Array.isArray(p.workTypes) && p.workTypes.length > 0) {
    for (const wt of p.workTypes) {
      const typeName = wt.activityType?.name || getWorkTypeName(wt.activityType?.code || wt.activityTypeId);
      if (typeName && WORK_TYPES.includes(typeName)) {
        detectedWorkTypes.add(typeName);
      }
    }
  }

  if (p.tour) {
    detectedWorkTypes.add("ทัวร์");
  }

  // Also check normalized stores / products workTypeCode
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
      if (WORK_TYPES.includes((p.activityType as any).name)) {
        detectedWorkTypes.add((p.activityType as any).name);
      }
    } else if (typeof p.activityType === "object" && (p.activityType as any).id) {
      const idx = parseInt(String((p.activityType as any).id).replace("TYPE_", ""), 10) - 1;
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

  const resolvedWorkTypes = WORK_TYPES.filter((t: string) => detectedWorkTypes.has(t));

  // 2. Populate targets from Normalized Tables
  const targets: ActualTargetsState = { ...prevTargets };

  const stores = p.stores || [];
  const products = p.products || [];

  // All store names combined
  const allStoreNames = Array.from(
    new Set(stores.map((s) => s.storeName).filter(Boolean)),
  ).join(", ");

  // TYPE 1: Store / Topic / Detail (Farmer or Store Visit)
  const t1Stores = stores.filter((s) => s.workTypeCode === "TYPE_1");
  const t1First = t1Stores[0];
  const t1CustomerName = t1First?.isUnregisteredFarmer
    ? (t1First.unregisteredFarmerName || "")
    : ((t1First as any)?.store?.name || t1First?.storeName || (t1Stores.length > 0 ? t1Stores.map((s) => (s as any).store?.name || s.storeName).filter(Boolean).join(", ") : "") || allStoreNames || p.location || "");

  // Determine visitPurpose with historical compatibility
  let t1VisitPurpose: "FARMER" | "STORE" = ((t1First as any)?.visitPurpose as "FARMER" | "STORE");
  if (!t1VisitPurpose) {
    if (t1First?.isUnregisteredFarmer || (t1First as any)?.store?.customerType === "FARMER") {
      t1VisitPurpose = "FARMER";
    } else if (["DEALER", "SUBDEALER"].includes((t1First as any)?.store?.customerType)) {
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
    detail: t1First?.notes || t1Stores.map((s) => s.notes).filter(Boolean).join(" | ") || "",
    province: t1First?.province || (t1First as any)?.store?.province || p.province || undefined,
    isUnregisteredFarmer: Boolean(t1First?.isUnregisteredFarmer),
    unregisteredFarmerName: t1First?.unregisteredFarmerName || undefined,
    unregisteredFarmerPhone: t1First?.unregisteredFarmerPhone || undefined,
  };

  // TYPE 2: Store / Product / Detail
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
    allStoreNames ||
    p.location ||
    "";
  const t2Items = t2Products.map((pr) => ({
    id: pr.id,
    productId: pr.productId,
    productName: pr.productName || (pr as any).product?.name || "สินค้า",
    customer: (pr as any)?.store?.name || (pr as any)?.storeName || t2StoreCustomerName,
    storeId: pr.storeId || t2Stores[0]?.storeId || undefined,
    detail: (pr as any)?.notes || t2Stores[0]?.notes || "",
    expectedResult: "พืชตอบสนองดี",
    isAdditional: false,
  }));
  const t2CustInfo = extractType2Customers(t2Items, p.location);
  targets.t2 = {
    ...prevTargets.t2,
    customer:
      t2Stores.map((s) => s.storeName).filter(Boolean).join(", ") ||
      allStoreNames ||
      p.location ||
      "",
    storeName: t2CustInfo.storeName,
    keyFarmer: t2CustInfo.keyFarmer,
    product: t2Products.map((pr) => pr.productName).filter(Boolean).join(", "),
    detail: t2Stores[0]?.notes || "",
    expectedResult: "พืชตอบสนองดี",
    items: t2Items,
  };

  // TYPE 3: Store / Product / Quantity / Detail / Notes
  const t3Stores = stores.filter((s) => s.workTypeCode === "TYPE_3");
  const t3Products = products.filter((pr) => pr.workTypeCode === "TYPE_3");
  const t3Items = t3Products.map((pr) => {
    const qtyVal = pr.targetQuantity != null ? String(pr.targetQuantity) : "";
    const matchedStore = t3Stores.find((s) => s.storeId && pr.storeId && s.storeId === pr.storeId) || t3Stores[0];
    const isSub = Boolean(matchedStore?.subDealerStore);
    const custDisplay = isSub
      ? `${matchedStore?.subDealerStore} (Dealer: ${matchedStore?.storeName || "-"})`
      : matchedStore?.storeName || allStoreNames || p.location || "";

    return {
      id: pr.id,
      productId: pr.productId,
      productName: pr.productName || (pr as any).product?.name || "สินค้าเสนอขาย",
      customer: custDisplay,
      storeId: pr.storeId || matchedStore?.storeId || undefined,
      isSubDealer: isSub,
      subDealerStore: matchedStore?.subDealerStore || "",
      dealerName: matchedStore?.storeName || "",
      qty: qtyVal,
      unitPrice: pr.unitPrice ? `${Number(pr.unitPrice).toLocaleString()} บาท` : "",
      price: "",
      targetSales: "",
      detail: pr.notes || matchedStore?.notes || "",
      notes: pr.notes || "",
      isAdditional: false,
    };
  });
  const t3TotalQty = t3Products.reduce((sum, pr) => sum + (pr.targetQuantity || 0), 0);
  const t3PrimaryStore = t3Stores[0];
  const t3PrimaryIsSub = Boolean(t3PrimaryStore?.subDealerStore);
  const t3PrimaryCustDisplay = t3PrimaryIsSub
    ? `${t3PrimaryStore?.subDealerStore} (Dealer: ${t3PrimaryStore?.storeName || "-"})`
    : t3Stores.map((s) => s.storeName).filter(Boolean).join(", ") || allStoreNames || p.location || "";

  targets.t3 = {
    ...prevTargets.t3,
    customer: t3PrimaryCustDisplay,
    isSubDealer: t3PrimaryIsSub,
    subDealerStore: t3PrimaryStore?.subDealerStore || "",
    dealerName: t3PrimaryStore?.storeName || "",
    product: t3Products.map((pr) => pr.productName).filter(Boolean).join(", "),
    targetQty: t3TotalQty > 0 ? String(t3TotalQty) : "",
    unitPrice: "",
    detail: t3Products[0]?.notes || t3PrimaryStore?.notes || "",
    targetSales: "",
    items: t3Items,
  };

  // TYPE 4: Store / Target Amount (Collect)
  const t4Stores = stores.filter((s) => s.workTypeCode === "TYPE_4");
  const t4CollectAmt = t4Stores.reduce((sum, s) => sum + (Number(s.targetAmount) || 0), 0);
  targets.t4 = {
    ...prevTargets.t4,
    customer: t4Stores.map((s) => s.storeName).filter(Boolean).join(", ") || allStoreNames || "",
    targetCollect: t4CollectAmt > 0 ? `${t4CollectAmt.toLocaleString()} บาท` : "",
    orderNo: "",
    items: t4Stores.map((s) => ({
      id: s.id,
      customer: s.storeName || "",
      targetCollect: s.targetAmount ? `${Number(s.targetAmount).toLocaleString()} บาท` : "",
    })),
  };

  // TYPE 5: Store / Product / Survey
  const t5Stores = stores.filter((s) => s.workTypeCode === "TYPE_5");
  const t5Products = products.filter((pr) => pr.workTypeCode === "TYPE_5");
  const t5Items = t5Products.map((pr) => ({
    id: pr.id,
    store: t5Stores[0]?.storeName || p.location || "",
    product: pr.productName || "",
    detail: "",
  }));
  targets.t5 = {
    ...prevTargets.t5,
    store: t5Stores.map((s) => s.storeName).filter(Boolean).join(", ") || allStoreNames || p.location || "",
    product: t5Products.map((pr) => pr.productName).filter(Boolean).join(", "),
    detail: "",
    items: t5Items,
  };

  // TYPE 6: Store / Issue data
  const t6Stores = stores.filter((s) => s.workTypeCode === "TYPE_6");
  targets.t6 = {
    ...prevTargets.t6,
    customer: t6Stores.map((s) => s.storeName).filter(Boolean).join(", ") || allStoreNames || p.location || "",
    issueType: t6Stores[0]?.remarks || prevTargets.t6.issueType || "เคลมของ",
    detail: t6Stores.map((s) => s.notes).filter(Boolean).join(" | ") || "",
    items: t6Stores.map((s) => ({
      customer: s.storeName || "",
      issueType: s.remarks || "เคลมของ",
      detail: s.notes || "",
    })),
  };

  // TYPE 7: Demo Plot
  const t7Visit = p.demoPlotVisits?.[0];
  const t7Plot = t7Visit?.demoPlot;
  const t7PlanProduct = products.find((pr) => pr.workTypeCode === "TYPE_7");
  const resolvedT7ProductId = t7PlanProduct?.productId || undefined;

  let t7StartDate: string | undefined;
  if (p.startDate) {
    t7StartDate = new Date(p.startDate).toISOString().split("T")[0];
  }
  const t7PlotIdentifier = t7Plot?.id || t7Plot?.ownerName || "";

  targets.t7 = {
    ...prevTargets.t7,
    activityType: t7Visit ? "FOLLOWUP" : "CREATE",
    owner: t7Plot?.ownerName || p.location || "",
    product: t7Plot?.primaryProductName || t7PlanProduct?.productName || "",
    productId: resolvedT7ProductId,
    plannedProductId: resolvedT7ProductId,
    crop: t7Plot?.cropName || "",
    plots: t7Plot?.areaRai ? `${Number(t7Plot.areaRai)} ไร่` : "",
    demoProductQuantity: t7Visit?.productUsedQty != null ? String(t7Visit.productUsedQty) : "-",
    objective: t7Plot?.objective || "",
    experimentDetail: t7Plot?.experimentDetail || "",
    detail: "",
    targetCondition: "",
    items: t7Plot
      ? [
          {
            activityType: t7Visit ? "FOLLOWUP" : "CREATE",
            owner: t7Plot.ownerName || "",
            product: t7Plot.primaryProductName || "",
            crop: t7Plot.cropName || "",
            plots: t7Plot.areaRai ? `${Number(t7Plot.areaRai)} ไร่` : "",
            demoProductQuantity: t7Visit?.productUsedQty != null ? String(t7Visit.productUsedQty) : "-",
            objective: t7Plot.objective || "",
            experimentDetail: t7Plot.experimentDetail || "",
            detail: "",
          },
        ]
      : [],
  };

  // TYPE 8: Meeting / Attendees
  const t8Products = products.filter((pr) => pr.workTypeCode === "TYPE_8");
  targets.t8 = {
    ...prevTargets.t8,
    topic: p.title || "",
    products: t8Products.map((pr) => pr.productName).filter(Boolean).join(", "),
    targetAttendees: p.targetAttendeesCount ? `${p.targetAttendeesCount} คน` : "",
  };

  // TYPE 9: Store / Product / Target Sales
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
  const t9TotalSales = t9ItemsFromDb.reduce((sum, item) => sum + item.totalAmount, 0);
  const t9ProductSummary = t9ItemsFromDb
    .map((prod) => `${prod.productName} (${prod.quantityCases} ลัง)`)
    .join(", ");

  const t9MainStore = t9FirstStore?.storeName || allStoreNames || p.location || "";
  const t9IsSubDealer = Boolean(t9FirstStore?.subDealerStore);
  const t9SubDealerStore = t9FirstStore?.subDealerStore || "";

  targets.t9 = {
    ...prevTargets.t9,
    store: t9MainStore,
    isSubDealer: t9IsSubDealer,
    subDealerStore: t9SubDealerStore,
    product: t9ProductSummary,
    targetSales: t9TotalSales > 0 ? `${t9TotalSales.toLocaleString()} บาท` : "",
    targetAttendees: p.targetAttendeesCount ? `${p.targetAttendeesCount} คน` : "",
    items: t9ItemsFromDb,
  };

  // TYPE 10: Field Day (Demo plot + Attendees + Booking Sales)
  const t10Plot = p.demoPlotVisits?.[0]?.demoPlot;
  targets.t10 = {
    ...prevTargets.t10,
    plot: t10Plot?.ownerName ? `${t10Plot.ownerName} (${t10Plot.name || ""})` : p.location || "",
    location: p.location || prevTargets.t10.location || "",
    showcase: t10Plot?.primaryProductName || products.find((pr) => pr.workTypeCode === "TYPE_10")?.productName || "",
    targetAttendees: p.targetAttendeesCount ? `${p.targetAttendeesCount} คน` : "",
    targetSales: p.targetBookingSales ? `฿${Number(p.targetBookingSales).toLocaleString()}` : "",
  };

  // TYPE 11: Multiple Stores
  const t11Stores = stores.filter((s) => s.workTypeCode === "TYPE_11");
  const t11StoreNames = t11Stores.map((s) => s.storeName).filter(Boolean).join(", ");
  targets.t11 = {
    ...prevTargets.t11,
    store: t11StoreNames || allStoreNames || "",
    detail: t11Stores.map((s) => s.remarks || s.notes).filter(Boolean).join(" | ") || "",
  };

  return {
    planSummary,
    resolvedWorkTypes,
    targets,
    t9Extra: {
      mainStore: t9MainStore,
      isSubDealer: t9IsSubDealer,
      subDealerStore: t9SubDealerStore,
      productSummary: t9ProductSummary,
      totalSales: t9TotalSales,
      items: t9ItemsFromDb,
    },
    t7StartDate,
    t7PlotIdentifier,
  };
}
