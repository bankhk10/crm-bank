import type { CustomerOption } from "../../shared/types";
import type { Type1PlannedItem, Type1TargetItem } from "../types/planned.types";

/**
 * Maps a single Type1PlannedItem from the UI form into normalized payload for DB persistence
 */
export function mapType1PlannedItemToDb(
  item: Type1PlannedItem,
  customersList: CustomerOption[] = [],
): {
  workTypeCode: "TYPE_1";
  visitPurpose: "FARMER" | "STORE";
  storeId: string | null;
  storeName: string | null;
  province: string | null;
  isUnregisteredFarmer: boolean;
  unregisteredFarmerName: string | null;
  unregisteredFarmerPhone: string | null;
  topic: string | null;
  notes: string | null;
} | null {
  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;
    if (!sId) return null;

    return {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: sId,
      storeName: item.customerName || null,
      province: null,
      isUnregisteredFarmer: false,
      unregisteredFarmerName: null,
      unregisteredFarmerPhone: null,
      topic: item.topic || null,
      notes: item.notes || null,
    };
  }

  // Purpose is FARMER
  if (item.isUnregisteredFarmer) {
    return {
      workTypeCode: "TYPE_1",
      visitPurpose: "FARMER",
      storeId: null,
      storeName: item.unregisteredFarmerName || null,
      province: item.province || null,
      isUnregisteredFarmer: true,
      unregisteredFarmerName: item.unregisteredFarmerName || null,
      unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
      topic: item.topic || null,
      notes: item.notes || null,
    };
  }

  const sId =
    item.storeId ||
    customersList.find((c) => c.name === item.customerName)?.id;
  if (!sId) return null;

  return {
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    storeId: sId,
    storeName: item.customerName || null,
    province: item.province || null,
    isUnregisteredFarmer: false,
    unregisteredFarmerName: null,
    unregisteredFarmerPhone: null,
    topic: item.topic || null,
    notes: item.notes || null,
  };
}

/**
 * Maps a raw database record from `activity_plan_type_1_stores` to UI `Type1PlannedItem`
 */
export function mapType1DbStoreToPlannedItem(
  storeRecord: any,
  index = 0,
): Type1PlannedItem {
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
      ? storeRecord.unregisteredFarmerName || storeRecord.customerName || storeRecord.customer || ""
      : storeRecord.store?.name || storeRecord.storeName || storeRecord.customerName || storeRecord.customer || "",
    topic: storeRecord.topic || storeRecord.remarks || "แจ้งข่าวสาร",
    notes: storeRecord.notes || "",
    province: storeRecord.province || storeRecord.store?.province || "",
    isUnregisteredFarmer: Boolean(storeRecord.isUnregisteredFarmer),
    unregisteredFarmerName: storeRecord.unregisteredFarmerName || "",
    unregisteredFarmerPhone: storeRecord.unregisteredFarmerPhone || "",
  };
}

/**
 * Hydrates planned items from an ActivityPlan record
 */
export function hydrateType1PlannedData(plan: any): Type1PlannedItem[] {
  if (!plan) return [];

  const rawStores: any[] =
    plan.type1Stores && plan.type1Stores.length > 0
      ? plan.type1Stores
      : plan.items && plan.items.length > 0
        ? plan.items
        : plan.stores && plan.stores.length > 0
          ? plan.stores.filter(
              (s: any) =>
                !s.workTypeCode ||
                s.workTypeCode === "TYPE_1" ||
                s.workTypeCode === "เข้าพบร้านค้า / Key Farmer",
            )
          : [];

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
        notes: "",
      },
    ];
  }

  return rawStores.map((s, idx) => {
    if (s && (s.customerName !== undefined || s.notes !== undefined)) {
      return {
        ...s,
        notes: s.notes || "",
        id: s.id || String(idx + 1),
      } as Type1PlannedItem;
    }
    return mapType1DbStoreToPlannedItem(s, idx);
  });
}

