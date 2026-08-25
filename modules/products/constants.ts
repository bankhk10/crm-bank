/**
 * Products Feature - Constants
 * Static options and configuration values
 */

export const PACKAGE_UNIT_OPTIONS = [
  { value: "G", label: "G (กรัม)" },
  { value: "KG", label: "KG (กิโลกรัม)" },
  { value: "ML", label: "ML (มิลลิลิตร)" },
  { value: "L", label: "L (ลิตร)" },
] as const;

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
  PENDING_APPROVAL: {
    label: "รออนุมัติ",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-50",
    dot: "bg-amber-500",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
};

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "PENDING_APPROVAL", label: "รออนุมัติ" },
  { value: "INACTIVE", label: "ไม่ได้ใช้งาน" },
] as const;

export const ALL_STATUS_VALUE = "__ALL_STATUS__";
