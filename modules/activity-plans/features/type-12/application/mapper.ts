import type { Type12TargetItem } from "../types";

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
