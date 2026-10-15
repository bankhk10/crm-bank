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
      : plan.result?.plotLatitude != null
        ? String(plan.result.plotLatitude)
        : undefined;

  const resultLng =
    plan.type1Result?.plotLongitude != null
      ? String(plan.type1Result.plotLongitude)
      : plan.result?.plotLongitude != null
        ? String(plan.result.plotLongitude)
        : undefined;

  const resultFarmerAddress =
    plan.type1Result?.farmerHomeAddress ||
    plan.result?.farmerHomeAddress ||
    undefined;

  const resultProductAdvice =
    plan.type1Result?.productAdvice ||
    plan.result?.productAdvice ||
    undefined;

  const resultSalesOpportunity =
    plan.type1Result?.salesOpportunity ||
    plan.result?.salesOpportunity ||
    undefined;

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

    return {
      id: s.id,
      customer: custName,
      topic: s.topic || s.remarks || prevTarget?.topic || "",
      detail: s.notes || "",
      opportunity:
        (isAdviceTopic ? resultSalesOpportunity : undefined) ||
        prevTarget?.opportunity ||
        resultSalesOpportunity ||
        "",
      nextDate: resultNextMeetingDate || prevTarget?.nextDate || "",
      visitPurpose,
      customerType: s.store?.customerType || undefined,
      province: s.province || s.store?.province || plan.province || undefined,
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || undefined,
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || undefined,
      farmerHomeAddress: isFarmer
        ? s.store?.addressLine || resultFarmerAddress
        : undefined,
      plotLatitude: isFarmer ? (resultLat || storeLat) : undefined,
      plotLongitude: isFarmer ? (resultLng || storeLng) : undefined,
      productAdvice: isAdviceTopic ? resultProductAdvice : undefined,
      salesOpportunity: resultSalesOpportunity,
      nextMeetingDate: resultNextMeetingDate,
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

  const discussionResult =
    type1Obj?.discussionResult || resData.discussionResult || resData.result?.discussionResult;
  if (discussionResult) result.t1DiscussionResult = discussionResult;

  const productAdvice =
    type1Obj?.productAdvice || resData.productAdvice || resData.result?.productAdvice;
  if (productAdvice) result.t1ProductAdvice = productAdvice;

  const salesOpportunity =
    type1Obj?.salesOpportunity || resData.salesOpportunity || resData.result?.salesOpportunity;
  if (salesOpportunity) result.t1SalesOpportunity = salesOpportunity;

  const farmerHomeAddress =
    type1Obj?.farmerHomeAddress || resData.farmerHomeAddress || resData.result?.farmerHomeAddress;
  if (farmerHomeAddress) result.t1FarmerHomeAddress = farmerHomeAddress;

  const rawLat =
    type1Obj?.plotLatitude != null
      ? type1Obj.plotLatitude
      : resData.plotLatitude != null
        ? resData.plotLatitude
        : resData.result?.plotLatitude;
  if (rawLat != null && rawLat !== "") {
    result.t1PlotLatitude = Number(rawLat);
  }

  const rawLng =
    type1Obj?.plotLongitude != null
      ? type1Obj.plotLongitude
      : resData.plotLongitude != null
        ? resData.plotLongitude
        : resData.result?.plotLongitude;
  if (rawLng != null && rawLng !== "") {
    result.t1PlotLongitude = Number(rawLng);
  }

  const nextAction = type1Obj?.nextAction || resData.nextAction || resData.result?.nextAction;
  if (nextAction) result.t1NextAction = nextAction;

  const nextMeetingDate =
    type1Obj?.nextMeetingDate || resData.nextMeetingDate;
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
