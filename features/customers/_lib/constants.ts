/**
 * Customer Feature - Constants & Utils
 */

export const ALL_FILTER_VALUE = "__ALL__";
export const ALL_STATUS_VALUE = "__ALL_STATUS__";

/**
 * Status style configuration
 */
export const STATUS_STYLE: Record<
  string,
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
    label: "ระงับ",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-900/30 dark:text-orange-50",
    dot: "bg-orange-500",
  },
};

/**
 * Customer type style configuration
 */
export const CUSTOMER_TYPE_STYLE: Record<
  string,
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
 * Get status style by status code
 */
export function getStatusStyle(status: string) {
  const key = status?.toUpperCase() || "";
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
  const key = type?.toUpperCase() || "";
  return CUSTOMER_TYPE_STYLE[key] ?? { ...DEFAULT_BADGE_STYLE, buttonColor: "bg-gray-600" };
}
