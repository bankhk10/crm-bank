/**
 * Helper utilities for encoding and decoding TYPE 8 Meeting Store Notes.
 * 
 * Safely stores meeting details, promotional notes, and meeting configuration
 * together in `ActivityPlanStore.notes` as structured JSON data without losing existing plain text details.
 */

export interface Type8NotesExtra {
  meetingTarget?: string;
  farmerChannel?: string;
  venueType?: string;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subDealerStore?: string;
  dealerId?: string;
  dealerName?: string;
  attendeesCount?: number;
  [key: string]: any;
}

export interface DecodedType8Notes {
  detail: string;
  promotions: string[];
  meetingTarget?: string;
  farmerChannel?: string;
  venueType?: string;
  isUnregisteredSubdealer?: boolean;
  subdealerId?: string;
  subDealerStore?: string;
  dealerId?: string;
  dealerName?: string;
  attendeesCount?: number;
}

/**
 * Encode meeting detail text, promotion note strings, and optional metadata into a storage string.
 * If there are promotions or extra configuration, returns JSON string `{ detail, promotions, ...extra }`.
 * If there are no promotions or extra configuration, returns plain detail string.
 */
export function encodeType8StoreNotes(
  detail: string | null | undefined,
  promotions: string[] = [],
  extra?: Type8NotesExtra,
): string | null {
  const cleanDetail = detail?.trim() || "";
  const cleanPromos = promotions
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const hasExtra =
    extra &&
    Object.values(extra).some(
      (v) => v !== undefined && v !== null && v !== "",
    );

  if (cleanPromos.length > 0 || hasExtra) {
    return JSON.stringify({
      detail: cleanDetail,
      promotions: cleanPromos,
      ...(extra || {}),
    });
  }

  return cleanDetail || null;
}

/**
 * Safely decodes ActivityPlanStore.notes for TYPE 8.
 * Supports:
 * 1. Structured JSON: `{ detail: "...", promotions: [...], ...extra }`
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

        return {
          detail,
          promotions,
          meetingTarget: parsed.meetingTarget,
          farmerChannel: parsed.farmerChannel,
          venueType: parsed.venueType,
          isUnregisteredSubdealer:
            parsed.isUnregisteredSubdealer !== undefined
              ? Boolean(parsed.isUnregisteredSubdealer)
              : undefined,
          subdealerId: parsed.subdealerId,
          subDealerStore: parsed.subDealerStore,
          dealerId: parsed.dealerId,
          dealerName: parsed.dealerName,
          attendeesCount:
            parsed.attendeesCount != null
              ? Number(parsed.attendeesCount)
              : undefined,
        };
      }
    } catch {
      // JSON parse failed -> treat as plain text detail
    }
  }

  return { detail: trimmed, promotions: [] };
}
