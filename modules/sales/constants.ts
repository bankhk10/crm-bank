import { SaleStatus, PaymentTerm } from "@/lib/db";

/**
 * Order expiry configuration
 */
export const ORDER_CONFIG = {
  /** Number of days until order expires after approval */
  EXPIRY_DAYS: 3,
  /** Maximum number of delivery date updates allowed */
  MAX_DELIVERY_UPDATES: 3,
} as const;

/**
 * Sale status labels in Thai
 */
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: "รอดำเนินการ",
  PENDING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  AWAITING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระแล้ว",
  AWAITING_DELIVERY: "รอจัดส่ง",
  DELIVERED: "ระหว่างขนส่ง",
  DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
  EXPIRED: "หมดอายุ",
  OVERDUE: "เลยกำหนด",
  WAITING_FOR_CORRECTION: "รอแก้ไข",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

/**
 * Sale status styles for UI badges
 */
export const SALE_STATUS_STYLES: Record<
  SaleStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  PENDING_APPROVAL: {
    label: "รออนุมัติ",
    className:
      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100",
    dot: "bg-yellow-500",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-100",
    dot: "bg-red-500",
  },
  AWAITING_PAYMENT: {
    label: "รอชำระเงิน",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  PAID: {
    label: "ชำระเงินแล้ว",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  AWAITING_DELIVERY: {
    label: "รอจัดส่ง",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-100",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    label: "ระหว่างขนส่ง",
    className:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-100",
    dot: "bg-indigo-500",
  },
  DELIVERY_COMPLETED: {
    label: "ส่งเสร็จแล้ว",
    className:
      "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-100",
    dot: "bg-cyan-500",
  },
  EXPIRED: {
    label: "หมดอายุ",
    className:
      "bg-gray-100 text-gray-600 ring-1 ring-gray-300 dark:bg-gray-800/50 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  OVERDUE: {
    label: "เลยกำหนด",
    className:
      "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-900/40 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    className:
      "bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-900/40 dark:text-green-100",
    dot: "bg-green-600",
  },
  WAITING_FOR_CORRECTION: {
    label: "รอแก้ไข",
    className:
      "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className:
      "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-200",
    dot: "bg-red-600",
  },
};

// Alias for backward compatibility if needed within module
export const STATUS_STYLE = SALE_STATUS_STYLES;

export const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};

/**
 * Payment term labels and helper functions
 */
export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  CREDIT_90: "ส่งสินค้าก่อน (เครดิต 90 วัน)",
  CASH_7: "ชำระเงินสด (เครดิต 7 วัน)",
  PREPAID: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
  CREDIT_OVER_90: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
};

export const PAYMENT_TERM_SHORT_LABELS: Record<PaymentTerm, string> = {
  CREDIT_90: "เครดิต 90 วัน",
  CASH_7: "เงินสด 7 วัน",
  PREPAID: "ชำระก่อน",
  CREDIT_OVER_90: "เครดิต >90 วัน",
};

export const PAYMENT_TERM_DAYS: Record<PaymentTerm, number> = {
  CREDIT_90: 90,
  CASH_7: 7,
  PREPAID: 0,
  CREDIT_OVER_90: 120,
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

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  SALES_DELIVERY: "พนักงานขายนำส่ง",
  CUSTOMER_PICKUP: "ลูกค้ารับเอง",
  COURIER: "ส่งโดยบริษัทขนส่ง",
};

/**
 * Helper to get status style
 */
export function getSaleStatusStyle(status?: string) {
  if (!status || !(status in SALE_STATUS_STYLES)) {
    return DEFAULT_BADGE_STYLE;
  }
  return SALE_STATUS_STYLES[status as SaleStatus];
}
