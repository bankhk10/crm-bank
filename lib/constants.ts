/**
 * Global Application Constants
 */

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 20, 30],
} as const;

/**
 * Date formats for display and ISO
 */
export const DATE_FORMATS = {
  DISPLAY: "dd MMMM yyyy",
  DISPLAY_SHORT: "dd/MM/yyyy",
  DISPLAY_WITH_TIME: "dd MMMM yyyy HH:mm",
  ISO: "yyyy-MM-dd",
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

/**
 * File upload limits and allowed types
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

/**
 * Thai regions for geographical grouping
 */
export const THAI_REGIONS = [
  "ภาคเหนือ",
  "ภาคอีสาน",
  "ภาคกลาง",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคใต้",
] as const;

export type ThaiRegion = (typeof THAI_REGIONS)[number];
