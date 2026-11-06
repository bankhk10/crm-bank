import type { Type12UnplannedItem } from "../types/unplanned.types";

export function hydrateType12UnplannedData(initial: any): Type12UnplannedItem {
  const tour = initial?.tour || initial?.tourData;
  const result = initial?.results?.[0] || initial?.result;

  return {
    tourType: tour?.tourType === "STORE" ? "STORE" : "CENTRAL",
    tourSize: tour?.tourSize === "LARGE" ? "LARGE" : "SMALL",
    country: tour?.country || "",
    storeId: tour?.storeId || "",
    storeName: tour?.store?.name || tour?.storeName || "",
    destination: tour?.destination || "",
    actualAttendees: result?.actualAttendees || undefined,
    tourHighlights: result?.tourHighlights || "",
    feedbackIssues: result?.feedbackIssues || "",
    images: result?.images || [],
  };
}

export function mapType12UnplannedToPayload(item: Type12UnplannedItem) {
  return {
    tourData: {
      tourType: item.tourType,
      tourSize: item.tourType === "CENTRAL" ? item.tourSize || "SMALL" : null,
      country: item.tourType === "CENTRAL" ? item.country?.trim() || null : null,
      storeId: item.tourType === "STORE" ? item.storeId || null : null,
      destination: item.tourType === "STORE" ? item.destination?.trim() || null : null,
    },
    type12Actual: {
      actualAttendees: item.actualAttendees,
      tourHighlights: item.tourHighlights?.trim() || null,
      feedbackIssues: item.feedbackIssues?.trim() || null,
      images: item.images || [],
    },
  };
}
