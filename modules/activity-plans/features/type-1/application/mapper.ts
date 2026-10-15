import type {
  Type1VisitItem,
  Type1PlanStoreRecord,
  Type1ActualData,
  CustomerOption,
  Type1TargetItem,
  Type1AdviceProductItem,
  Type1ImageFile,
} from "../types";

/**
 * Maps a single Type1VisitItem from the UI form into normalized planStore record for DB persistence
 */
export function mapType1FormToPlanStore(
  item: Type1VisitItem,
  customersList: CustomerOption[] = [],
): Type1PlanStoreRecord | null {
  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;
    if (!sId) return null;

    return {
      activityPlanId: "", // Will be assigned during creation transaction
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: sId,
      storeName: item.customerName || null,
      province: null,
      isUnregisteredFarmer: false,
      unregisteredFarmerName: null,
      unregisteredFarmerPhone: null,
      remarks: item.topic || null,
      notes: item.detail || null,
    };
  }

  // Purpose is FARMER
  if (item.isUnregisteredFarmer) {
    return {
      activityPlanId: "",
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      storeId: null,
      storeName: item.unregisteredFarmerName || null,
      province: item.province || null,
      isUnregisteredFarmer: true,
      unregisteredFarmerName: item.unregisteredFarmerName || null,
      unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
      remarks: item.topic || null,
      notes: item.detail || null,
    };
  }

  const sId =
    item.storeId ||
    customersList.find((c) => c.name === item.customerName)?.id;
  if (!sId) return null;

  return {
    activityPlanId: "",
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    storeId: sId,
    storeName: item.customerName || null,
    province: item.province || null,
    isUnregisteredFarmer: false,
    unregisteredFarmerName: null,
    unregisteredFarmerPhone: null,
    remarks: item.topic || null,
    notes: item.detail || null,
  };
}

/**
 * Maps a raw database record from `activity_plan_stores` to UI `Type1VisitItem`
 */
export function mapType1DbStoreToFormItem(
  storeRecord: any,
  index = 0,
): Type1VisitItem {
  const rawPurpose = storeRecord.visitPurpose;
  const inferredPurpose: "FARMER" | "STORE" = rawPurpose
    ? (rawPurpose as "FARMER" | "STORE")
    : storeRecord.isUnregisteredFarmer ||
        storeRecord.store?.customerType === "FARMER"
      ? "FARMER"
      : ["DEALER", "SUBDEALER"].includes(storeRecord.store?.customerType)
        ? "STORE"
        : "FARMER";

  return {
    id: storeRecord.id || String(index + 1),
    visitPurpose: inferredPurpose,
    storeId: storeRecord.storeId || undefined,
    customerName: storeRecord.isUnregisteredFarmer
      ? storeRecord.unregisteredFarmerName || ""
      : storeRecord.store?.name || storeRecord.storeName || "",
    topic: storeRecord.topic || storeRecord.remarks || "แจ้งข่าวสาร",
    detail: storeRecord.notes || "",
    province: storeRecord.province || storeRecord.store?.province || "",
    isUnregisteredFarmer: Boolean(storeRecord.isUnregisteredFarmer),
    unregisteredFarmerName: storeRecord.unregisteredFarmerName || "",
    unregisteredFarmerPhone: storeRecord.unregisteredFarmerPhone || "",
    plotLatitude:
      storeRecord.plotLatitude != null
        ? String(storeRecord.plotLatitude)
        : storeRecord.store?.latitude != null
          ? String(storeRecord.store.latitude)
          : undefined,
    plotLongitude:
      storeRecord.plotLongitude != null
        ? String(storeRecord.plotLongitude)
        : storeRecord.store?.longitude != null
          ? String(storeRecord.store.longitude)
          : undefined,
  };
}

/**
 * Maps UI Type1ActualData to ActivityResult Prisma update payload
 */
