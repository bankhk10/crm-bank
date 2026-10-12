import type {
  Type1VisitItem,
  Type1PlanStoreRecord,
  Type1ActualData,
  CustomerOption,
  Type1TargetItem,
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
    topic: storeRecord.remarks || "แจ้งข่าวสาร",
    detail: storeRecord.notes || "",
    province: storeRecord.province || storeRecord.store?.province || "",
    isUnregisteredFarmer: Boolean(storeRecord.isUnregisteredFarmer),
    unregisteredFarmerName: storeRecord.unregisteredFarmerName || "",
    unregisteredFarmerPhone: storeRecord.unregisteredFarmerPhone || "",
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

  const list: Type1TargetItem[] = rawT1Stores.map((s: any) => {
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

    return {
      id: s.id,
      customer: custName,
      topic: s.topic || s.remarks || prevTarget?.topic || "",
      detail: s.notes || "",
      opportunity: prevTarget?.opportunity || "",
      nextDate: prevTarget?.nextDate || "",
      visitPurpose,
      customerType: s.store?.customerType || undefined,
      province: s.province || s.store?.province || plan.province || undefined,
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || undefined,
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || undefined,
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
      }
    : {
        customer: "",
        topic: "",
        detail: "",
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
  t1SalesOpportunity?: "สูง" | "ต่ำ";
  t1FarmerHomeAddress?: string;
  t1PlotLatitude?: number;
  t1PlotLongitude?: number;
  t1NextAction?: string;
  t1NextMeetingDate?: string;
} {
  const result: any = {};
  if (!resData) return result;

  const t1Res = resData.type1Result || resData;
  if (t1Res.discussionResult) result.t1DiscussionResult = t1Res.discussionResult;
  if (t1Res.productAdvice) result.t1ProductAdvice = t1Res.productAdvice;
  if (t1Res.salesOpportunity) result.t1SalesOpportunity = t1Res.salesOpportunity;
  if (t1Res.farmerHomeAddress) result.t1FarmerHomeAddress = t1Res.farmerHomeAddress;
  if (t1Res.plotLatitude != null) result.t1PlotLatitude = Number(t1Res.plotLatitude);
  if (t1Res.plotLongitude != null) result.t1PlotLongitude = Number(t1Res.plotLongitude);
  if (t1Res.nextAction) result.t1NextAction = t1Res.nextAction;
  if (t1Res.nextMeetingDate) {
    result.t1NextMeetingDate =
      typeof t1Res.nextMeetingDate === "string"
        ? t1Res.nextMeetingDate.split("T")[0]
        : new Date(t1Res.nextMeetingDate).toISOString().split("T")[0];
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
