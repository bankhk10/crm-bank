import type { Type12TargetItem } from "../types/planned.types";

/**
 * Extracts Type 12 plan targets (Tour / Study trip details) from activity plan relations.
 */
export function extractType12PlanTargets(
  plan: any,
  prevTarget?: Type12TargetItem,
): { primary: Type12TargetItem; list: Type12TargetItem[] } {
  const tour = plan?.tour || plan?.tourData;

  const primary: Type12TargetItem = {
    id: tour?.id,
    tourType: tour?.tourType || prevTarget?.tourType || "CENTRAL",
    tourSize: tour?.tourSize || prevTarget?.tourSize || null,
    country: tour?.country || prevTarget?.country || null,
    storeId: tour?.storeId || prevTarget?.storeId || null,
    storeName:
      tour?.store?.name || tour?.storeName || prevTarget?.storeName || null,
    destination: tour?.destination || prevTarget?.destination || null,
    detail:
      tour?.destination ||
      tour?.country ||
      prevTarget?.detail ||
      "",
  };

  return {
    primary,
    list: [primary],
  };
}

/**
 * Hydrates Type 12 planned initial values from plan or initDetails
 */
export function hydrateType12PlannedData(initial: any, initDetails: any) {
  let tourType = "ทัวร์กลาง";
  let tourSize = "ทัวร์เล็ก";
  let country = "";
  let store = "";
  let storeId = "";
  let destination = "";

  const tour = initial?.tour || initial?.tourData;
  if (tour) {
    tourType = tour.tourType === "STORE" ? "ทัวร์ร้านค้า" : "ทัวร์กลาง";
    tourSize = tour.tourSize === "LARGE" ? "ทัวร์ใหญ่" : "ทัวร์เล็ก";
    country = tour.country || "";
    store = tour.store?.name || tour.storeName || "";
    storeId = tour.storeId || tour.store?.id || "";
    destination = tour.destination || "";
  } else if (initDetails?.type12TourType) {
    tourType = initDetails.type12TourType;
    tourSize = initDetails.type12TourSize || "ทัวร์เล็ก";
    country = initDetails.type12Country || "";
    store = initDetails.type12Store || "";
    storeId = initDetails.type12StoreId || "";
    destination = initDetails.type12Destination || "";
  } else if (Array.isArray(initDetails)) {
    const item = initDetails.find(
      (i: any) =>
        i.itemType === "TYPE_12" ||
        (i.detail && i.detail.includes("[ทัวร์")) ||
        (i.visitTopic &&
          (i.visitTopic === "ทัวร์กลาง" || i.visitTopic === "ทัวร์ร้านค้า")),
    );
    if (item) {
      if (item.visitTopic) tourType = item.visitTopic;
      if (item.customerName) store = item.customerName;
      if (item.customerId) storeId = item.customerId;
      if (item.detail) {
        if (item.detail.includes("ทัวร์กลาง")) tourType = "ทัวร์กลาง";
        if (item.detail.includes("ทัวร์ร้านค้า")) tourType = "ทัวร์ร้านค้า";

        const sizeMatch = item.detail.match(/ขนาดทัวร์:\s*([^|]+)/);
        if (sizeMatch) tourSize = sizeMatch[1].trim();

        const countryMatch = item.detail.match(/ประเทศ:\s*([^|]+)/);
        if (countryMatch) country = countryMatch[1].trim();

        const storeMatch = item.detail.match(/ร้านค้า:\s*([^|]+)/);
        if (storeMatch) store = storeMatch[1].trim();

        const destMatch = item.detail.match(/สถานที่(?:ที่จะไป)?:\s*([^|]+)/);
        if (destMatch) destination = destMatch[1].trim();
      }
    }
  }

  return {
    tourType,
    tourSize,
    country,
    store,
    storeId,
    destination,
  };
}

/**
 * Pure mapper for Type 12 Plan Detail View Section items
 */
export function mapType12ToSectionItems(
  tour: any,
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t12Line = objectiveLines.find(
    (l) => l.includes("[ทัวร์") || l.includes("ทัวร์"),
  );

  if (!tour && !t12Line) {
    return null;
  }

  const extraFields: Array<{ label: string; value: string }> = [];

  if (tour?.tourType) {
    extraFields.push({
      label: "ประเภททัวร์",
      value: tour.tourType === "STORE" ? "ทัวร์ร้านค้า" : "ทัวร์กลาง",
    });
  }

  if (tour?.tourSize) {
    extraFields.push({
      label: "ขนาดทัวร์",
      value:
        tour.tourSize === "LARGE" || tour.tourSize === "ทัวร์ใหญ่"
          ? "ทัวร์ใหญ่"
          : "ทัวร์เล็ก",
    });
  }

  if (tour?.country) {
    extraFields.push({
      label: "ประเทศ/ปลายทาง",
      value: tour.country,
    });
  }

  if (tour?.store?.name || tour?.storeName) {
    extraFields.push({
      label: "ร้านค้า",
      value: tour.store?.name || tour.storeName,
    });
  }

  if (tour?.destination) {
    extraFields.push({
      label: "สถานที่",
      value: tour.destination,
    });
  }

  return {
    typeIndex: 12,
    title: "พาลูกค้าศึกษาดูงาน (ทัวร์)",
    badge: "ทัวร์",
    items: [
      {
        title: tour?.destination || tour?.country || "ทัวร์",
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      },
    ],
    rawSummary: t12Line ? t12Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