export function mapType1ActualFormToDb(actual: Type1ActualData) {
  return {
    productAdvice: actual.productAdvice?.trim() || null,
    discussionResult: actual.discussionResult?.trim() || null,
    salesOpportunity: actual.salesOpportunity || null,
    nextMeetingDate: actual.nextMeetingDate
      ? new Date(actual.nextMeetingDate)
      : null,
    farmerHomeAddress: actual.farmerHomeAddress?.trim() || null,
    plotLatitude:
      actual.plotLatitude != null && actual.plotLatitude !== ""
        ? Number(actual.plotLatitude)
        : null,
    plotLongitude:
      actual.plotLongitude != null && actual.plotLongitude !== ""
        ? Number(actual.plotLongitude)
        : null,
  };
}

/**
 * Single Source of Truth for extracting TYPE 1 targets from an ActivityPlan
 */
export function extractType1PlanTargets(
  plan: any,
  prevTarget?: Partial<Type1TargetItem>,
): {
  primary: Type1TargetItem;
  list: Type1TargetItem[];
} {
  const stores = plan.stores || [];
  const rawT1Stores: any[] =
    (plan as any).type1Stores && (plan as any).type1Stores.length > 0
      ? (plan as any).type1Stores
      : stores.filter((s: any) => s.workTypeCode === "TYPE_1");

  const resultLat =
    plan.type1Result?.plotLatitude != null
      ? String(plan.type1Result.plotLatitude)
      : undefined;

  const resultLng =
    plan.type1Result?.plotLongitude != null
      ? String(plan.type1Result.plotLongitude)
      : undefined;

  const resultFarmerAddress =
    plan.type1Result?.farmerHomeAddress || undefined;

  const resultProductAdvice =
    plan.type1Result?.productAdvice || undefined;

  const resultSalesOpportunity =
    plan.type1Result?.salesOpportunity || undefined;

  const resultNextMeetingDate =
    plan.type1Result?.nextMeetingDate
      ? typeof plan.type1Result.nextMeetingDate === "string"
        ? plan.type1Result.nextMeetingDate.split("T")[0]
        : new Date(plan.type1Result.nextMeetingDate).toISOString().split("T")[0]
      : plan.result?.nextMeetingDate
        ? typeof plan.result.nextMeetingDate === "string"
          ? plan.result.nextMeetingDate.split("T")[0]
          : new Date(plan.result.nextMeetingDate).toISOString().split("T")[0]
        : undefined;

  const list: Type1TargetItem[] = rawT1Stores.map((s: any, idx: number) => {
    const targetResult =
      s.result ||
      (plan.type1Results || []).find((r: any) => r.planStoreId === s.id) ||
      (plan.type1Result && idx === 0 ? plan.type1Result : null);

    let visitPurpose: "FARMER" | "STORE" = s.visitPurpose as "FARMER" | "STORE";
    if (!visitPurpose) {
      if (s.isUnregisteredFarmer || s.store?.customerType === "FARMER") {
        visitPurpose = "FARMER";
      } else if (["DEALER", "SUBDEALER"].includes(s.store?.customerType)) {
        visitPurpose = "STORE";
      } else {
        visitPurpose = "FARMER";
      }
    }

    const custName = s.isUnregisteredFarmer
      ? s.unregisteredFarmerName || ""
      : s.store?.name || s.storeName || "";

    const isFarmer = visitPurpose === "FARMER";
    const storeLat = s.store?.latitude != null ? String(s.store.latitude) : undefined;
    const storeLng = s.store?.longitude != null ? String(s.store.longitude) : undefined;
    const isAdviceTopic = (s.topic || s.remarks)?.trim() === "ให้คำแนะนำการใช้สินค้า";

    const targetDate = targetResult?.nextMeetingDate
      ? typeof targetResult.nextMeetingDate === "string"
        ? targetResult.nextMeetingDate.split("T")[0]
        : new Date(targetResult.nextMeetingDate).toISOString().split("T")[0]
      : resultNextMeetingDate;

    return {
      id: s.id,
      storeId: s.storeId,
      customer: custName,
      topic: s.topic || s.remarks || prevTarget?.topic || "",
      detail: s.notes || "",
      opportunity:
        (isAdviceTopic ? (targetResult?.salesOpportunity || resultSalesOpportunity) : undefined) ||
        prevTarget?.opportunity ||
        targetResult?.salesOpportunity ||
        resultSalesOpportunity ||
        "",
      nextDate: targetDate || prevTarget?.nextDate || "",
      visitPurpose,
      customerType: s.store?.customerType || undefined,
      province: s.province || s.store?.province || plan.province || undefined,
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || undefined,
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || undefined,
      farmerHomeAddress: isFarmer
        ? targetResult?.farmerHomeAddress || s.store?.addressLine || resultFarmerAddress
        : undefined,
      plotLatitude: isFarmer
        ? (targetResult?.plotLatitude != null ? String(targetResult.plotLatitude) : (resultLat || storeLat))
        : undefined,
      plotLongitude: isFarmer
        ? (targetResult?.plotLongitude != null ? String(targetResult.plotLongitude) : (resultLng || storeLng))
        : undefined,
      productAdvice: isAdviceTopic ? (targetResult?.productAdvice || resultProductAdvice) : undefined,
      discussionResult: targetResult?.discussionResult || undefined,
      salesOpportunity: targetResult?.salesOpportunity || resultSalesOpportunity,
      nextAction: targetResult?.nextAction || undefined,
      nextMeetingDate: targetDate,
    };
  });

  const t1First = list[0];
  const combinedCustomerName =
    list
      .map((item) => item.customer)
      .filter(Boolean)
      .join(", ") ||
    plan.location ||
    "";

  const primary: Type1TargetItem = t1First
    ? {
        ...prevTarget,
        ...t1First,
        customer: combinedCustomerName || t1First.customer,
        opportunity: resultSalesOpportunity || prevTarget?.opportunity || "",
        nextDate: resultNextMeetingDate || prevTarget?.nextDate || "",
        productAdvice: resultProductAdvice || t1First.productAdvice,
        salesOpportunity: resultSalesOpportunity || t1First.salesOpportunity,
        nextMeetingDate: resultNextMeetingDate || t1First.nextMeetingDate,
      }
    : {
        customer: "",
        topic: "",
        detail: "",
        opportunity: resultSalesOpportunity || prevTarget?.opportunity || "",
        nextDate: resultNextMeetingDate || prevTarget?.nextDate || "",
        productAdvice: resultProductAdvice,
        salesOpportunity: resultSalesOpportunity,
        nextMeetingDate: resultNextMeetingDate,
        ...prevTarget,
      };

  return { primary, list };
}

