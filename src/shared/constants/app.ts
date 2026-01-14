/**
 * Application Constants
 * General application-wide constants
 */

/**
 * Order expiry configuration
 */
export const ORDER_CONFIG = {
  /** Number of days until order expires after approval */
  EXPIRY_DAYS: 3,
  /** Maximum number of delivery date updates allowed */
  MAX_DELIVERY_UPDATES: 3,
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 20, 50, 100],
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  DISPLAY: "dd MMMM yyyy",
  DISPLAY_SHORT: "dd/MM/yyyy",
  DISPLAY_WITH_TIME: "dd MMMM yyyy HH:mm",
  ISO: "yyyy-MM-dd",
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
};

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

/**
 * Delivery methods
 */
export const DELIVERY_METHODS = {
  SALES_DELIVERY: "SALES_DELIVERY",
  CUSTOMER_PICKUP: "CUSTOMER_PICKUP",
  COURIER: "COURIER",
} as const;

export type DeliveryMethod =
  (typeof DELIVERY_METHODS)[keyof typeof DELIVERY_METHODS];

/**
 * Delivery method labels in Thai
 */
export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  SALES_DELIVERY: "พนักงานขายนำส่ง",
  CUSTOMER_PICKUP: "ลูกค้ารับเอง",
  COURIER: "ส่งผ่านบริษัทขนส่ง",
};

/**
 * Thai regions
 */
export const THAI_REGIONS = [
  "ภาคเหนือ",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคกลาง",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคใต้",
] as const;

export type ThaiRegion = (typeof THAI_REGIONS)[number];