/**
 * Extracts TYPE 1 targets from an ActivityPlan for Detail / Actual View
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
      : (plan as any).items && (plan as any).items.length > 0
        ? (plan as any).items
        : stores.filter((s: any) => !s.workTypeCode || s.workTypeCode === "TYPE_1" || s.workTypeCode === "เข้าพบร้านค้า / Key Farmer");

  const firstT1Result =
    (plan.type1Results && plan.type1Results[0]) ||
    plan.type1Result ||
    plan.type1Stores?.[0]?.result;

  const resultLat =
    firstT1Result?.plotLatitude != null
      ? String(firstT1Result.plotLatitude)
      : undefined;

  const resultLng =
    firstT1Result?.plotLongitude != null
      ? String(firstT1Result.plotLongitude)
      : undefined;

  const resultFarmerAddress =
    firstT1Result?.farmerHomeAddress || undefined;

  const resultDiscussionResult =
    firstT1Result?.discussionResult || undefined;

  const resultNextAction =
    firstT1Result?.nextAction || undefined;

  const resultProductAdvice =
    firstT1Result?.productAdvice || undefined;

  const resultSalesOpportunity =
    firstT1Result?.salesOpportunity || undefined;

  const resultNextMeetingDate = firstT1Result?.nextMeetingDate
    ? typeof firstT1Result.nextMeetingDate === "string"
      ? firstT1Result.nextMeetingDate.split("T")[0]
      : new Date(firstT1Result.nextMeetingDate).toISOString().split("T")[0]
    : undefined;

  // Collect all unique Type 1 plot attachments from result & plan
  const rawAttachmentsList: any[] = [
    ...(Array.isArray(plan.result?.attachments) ? plan.result.attachments : []),
    ...(Array.isArray(plan.attachments) ? plan.attachments : []),
  ];
  const seenAttUrls = new Set<string>();
  const t1PlotAttachments = rawAttachmentsList.filter((att) => {
    if (!att) return false;
    const isT1Plot =
      att.workTypeCode === "TYPE_1" ||
      att.workTypeCode === "เข้าพบร้านค้า / Key Farmer" ||
      (att.category === "PLOT" && (!att.workTypeCode || att.workTypeCode === "TYPE_1"));
    if (!isT1Plot) return false;
    const url = att.fileUrl || att.url;
    if (!url || seenAttUrls.has(url)) return false;
    seenAttUrls.add(url);
    return true;
  });

  const hasTargetSpecificAttachmentUrl = t1PlotAttachments.some((att) => {
    const url = att.fileUrl || att.url || "";
    return rawT1Stores.some((st: any) => st.id && url.includes(`/${st.id}/`));
  });
  const farmerStores = rawT1Stores.filter((st: any) => st.visitPurpose !== "STORE");
  const isOnlyOneFarmerInPlan = farmerStores.length === 1;

  const list: Type1TargetItem[] = rawT1Stores.map((s: any, idx: number) => {
    const targetResult =
      s.result ||
      (plan.type1Results || []).find((r: any) => r.planStoreId === s.id) ||
      (plan.type1Results && plan.type1Results[idx]) ||
      (firstT1Result && (idx === 0 || rawT1Stores.length === 1) ? firstT1Result : null);

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

    const isSingleStorePlan = rawT1Stores.length === 1;
    const targetDate = targetResult?.nextMeetingDate
      ? typeof targetResult.nextMeetingDate === "string"
        ? targetResult.nextMeetingDate.split("T")[0]
        : new Date(targetResult.nextMeetingDate).toISOString().split("T")[0]
      : isSingleStorePlan
        ? resultNextMeetingDate
        : undefined;

    const rawT1Products: any[] = plan.type1Products || [];
    const targetAdvisedProducts = rawT1Products
      .filter((p: any) => p.targetId === s.id || (isSingleStorePlan && !p.targetId))
      .map((p: any) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        productCode: p.product?.productCode || null,
        targetId: p.targetId || s.id,
      }));

    const targetPlotImages = isFarmer
      ? t1PlotAttachments
          .filter((att: any) => {
            const url = att.fileUrl || att.url || "";
            if (s.id && url.includes(`/${s.id}/`)) return true;
            if (!hasTargetSpecificAttachmentUrl) {
              if (s.storeId && att.storeId && att.storeId === s.storeId) return true;
              if (isSingleStorePlan || isOnlyOneFarmerInPlan) return true;
            }
            return false;
          })
          .map((att: any) => ({
            id: att.id,
            url: att.fileUrl || att.url,
            name: att.fileName || att.name || "รูปแปลงเกษตรกร",
            size: att.fileSize || att.size || 0,
            type: att.mimeType || att.type || "image/jpeg",
            targetId: s.id,
            storeId: s.storeId || undefined,
          }))
      : [];

    return {
      id: s.id,
      storeId: s.storeId,
      customer: custName,
      topic: s.topic || s.remarks || prevTarget?.topic || "",
      notes: s.notes || prevTarget?.notes || "",
      opportunity:
        (isAdviceTopic
          ? targetResult?.salesOpportunity || (isSingleStorePlan ? resultSalesOpportunity : undefined)
          : undefined) ||
        prevTarget?.opportunity ||
        targetResult?.salesOpportunity ||
        (isSingleStorePlan ? resultSalesOpportunity : undefined) ||
        "",
      nextDate: targetDate || prevTarget?.nextDate || "",
      visitPurpose,
      customerType: s.store?.customerType || undefined,
      province: s.province || s.store?.province || plan.province || undefined,
      isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
      unregisteredFarmerName: s.unregisteredFarmerName || undefined,
      unregisteredFarmerPhone: s.unregisteredFarmerPhone || undefined,
      farmerHomeAddress:
        targetResult?.farmerHomeAddress ||
        s.store?.addressLine ||
        (isFarmer && isSingleStorePlan ? resultFarmerAddress : undefined),
      plotLatitude:
        targetResult?.plotLatitude != null
          ? String(targetResult.plotLatitude)
          : isFarmer
            ? (isSingleStorePlan ? resultLat : undefined) || storeLat
            : storeLat || undefined,
      plotLongitude:
        targetResult?.plotLongitude != null
          ? String(targetResult.plotLongitude)
          : isFarmer
            ? (isSingleStorePlan ? resultLng : undefined) || storeLng
            : storeLng || undefined,
      plotImages: targetPlotImages.length > 0 ? targetPlotImages : undefined,
      productAdvice: isAdviceTopic
        ? targetResult?.productAdvice || (isSingleStorePlan ? resultProductAdvice : undefined)
        : undefined,
      advisedProducts: targetAdvisedProducts.length > 0 ? targetAdvisedProducts : undefined,
      discussionResult:
        targetResult?.discussionResult || (isSingleStorePlan ? resultDiscussionResult : undefined),
      salesOpportunity:
        targetResult?.salesOpportunity || (isSingleStorePlan ? resultSalesOpportunity : undefined),
      nextAction:
        targetResult?.nextAction || (isSingleStorePlan ? resultNextAction : undefined),
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
        plotLatitude: t1First.plotLatitude || resultLat || prevTarget?.plotLatitude,
        plotLongitude: t1First.plotLongitude || resultLng || prevTarget?.plotLongitude,
        farmerHomeAddress: t1First.farmerHomeAddress || resultFarmerAddress || prevTarget?.farmerHomeAddress,
        discussionResult: t1First.discussionResult || resultDiscussionResult || prevTarget?.discussionResult,
        nextAction: t1First.nextAction || resultNextAction || prevTarget?.nextAction,
      }
    : {
        customer: "",
        topic: "",
        notes: "",
        opportunity: resultSalesOpportunity || prevTarget?.opportunity || "",
        nextDate: resultNextMeetingDate || prevTarget?.nextDate || "",
        productAdvice: resultProductAdvice,
        salesOpportunity: resultSalesOpportunity,
        nextMeetingDate: resultNextMeetingDate,
        plotLatitude: resultLat || prevTarget?.plotLatitude,
        plotLongitude: resultLng || prevTarget?.plotLongitude,
        farmerHomeAddress: resultFarmerAddress || prevTarget?.farmerHomeAddress,
        discussionResult: resultDiscussionResult || prevTarget?.discussionResult,
        nextAction: resultNextAction || prevTarget?.nextAction,
        ...prevTarget,
      };

  return { primary, list };
}

/**
 * Maps Type 1 stores into Work Type Section Cards for Detail Views
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