/**
 * Parses raw ActivityResult / ActivityResultType1 into Type 1 actual fields
 */
export function parseType1ActualResult(resData: any): {
  t1DiscussionResult?: string;
  t1ProductAdvice?: string;
  t1Products?: Array<{
    id?: string;
    productId: string;
    productName: string;
    productCode?: string | null;
    targetId?: string;
  }>;
  t1SalesOpportunity?: "สูง" | "ต่ำ";
  t1FarmerHomeAddress?: string;
  t1PlotLatitude?: number;
  t1PlotLongitude?: number;
  t1NextAction?: string;
  t1NextMeetingDate?: string;
} {
  const result: any = {};
  if (!resData) return result;

  const rawProducts =
    resData.type1Products ||
    resData.activityResultType1Products ||
    resData.type1Result?.products ||
    [];

  if (rawProducts && rawProducts.length > 0) {
    result.t1Products = rawProducts.map((p: any) => ({
      id: p.id,
      productId: p.productId,
      productName: p.product?.name || p.productName || "",
      productCode: p.product?.productCode || null,
      targetId: p.targetId || undefined,
    }));
  }

  const type1Obj = resData.type1Result || resData.activityResultType1;

  if (type1Obj?.discussionResult) result.t1DiscussionResult = type1Obj.discussionResult;
  if (type1Obj?.productAdvice) result.t1ProductAdvice = type1Obj.productAdvice;
  if (type1Obj?.salesOpportunity) result.t1SalesOpportunity = type1Obj.salesOpportunity;
  if (type1Obj?.farmerHomeAddress) result.t1FarmerHomeAddress = type1Obj.farmerHomeAddress;

  if (type1Obj?.plotLatitude != null && type1Obj.plotLatitude !== "") {
    result.t1PlotLatitude = Number(type1Obj.plotLatitude);
  }
  if (type1Obj?.plotLongitude != null && type1Obj.plotLongitude !== "") {
    result.t1PlotLongitude = Number(type1Obj.plotLongitude);
  }
  if (type1Obj?.nextAction) result.t1NextAction = type1Obj.nextAction;

  const nextMeetingDate = type1Obj?.nextMeetingDate;
  if (nextMeetingDate) {
    result.t1NextMeetingDate =
      typeof nextMeetingDate === "string"
        ? nextMeetingDate.split("T")[0]
        : new Date(nextMeetingDate).toISOString().split("T")[0];
  }

  return result;
}

