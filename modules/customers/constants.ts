import { CustomerType, CustomerStatus } from "@/lib/db";

export const ALL_FILTER_VALUE = "__ALL__";
export const ALL_STATUS_VALUE = "__ALL_STATUS__";

/**
 * Customer type labels in Thai
 */
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  DEALER: "ตัวแทนจำหน่าย",
  SUBDEALER: "ร้านค้าย่อย",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

/**
 * Customer status labels in Thai
 */
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  SUSPENDED: "ระงับชั่วคราว",
};

/**
 * Status style configuration
 */
export const STATUS_STYLE: Record<
  CustomerStatus,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-50",
    dot: "bg-emerald-500",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
  SUSPENDED: {
    label: "ระงับชั่วคราว",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-900/30 dark:text-orange-50",
    dot: "bg-orange-500",
  },
};

/**
 * Customer type style configuration
 */
export const CUSTOMER_TYPE_STYLE: Record<
  CustomerType,
  { label: string; className: string; buttonColor: string }
> = {
  DEALER: {
    label: "ตัวแทนจำหน่าย",
    className:
      "rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-50",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  SUBDEALER: {
    label: "ร้านค้าย่อย",
    className:
      "rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-50",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  FARMER: {
    label: "เกษตรกร",
    className:
      "rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-50",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
  },
  BROKER: {
    label: "นายหน้า",
    className:
      "rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-50",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  },
};

export const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};

/**
 * Options for select inputs
 */
export const CUSTOMER_TYPE_OPTIONS = Object.entries(CUSTOMER_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as CustomerType,
    label,
  }),
);

export const CUSTOMER_STATUS_OPTIONS = Object.entries(
  CUSTOMER_STATUS_LABELS,
).map(([value, label]) => ({
  value: value as CustomerStatus,
  label,
}));

/**
 * Get status style by status code
 */
export function getStatusStyle(status: string) {
  const key = status?.toUpperCase() as CustomerStatus;
  return (
    STATUS_STYLE[key] ?? {
      ...DEFAULT_BADGE_STYLE,
      label: key || "ไม่ระบุ",
      dot: "bg-slate-400",
    }
  );
}

/**
 * Get customer type style by type code
 */
export function getCustomerTypeStyle(type: string) {
  const key = type?.toUpperCase() as CustomerType;
  return (
    CUSTOMER_TYPE_STYLE[key] ?? {
      ...DEFAULT_BADGE_STYLE,
      buttonColor: "bg-gray-600",
    }
  );
}
