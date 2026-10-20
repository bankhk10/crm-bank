/**
 * Helper utilities for encoding and decoding TYPE 8 Meeting Store Notes.
 * 
 * Safely stores meeting details and promotional notes together in `ActivityPlanStore.notes`
 * as structured JSON data without losing existing plain text details.
 */

export interface DecodedType8Notes {
  detail: string;
  promotions: string[];
}

/**
 * Encode meeting detail text and promotion note strings into a storage string.
 * If there are promotions, returns JSON string `{ detail, promotions }`.
 * If there are no promotions, returns plain detail string.
 */
export function encodeType8StoreNotes(
  detail: string | null | undefined,
  promotions: string[] = [],
): string | null {
  const cleanDetail = detail?.trim() || "";
  const cleanPromos = promotions
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (cleanPromos.length > 0) {
    return JSON.stringify({
      detail: cleanDetail,
      promotions: cleanPromos,
    });
  }

  return cleanDetail || null;
}

/**
 * Safely decodes ActivityPlanStore.notes for TYPE 8.
 * Supports:
 * 1. Structured JSON: `{ detail: "...", promotions: [...] }`
 * 2. Legacy Plain text: treats entire string as `detail`, with `promotions: []`
 * 3. Null / undefined / empty string
 */
export function decodeType8StoreNotes(
  rawNotes: string | null | undefined,
): DecodedType8Notes {
  if (!rawNotes || typeof rawNotes !== "string") {
    return { detail: "", promotions: [] };
  }

  const trimmed = rawNotes.trim();
  if (!trimmed) {
    return { detail: "", promotions: [] };
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const detail =
          typeof parsed.detail === "string" ? parsed.detail.trim() : "";
        const promotions = Array.isArray(parsed.promotions)
          ? parsed.promotions
              .map((p: unknown) => (p != null ? String(p).trim() : ""))
              .filter((p: string) => p.length > 0)
          : [];

        return { detail, promotions };
      }
    } catch {
      // JSON parse failed -> treat as plain text detail
    }
  }

  return { detail: trimmed, promotions: [] };
}
