/**
 * Employee Feature - Constants
 */

export const PREFIX_OPTIONS = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
];

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "INACTIVE", label: "ไม่ใช้งาน" },
];

export const POSITION_OPTIONS = [
  { value: "ผู้บริหารระดับสูง", label: "ผู้บริหารระดับสูง" },
  { value: "ผู้จัดการ", label: "ผู้จัดการ" },
  { value: "หัวหน้างาน", label: "หัวหน้างาน" },
  { value: "พนักงานปฏิบัติการ", label: "พนักงานปฏิบัติการ" },
];

export const RESPONSIBILITY_AREA_OPTIONS = [
  { value: "ภาคเหนือ", label: "ภาคเหนือ" },
  { value: "ภาคตะวันออกเฉียงเหนือ", label: "ภาคตะวันออกเฉียงเหนือ" },
  { value: "ภาคตะวันออก", label: "ภาคตะวันออก" },
  { value: "ภาคตะวันตก", label: "ภาคตะวันตก" },
  { value: "ภาคกลาง", label: "ภาคกลาง" },
  { value: "ภาคใต้", label: "ภาคใต้" },
];

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

export const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};
