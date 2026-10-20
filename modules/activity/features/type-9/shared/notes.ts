/**
 * Helper utilities for encoding and decoding TYPE 9 Store Event Notes.
 */

export interface DecodedType9Notes {
  detail: string;
  promotions: string[];
}

export function encodeType9StoreNotes(
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

export function decodeType9StoreNotes(
  rawNotes: string | null | undefined,
): DecodedType9Notes {
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
