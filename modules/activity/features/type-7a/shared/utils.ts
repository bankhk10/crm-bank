/**
 * Utility functions for TYPE_7A
 */

/**
 * Format phone number to standard hyphenated format (e.g. 090-333-xxxx, 090-3339-xxxx or 02-xxx-xxxx)
 * Handles partial inputs as user types, as well as full 9-digit, 10-digit, and 11-digit numbers.
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = String(value).replace(/\D/g, "");
  if (!cleaned) return "";

  // 9 digits (Landline: 02-xxx-xxxx or provincial 0xx-xxx-xxx)
  if (cleaned.length === 9) {
    if (cleaned.startsWith("02")) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // 10 digits (Standard Mobile: 0xx-xxx-xxxx)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Partial typing / formatting
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  if (cleaned.length <= 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // 11 digits (e.g. 0xx-xxxx-xxxx)
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
}