/**
 * Maps Type 1 stores into Work Type Section Cards for the Detail Overview
 */
export function mapType1StoresToSectionItems(
  stores: any[],
  planLocation?: string | null,
): Array<{ title: string; subtitle?: string; details?: string }> {
  return stores.map((s) => {
    const custName = s.isUnregisteredFarmer
      ? s.unregisteredFarmerName || "เกษตรกรนอกระบบ"
      : s.store?.name || s.storeName || planLocation || "ลูกค้า/ร้านค้า";
    return {
      title: custName,
      subtitle: s.topic || s.remarks ? `หัวข้อเป้าหมาย: ${s.topic || s.remarks}` : undefined,
      details: s.notes || undefined,
    };
  });
}

/**
 * Extracts target-specific text from composite strings like "TargetA: notes | TargetB: notes"
 */
export function parseTargetText(
  text: string | undefined,
  targetName: string,
  fallback: string = "",
): string {
  if (!text) return fallback;
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\||\\n)\\s*(?:\\d+\\.\\s*)?${escaped}:\\s*([^|\\n]+)`,
    "i",
  );
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fallback;
}

export interface AggregatedType1TargetActual {
  discussionResult: string;
  productAdvice: string;
  advisedProducts: Type1AdviceProductItem[];
  salesOpportunity: "สูง" | "ต่ำ" | "";
  nextAction: string;
  nextMeetingDate: string;
  farmerHomeAddress: string;
  plotLatitude: string;
  plotLongitude: string;
  plotImages: Type1ImageFile[];
}

/**
 * Aggregates target-level Type 1 actual fields into plan-level summary fields
 */
export function aggregateType1TargetItems(
  items: Type1VisitItem[],
): AggregatedType1TargetActual {
  if (!items || items.length === 0) {
    return {
      discussionResult: "",
      productAdvice: "",
      advisedProducts: [],
      salesOpportunity: "",
      nextAction: "",
      nextMeetingDate: "",
      farmerHomeAddress: "",
      plotLatitude: "",
      plotLongitude: "",
      plotImages: [],
    };
  }

  if (items.length === 1) {
    const single = items[0];
    return {
      discussionResult: single.discussionResult || "",
      productAdvice: single.productAdvice || "",
      advisedProducts: single.advisedProducts || [],
      salesOpportunity:
        (single.salesOpportunity as "สูง" | "ต่ำ" | "") || "",
      nextAction: single.nextAction || "",
      nextMeetingDate: single.nextMeetingDate || "",
      farmerHomeAddress: single.farmerHomeAddress || "",
      plotLatitude: single.plotLatitude || "",
      plotLongitude: single.plotLongitude || "",
      plotImages: single.plotImages || [],
    };
  }

  // Multi-target:
  const discussionResult = items
    .map((it) => {
      const name = it.isUnregisteredFarmer
        ? it.unregisteredFarmerName || it.customerName || "เป้าหมาย"
        : it.customerName || "เป้าหมาย";
      return it.discussionResult ? `${name}: ${it.discussionResult}` : "";
    })
    .filter(Boolean)
    .join(" | ");

  const advisedProducts = items.flatMap((it) => it.advisedProducts || []);

  const uniqueProdNames = Array.from(
    new Set(
      items.flatMap((it) =>
        (it.productAdvice || "")
          .split(",")
          .map((p: string) => p.trim())
          .filter(Boolean),
      ),
    ),
  );
  const productAdvice = uniqueProdNames.join(", ");

  const hasHigh = items.some((it) => it.salesOpportunity === "สูง");
  const hasLow = items.some((it) => it.salesOpportunity === "ต่ำ");
  const salesOpportunity: "สูง" | "ต่ำ" | "" = hasHigh
    ? "สูง"
    : hasLow
      ? "ต่ำ"
      : "";

  const nextAction = items
    .map((it) => {
      const name = it.isUnregisteredFarmer
        ? it.unregisteredFarmerName || it.customerName || "เป้าหมาย"
        : it.customerName || "เป้าหมาย";
      return it.nextAction ? `${name}: ${it.nextAction}` : "";
    })
    .filter(Boolean)
    .join(" | ");

  const nextMeetingDate =
    items.find((it) => it.nextMeetingDate)?.nextMeetingDate || "";

  const farmerAddresses = items
    .filter((it) => it.visitPurpose !== "STORE" && it.farmerHomeAddress)
    .map((it) => {
      const name = it.isUnregisteredFarmer
        ? it.unregisteredFarmerName || it.customerName || "เกษตรกร"
        : it.customerName || "เกษตรกร";
      return `${name}: ${it.farmerHomeAddress}`;
    });
  const farmerHomeAddress = farmerAddresses.join(" | ");

  const firstCoord = items.find((it) => it.plotLatitude && it.plotLongitude);
  const plotLatitude = firstCoord?.plotLatitude || "";
  const plotLongitude = firstCoord?.plotLongitude || "";

  const plotImages = items.flatMap((it) => it.plotImages || []);

  return {
    discussionResult,
    productAdvice,
    advisedProducts,
    salesOpportunity,
    nextAction,
    nextMeetingDate,
    farmerHomeAddress,
    plotLatitude,
    plotLongitude,
    plotImages,
  };
}

/**
 * Single Source of Truth: Hydrate Planned Items from an ActivityPlan record
 */
export function hydrateType1PlannedData(plan: any): import("../planned/types").Type1PlannedItem[] {
  if (!plan) return [];

  const rawStores: any[] = plan.type1Stores || [];

  if (rawStores.length === 0) {
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
        topic: "แจ้งข่าวสาร",
        detail: "",
      },
    ];
  }

  return rawStores.map((s, idx) => {
    const rawPurpose = s.visitPurpose;
    const inferredPurpose: "FARMER" | "STORE" = rawPurpose
      ? (rawPurpose as "FARMER" | "STORE")
      : s.isUnregisteredFarmer || s.store?.customerType === "FARMER"
        ? "FARMER"
        : ["DEALER", "SUBDEALER"].includes(s.store?.customerType)
          ? "STORE"
          : "FARMER";

    return {
      id: s.id || String(idx + 1),
      visitPurpose: inferredPurpose,
      storeId: s.storeId || undefined,
      customerName: s.isUnregisteredFarmer
        ? s.unregisteredFarmerName || ""
        : s.store?.name || s.storeName || "",
      province: s.province || s.store?.province || plan.province || "",
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || "",
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
      topic: s.topic || "แจ้งข่าวสาร",
      detail: s.notes || "",
    };
  });
}

/**
 * Single Source of Truth: Hydrate Unplanned Items (Target + Actual) from an ActivityPlan record
 */
export function hydrateType1UnplannedData(plan: any): import("../unplanned/types").Type1UnplannedItem[] {
  if (!plan) return [];

  const rawStores: any[] = plan.type1Stores || [];
  const actualResult = plan.type1Result || {};
  const products: any[] = plan.type1Products || [];
  const rawAttachments: any[] = plan.attachments || [];

  const plotImages = rawAttachments
    .filter((att) => att.category === "PLOT" || att.category === "GENERAL")
    .map((att) => ({
      id: att.id,
      url: att.fileUrl,
      name: att.fileName || "รูปแปลง",
    }));

  if (rawStores.length === 0) {
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
        topic: "แจ้งข่าวสาร",
        detail: "",
        discussionResult: actualResult.discussionResult || "",
        productAdvice: actualResult.productAdvice || "",
        advisedProducts: products.map((p: any) => ({
          productId: p.productId,
          productName: p.product?.name || p.productName || "",
          productCode: p.product?.productCode || p.productCode || null,
        })),
        salesOpportunity: (actualResult.salesOpportunity as "สูง" | "ต่ำ" | "") || "",
        nextMeetingDate: actualResult.nextMeetingDate
          ? typeof actualResult.nextMeetingDate === "string"
            ? actualResult.nextMeetingDate.split("T")[0]
            : new Date(actualResult.nextMeetingDate).toISOString().split("T")[0]
          : "",
        farmerHomeAddress: actualResult.farmerHomeAddress || "",
        plotLatitude: actualResult.plotLatitude ? String(actualResult.plotLatitude) : "",
        plotLongitude: actualResult.plotLongitude ? String(actualResult.plotLongitude) : "",
        plotImages,
      },
    ];
  }

  return rawStores.map((s, idx) => {
    const rawPurpose = s.visitPurpose;
    const inferredPurpose: "FARMER" | "STORE" = rawPurpose
      ? (rawPurpose as "FARMER" | "STORE")
      : s.isUnregisteredFarmer || s.store?.customerType === "FARMER"
        ? "FARMER"
        : ["DEALER", "SUBDEALER"].includes(s.store?.customerType)
          ? "STORE"
          : "FARMER";

    const targetProducts = products.filter(
      (p: any) => !p.targetId || p.targetId === s.id,
    );

    const targetResult =
      s.result ||
      (plan.type1Results || []).find((r: any) => r.planStoreId === s.id) ||
      actualResult;

    return {
      id: s.id || String(idx + 1),
      visitPurpose: inferredPurpose,
      storeId: s.storeId || undefined,
      customerName: s.isUnregisteredFarmer
        ? s.unregisteredFarmerName || ""
        : s.store?.name || s.storeName || "",
      province: s.province || s.store?.province || plan.province || "",
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || "",
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
      topic: s.topic || s.remarks || "แจ้งข่าวสาร",
      detail: s.notes || "",
      discussionResult: targetResult.discussionResult || "",
      productAdvice: targetResult.productAdvice || "",
      advisedProducts: targetProducts.map((p: any) => ({
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        productCode: p.product?.productCode || p.productCode || null,
        targetId: s.id,
      })),
      salesOpportunity: (targetResult.salesOpportunity as "สูง" | "ต่ำ" | "") || "",
      nextAction: targetResult.nextAction || "",
      nextMeetingDate: targetResult.nextMeetingDate
        ? typeof targetResult.nextMeetingDate === "string"
          ? targetResult.nextMeetingDate.split("T")[0]
          : new Date(targetResult.nextMeetingDate).toISOString().split("T")[0]
        : "",
      farmerHomeAddress: targetResult.farmerHomeAddress || s.store?.addressLine || "",
      plotLatitude: targetResult.plotLatitude
        ? String(targetResult.plotLatitude)
        : s.store?.latitude
          ? String(s.store.latitude)
          : "",
      plotLongitude: targetResult.plotLongitude
        ? String(targetResult.plotLongitude)
        : s.store?.longitude
          ? String(s.store.longitude)
          : "",
      plotImages,
    };
  });
}

