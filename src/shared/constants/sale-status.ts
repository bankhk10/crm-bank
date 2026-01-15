/**
 * Sale Status Constants
 * Centralized sale status definitions and labels
 */

import type { SaleStatus } from "@/src/infrastructure/database";

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
  DELIVERED: "จัดส่งแล้ว",
  DELIVERY_COMPLETED: "ส่งเสร็จแล้ว",
  EXPIRED: "หมดอายุ",
  OVERDUE: "เลยกำหนด",
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
  // 🟡 Yellow - รอดำเนินการ (Pending action required)
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
      "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-200",
    dot: "bg-red-600",
  },
  AWAITING_PAYMENT: {
    label: "รอชำระเงิน",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  PAID: {
    label: "ชำระแล้ว",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  // 🔵 Blue - รอจัดส่ง (In progress/Processing)
  AWAITING_DELIVERY: {
    label: "รอจัดส่ง",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-100",
    dot: "bg-blue-500",
  },
  DELIVERED: {
    label: "จัดส่งแล้ว",
    className:
      "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-100",
    dot: "bg-sky-500",
  },
  DELIVERY_COMPLETED: {
    label: "ส่งเสร็จแล้ว",
    className:
      "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-100",
    dot: "bg-teal-500",
  },
  EXPIRED: {
    label: "หมดอายุ",
    className:
      "bg-gray-100 text-gray-700 ring-1 ring-gray-300 dark:bg-gray-900/40 dark:text-gray-200",
    dot: "bg-gray-500",
  },
  OVERDUE: {
    label: "เลยกำหนด",
    className:
      "bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-200",
    dot: "bg-rose-600",
  },
  // 🟢 Green - เสร็จสิ้น (Completed)
  COMPLETED: {
    label: "เสร็จสิ้น",
    className:
      "bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-900/40 dark:text-green-100",
    dot: "bg-green-600",
  },
  // 🔴 Red - ยกเลิก (Cancelled/Error)
  CANCELLED: {
    label: "ยกเลิก",
    className:
      "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-200",
    dot: "bg-red-600",
  },
};

/**
 * Default badge style for unknown status
 */
export const DEFAULT_STATUS_STYLE = {
  label: "ไม่ระบุ",
  className:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};

/**
 * Get status style safely with fallback
 */
export function getSaleStatusStyle(status?: string) {
  if (!status || !(status in SALE_STATUS_STYLES)) {
    return DEFAULT_STATUS_STYLE;
  }
  return SALE_STATUS_STYLES[status as SaleStatus];
}

/**
 * Status groups for filtering
 */
export const SALE_STATUS_GROUPS = {
  active: [
    "PENDING",
    "PENDING_APPROVAL",
    "APPROVED",
    "AWAITING_PAYMENT",
    "AWAITING_DELIVERY",
  ] as SaleStatus[],
  completed: [
    "PAID",
    "DELIVERED",
    "DELIVERY_COMPLETED",
    "COMPLETED",
  ] as SaleStatus[],
  cancelled: ["REJECTED", "CANCELLED", "EXPIRED", "OVERDUE"] as SaleStatus[],
};

/**
 * Statuses that can be edited
 */
export const EDITABLE_STATUSES: SaleStatus[] = ["PENDING", "PENDING_APPROVAL"];

/**
 * Statuses that can be approved
 */
export const APPROVABLE_STATUSES: SaleStatus[] = ["PENDING_APPROVAL"];

/**
 * Statuses where stock is allocated
 */
export const STOCK_ALLOCATED_STATUSES: SaleStatus[] = [
  "APPROVED",
  "AWAITING_PAYMENT",
  "PAID",
  "AWAITING_DELIVERY",
  "DELIVERED",
  "DELIVERY_COMPLETED",
  "COMPLETED",
];
