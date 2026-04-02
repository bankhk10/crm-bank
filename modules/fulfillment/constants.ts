import type { SaleStatus } from "@/modules/sales/types";

export const STATUS_STYLE: Record<
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
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-100",
    dot: "bg-red-500",
  },
  AWAITING_PAYMENT: {
    label: "รอดำเนินการชำระเงิน",
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
    label: "รอดำเนินการจัดส่งสินค้า",
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
  WAITING_FOR_CORRECTION: {
    label: "ส่งกลับให้แก้ไข",
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
  COMPLETED: {
    label: "เสร็จสิ้น",
    className:
      "bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-900/40 dark:text-green-100",
    dot: "bg-green-600",
  },
};

export const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};
