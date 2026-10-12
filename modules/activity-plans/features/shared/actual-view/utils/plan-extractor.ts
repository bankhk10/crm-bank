import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ActivityPlanWithRelations } from "@/modules/activity-plans/types";
import { WORK_TYPES, getWorkTypeName, getWorkTypeCode } from "@/modules/activity-plans/constants";
import { decodeType8StoreNotes } from "@/modules/activity-plans/features/type-8/shared/type8-notes";
import { extractType1PlanTargets } from "@/modules/activity-plans/features/type-1";
import { extractType2PlanTargets } from "@/modules/activity-plans/features/type-2";
import { extractType3PlanTargets } from "@/modules/activity-plans/features/type-3";
import { extractType4PlanTargets } from "@/modules/activity-plans/features/type-4";
import { extractType5PlanTargets } from "@/modules/activity-plans/features/type-5";
import { extractType6PlanTargets } from "@/modules/activity-plans/features/type-6";
import { extractType7aPlanTargets } from "@/modules/activity-plans/features/type-7a";
import { extractType7bPlanTargets } from "@/modules/activity-plans/features/type-7b";
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
    province: "",
    unregisteredFarmerPhone: "",
    unregisteredFarmerName: "",
    isUnregisteredFarmer: false,
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
    stores: (p.stores || []).map((s: any) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      workTypeCode: s.workTypeCode,
    })),
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

  if ((p as any).type13) {
    detectedWorkTypes.add("ฉีดแปลงแฮตแทค");
  }

  if ((p as any).type14) {
    detectedWorkTypes.add("ติดตามแปลงแฮทแทค");
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

  // TYPE 1: Store / Topic / Detail (Delegated to Type 1 Feature Slice)
  if (isWorkTypePresent("TYPE_1")) {
    const { primary, list } = extractType1PlanTargets(p, prevTargets.t1);
    targets.t1 = primary;
    targets.t1List = list;
  }

  // TYPE 2: Store / Product / Detail (Delegated to Type 2 Feature Slice)
  if (isWorkTypePresent("TYPE_2")) {
    const { primary, list } = extractType2PlanTargets(p, prevTargets.t2);
    targets.t2 = primary;
    targets.t2List = list;
  }

  // TYPE 3: Store / Product / Quantity / Detail / Notes (Delegated to Type 3 Feature Slice)
  if (isWorkTypePresent("TYPE_3")) {
    const { primary, list } = extractType3PlanTargets(p, prevTargets.t3);
    targets.t3 = primary;
    targets.t3List = list;
  }

  // TYPE 4: Store / Target Amount (Collect) (Delegated to Type 4 Feature Slice)
  if (isWorkTypePresent("TYPE_4")) {
    const { primary, list } = extractType4PlanTargets(p, prevTargets.t4);
    targets.t4 = primary;
    targets.t4List = list;
  }

  // TYPE 5: Store / Product / Survey (Delegated to Type 5 Feature Slice)
  if (isWorkTypePresent("TYPE_5")) {
    const { primary, list } = extractType5PlanTargets(p, prevTargets.t5);
    targets.t5 = primary;
    targets.t5List = list;
  }

  // TYPE 6: Store / Issue data
  if (isWorkTypePresent("TYPE_6") || Boolean((p as any).type6Targets && (p as any).type6Targets.length > 0)) {
    const { primary, list } = extractType6PlanTargets(p, prevTargets.t6);
    targets.t6 = primary;
    targets.t6List = list;
  }

  // TYPE 7: Demo Plot (TYPE_7A & TYPE_7B)
  const isT7Present =
    isWorkTypePresent("TYPE_7A") ||
    isWorkTypePresent("TYPE_7B") ||
    Boolean(p.demoPlotVisits && p.demoPlotVisits.length > 0) ||
    Boolean((p as any).type7aPlots && (p as any).type7aPlots.length > 0) ||
    Boolean((p as any).type7b);

  let t7StartDate: string | undefined;
  let t7PlotIdentifier: string | undefined;

  if (isT7Present) {
    const t7aPlotsList: any[] = (p as any).type7aPlots || [];
    const t7bRecord: any = (p as any).type7b;

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
    t7PlotIdentifier =
      t7aPlotsList[0]?.demoPlotId ||
      t7aPlotsList[0]?.demoPlot?.id ||
      t7bRecord?.demoPlotId ||
      t7Plot?.id ||
      t7Plot?.ownerName ||
      "";

    const hasT7B =
      isWorkTypePresent("TYPE_7B") ||
      resolvedWorkTypes.includes("ติดตามแปลงสาธิต") ||
      Boolean(t7bRecord);

    const firstT7aPlot = t7aPlotsList[0];
    const firstT7bPlot = t7bRecord?.plots?.[0];

    const commonT7Data = {
      owner:
        firstT7aPlot?.ownerName ||
        firstT7aPlot?.store?.name ||
        firstT7bPlot?.farmerName ||
        t7Plot?.ownerName ||
        p.location ||
        "",
      product:
        t7Plot?.primaryProductName ||
        t7PlanProduct?.productName ||
        firstT7aPlot?.products?.[0]?.product?.name ||
        firstT7bPlot?.cropName ||
        "",
      productId:
        firstT7aPlot?.products?.[0]?.productId ||
        resolvedT7ProductId ||
        undefined,
      plannedProductId:
        firstT7aPlot?.products?.[0]?.productId ||
        resolvedT7ProductId ||
        undefined,
      crop:
        firstT7aPlot?.cropName ||
        firstT7bPlot?.cropName ||
        t7Plot?.cropName ||
        "",
      plots: firstT7aPlot?.areaRai
        ? `${Number(firstT7aPlot.areaRai)} ไร่`
        : firstT7bPlot?.areaRai
          ? `${Number(firstT7bPlot.areaRai)} ไร่`
          : t7Plot?.areaRai
            ? `${Number(t7Plot.areaRai)} ไร่`
            : "",
      demoProductQuantity:
        t7Visit?.productUsedQty != null ? String(t7Visit.productUsedQty) : "-",
      objective:
        firstT7aPlot?.objective ||
        t7bRecord?.notes ||
        t7Plot?.objective ||
        "",
      experimentDetail: t7Plot?.experimentDetail || "",
      detail: "",
      targetCondition: "",
      items: t7aPlotsList.length > 0
        ? t7aPlotsList.map((plot) => ({
            activityType: "CREATE" as const,
            owner: plot.ownerName || plot.store?.name || "",
            product: plot.products?.[0]?.product?.name || "",
            crop: plot.cropName || "",
            plots: plot.areaRai ? `${Number(plot.areaRai)} ไร่` : "",
            demoProductQuantity: "-",
            objective: plot.objective || "",
            experimentDetail: "",
            detail: "",
          }))
        : t7Plot
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

    const t7bProducts = t7bRecord?.products?.length > 0
      ? t7bRecord.products.map((p: any) => ({
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity:
            p.quantity != null
              ? Number(p.quantity)
              : p.targetQuantity != null
                ? Number(p.targetQuantity)
                : 1,
          targetQuantity:
            p.targetQuantity != null
              ? Number(p.targetQuantity)
              : p.quantity != null
                ? Number(p.quantity)
                : 1,
          unit: p.unit || p.product?.unit || null,
          product: p.product,
        }))
      : products.filter((pr) => pr.workTypeCode === "TYPE_7B");

    const t7aProducts = firstT7aPlot?.products?.length > 0
      ? firstT7aPlot.products.map((p: any) => ({
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity:
            p.quantity != null
              ? Number(p.quantity)
              : p.targetQuantity != null
                ? Number(p.targetQuantity)
                : 1,
          targetQuantity:
            p.targetQuantity != null
              ? Number(p.targetQuantity)
              : p.quantity != null
                ? Number(p.quantity)
                : 1,
          unit: p.unit || p.product?.unit || null,
          product: p.product,
        }))
      : products.filter(
          (pr) => pr.workTypeCode === "TYPE_7A" || pr.workTypeCode === "TYPE_7",
        );

    const firstT7aProduct = t7aProducts[0];
    const t7aCategory = (firstT7aProduct?.product as any)?.category;

    const t7bDetail =
      t7bRecord?.objective ||
      t7bRecord?.notes ||
      (hasT7B ? (p.objective || p.notes) : "") ||
      prevTargets.t7b?.detail ||
      "";

    targets.t7 = {
      ...prevTargets.t7,
      ...commonT7Data,
      activityType: hasT7B || t7Visit ? "FOLLOW_UP" : "CREATE",
      detail: hasT7B ? t7bDetail : commonT7Data.detail,
      objective: hasT7B ? t7bDetail : commonT7Data.objective,
      dealerName:
        firstT7aPlot?.store?.name ||
        firstT7bPlot?.dealerStoreName ||
        (t7Plot as any)?.customer?.name ||
        "",
      dealerCode: (t7Plot as any)?.customer?.customerCode || "",
      demoProducts: (hasT7B ? t7bProducts : t7aProducts).map((pr: any) => ({
        productId: pr.productId,
        productName: pr.productName || (pr.product as any)?.name || "",
        quantity: pr.quantity ?? pr.targetQuantity ?? 1,
        targetQuantity: pr.targetQuantity ?? pr.quantity ?? 1,
        unit: pr.unit || (pr.product as any)?.unit || null,
      })),
    };

    const t7aExtracted = extractType7aPlanTargets(p, prevTargets.t7a || prevTargets.t7);
    targets.t7a = t7aExtracted.primary;
    targets.t7aList = t7aExtracted.list;

    const t7bExtracted = extractType7bPlanTargets(p, prevTargets.t7b || prevTargets.t7);
    targets.t7b = t7bExtracted.primary;
    targets.t7bList = t7bExtracted.list;
  }

  // TYPE 8: Meeting / Attendees
  if (isWorkTypePresent("TYPE_8")) {
    const t8Products = products.filter((pr) => pr.workTypeCode === "TYPE_8");
    const t8PromoProducts = products.filter(
      (pr) => pr.workTypeCode === "TYPE_8_PROMOTION",
    );
    const t8Stores = stores.filter((s) => s.workTypeCode === "TYPE_8");
    const t8Store = t8Stores[0];
    const decodedStoreNotes = decodeType8StoreNotes(t8Store?.notes);
    const storeDisplay = t8Store?.subDealerStore
      ? `${t8Store.subDealerStore} (Dealer: ${t8Store.storeName || "-"})`
      : t8Store?.storeName || "";

    const targetProductNames = t8Products
      .map((pr) => pr.productName)
      .filter(Boolean) as string[];

    const promotionalProducts =
      decodedStoreNotes.promotions.length > 0
        ? decodedStoreNotes.promotions.map((p, idx) => ({
            id: `promo-${idx + 1}`,
            productId: "",
            productName: "",
            quantity: 1,
            unitPrice: 0,
            totalAmount: 0,
            notes: p,
            storeId: null,
          }))
        : t8PromoProducts.map((pr) => ({
            id: pr.id,
            productId: pr.productId,
            productName:
              pr.productName || (pr as any).product?.name || "สินค้าโปรโมชัน",
            quantity: pr.targetQuantity ?? 1,
            unitPrice: pr.unitPrice ? Number(pr.unitPrice) : 0,
            totalAmount: pr.targetAmount ? Number(pr.targetAmount) : 0,
            notes: pr.notes || "",
            storeId: pr.storeId || null,
          }));

    targets.t8 = {
      ...prevTargets.t8,
      topic: t8Store?.remarks || p.objective || "",
      customer: storeDisplay,
      dealerName: t8Store?.storeName || "",
      subDealerStore: t8Store?.subDealerStore || "",
      detail: decodedStoreNotes.detail || t8Store?.notes || p.description || "",
      targetProducts: targetProductNames,
      products: targetProductNames.join(", "),
      promotionalProducts,
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
      productId: pr.productId,
      storeId: pr.storeId || t9FirstStore?.storeId || null,
      productName: pr.productName || "",
      quantityCases: pr.targetQuantity || 0,
      pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
      totalAmount: pr.targetAmount
        ? Number(pr.targetAmount)
        : (pr.targetQuantity || 0) * (Number(pr.unitPrice) || 0),
    }));
    const t9ProductTotalSales = t9ItemsFromDb.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    const t9TotalSales =
      t9ItemsFromDb.length > 0
        ? t9ProductTotalSales
        : t9FirstStore?.targetAmount != null
          ? Number(t9FirstStore.targetAmount)
          : 0;
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
      .map((s) => s.storeName || s.store?.name)
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
        storeId: s.storeId || s.id,
        store: s.storeName || s.store?.name || "",
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
