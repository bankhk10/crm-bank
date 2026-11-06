export const USAGE_RESULTS = [
  "พืชตอบสนองดี",
  "ลูกค้าพึงพอใจ",
  "พบปัญหา",
] as const;

export type UsageResult = (typeof USAGE_RESULTS)[number];

export const USAGE_RESULT_CONFIG: Record<
  UsageResult,
  { label: string; badgeClass: string; textClass: string }
> = {
  พืชตอบสนองดี: {
    label: "พืชตอบสนองดี",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textClass: "text-emerald-700",
  },
  ลูกค้าพึงพอใจ: {
    label: "ลูกค้าพึงพอใจ",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    textClass: "text-blue-700",
  },
  พบปัญหา: {
    label: "พบปัญหา",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    textClass: "text-amber-700",
  },
};
