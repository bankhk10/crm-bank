/**
 * Constants for Type 4: วางบิล / เก็บเงิน (Billing & Payment Collection)
 */

export const COLLECT_TYPES = ["BILLING", "COLLECT"] as const;
export type CollectType = (typeof COLLECT_TYPES)[number];

export const COLLECT_TYPE_LABELS: Record<CollectType, string> = {
  BILLING: "วางบิล",
  COLLECT: "เก็บเงิน",
};

export const BILLING_STATUSES = [
  "วางบิลสำเร็จ",
  "วางบิลไม่สำเร็จ",
] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const BILLING_STATUS_CONFIG: Record<
  BillingStatus,
  { label: string; badgeClass: string; textClass: string }
> = {
  "วางบิลสำเร็จ": {
    label: "วางบิลสำเร็จ",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textClass: "text-emerald-700",
  },
  "วางบิลไม่สำเร็จ": {
    label: "วางบิลไม่สำเร็จ",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    textClass: "text-rose-700",
  },
};
