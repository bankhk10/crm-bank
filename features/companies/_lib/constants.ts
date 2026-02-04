export const STATUS_STYLES: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  INACTIVE: {
    label: "ไม่ใช้งาน",
    className:
      "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  SUSPENDED: {
    label: "ระงับ",
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-100",
    dot: "bg-red-500",
  },
};

export const DEFAULT_STATUS_STYLE = {
  label: "ไม่ระบุ",
  className:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};
