import type { CustomerOption } from "../../shared/types";
import type { Type1UnplannedItem } from "../types/unplanned.types";

/**
 * Hydrates unplanned items (Target + Actual) from an ActivityPlan record
 */
export function hydrateType1UnplannedData(plan: any): Type1UnplannedItem[] {
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
        notes: "",
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
      notes: s.notes || s.detail || "",
      detail: s.notes || s.detail || "",
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

/**
 * Maps an unplanned item to a plan store database payload
 */
export function mapType1UnplannedItemToStore(
  item: Type1UnplannedItem,
  customersList: CustomerOption[] = [],
) {
  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;
    return {
      workTypeCode: "TYPE_1",
      visitPurpose: "STORE",
      storeId: sId || null,
      storeName: item.customerName || null,
      province: null,
      isUnregisteredFarmer: false,
      unregisteredFarmerName: null,
      unregisteredFarmerPhone: null,
      topic: item.topic || null,
      notes: item.notes || item.detail || null,
    };
  }

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
      notes: item.notes || item.detail || null,
    };
  }

  const sId =
    item.storeId ||
    customersList.find((c) => c.name === item.customerName)?.id;

  return {
    workTypeCode: "TYPE_1",
    visitPurpose: "FARMER",
    storeId: sId || null,
    storeName: item.customerName || null,
    province: item.province || null,
    isUnregisteredFarmer: false,
    unregisteredFarmerName: null,
    unregisteredFarmerPhone: null,
    topic: item.topic || null,
    notes: item.notes || item.detail || null,
  };
}
