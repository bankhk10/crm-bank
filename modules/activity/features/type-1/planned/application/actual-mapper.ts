import type { Type1ActualData, Type1TargetActualItem } from "../types/actual.types";
import type { Type1AdviceProductItem, Type1ImageFile } from "../../shared/types";

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
    resData.activityPlan?.type1Products ||
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

  const type1Obj =
    resData.type1Result ||
    resData.activityResultType1 ||
    resData.type1Results?.[0] ||
    resData.activityPlan?.type1Results?.[0] ||
    resData.activityPlan?.type1Result ||
    resData.activityPlan?.type1Stores?.[0]?.result ||
    resData.type1Stores?.[0]?.result;

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

  const allT1Results =
    resData.type1Results ||
    resData.activityPlan?.type1Results ||
    (resData.activityPlan?.type1Stores || [])
      .map((s: any) => s.result)
      .filter(Boolean);

  if (allT1Results && allT1Results.length > 1) {
    const stores = resData.activityPlan?.type1Stores || [];
    const getStoreName = (idx: number, r: any) => {
      const match = stores.find((s: any) => s.id === r.planStoreId);
      return match?.isUnregisteredFarmer
        ? match?.unregisteredFarmerName
        : match?.store?.name || match?.storeName || `เป้าหมายที่ ${idx + 1}`;
    };

    const combinedDiscussion = allT1Results
      .map((r: any, idx: number) => {
        if (!r?.discussionResult) return "";
        const name = getStoreName(idx, r);
        return `${name}: ${r.discussionResult}`;
      })
      .filter(Boolean)
      .join(" | ");
    if (combinedDiscussion) result.t1DiscussionResult = combinedDiscussion;

    const combinedNextAction = allT1Results
      .map((r: any, idx: number) => {
        if (!r?.nextAction) return "";
        const name = getStoreName(idx, r);
        return `${name}: ${r.nextAction}`;
      })
      .filter(Boolean)
      .join(" | ");
    if (combinedNextAction) result.t1NextAction = combinedNextAction;

    const combinedAddress = allT1Results
      .map((r: any, idx: number) => {
        if (!r?.farmerHomeAddress) return "";
        const name = getStoreName(idx, r);
        return `${name}: ${r.farmerHomeAddress}`;
      })
      .filter(Boolean)
      .join(" | ");
    if (combinedAddress) result.t1FarmerHomeAddress = combinedAddress;
  }

  return result;
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
  items: Type1TargetActualItem[],
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
      salesOpportunity: (single.salesOpportunity as "สูง" | "ต่ำ" | "") || "",
      nextAction: single.nextAction || "",
      nextMeetingDate: single.nextMeetingDate || "",
      farmerHomeAddress: single.farmerHomeAddress || "",
      plotLatitude: single.plotLatitude || "",
      plotLongitude: single.plotLongitude || "",
      plotImages: single.plotImages || [],
    };
  }

  const discussionResult = items
    .map((it) => {
      const name = it.isUnregisteredFarmer
        ? it.unregisteredFarmerName || it.customer || "เป้าหมาย"
        : it.customer || "เป้าหมาย";
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
        ? it.unregisteredFarmerName || it.customer || "เป้าหมาย"
        : it.customer || "เป้าหมาย";
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
        ? it.unregisteredFarmerName || it.customer || "เกษตรกร"
        : it.customer || "เกษตรกร";
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
