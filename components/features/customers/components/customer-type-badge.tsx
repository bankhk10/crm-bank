"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerTypeStyle } from "../types";

/**
 * Customer type style configuration
 */
const customerTypeStyle: Record<string, CustomerTypeStyle> = {
  DEALER: {
    label: "ตัวแทนจำหน่าย",
    className:
      "rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-50",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  SUBDEALER: {
    label: "ร้านค้าย่อย",
    className:
      "rounded-full bg-teal-100 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-50",
    buttonColor: "bg-teal-600 hover:bg-teal-700",
  },
  FARMER: {
    label: "เกษตรกร",
    className:
      "rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-50",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  BROKER: {
    label: "นายหน้า",
    className:
      "rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-50",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  },
};

const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
};

/**
 * Customer Type Badge Component
 * Displays customer type with color-coded badge
 */
export function CustomerTypeBadge({ type }: { type?: string }) {
  const style = customerTypeStyle[type ?? ""] ?? DEFAULT_BADGE_STYLE;

  return (
    <Badge variant="secondary" className={cn("px-3 py-1", style.className)}>
      {style.label}
    </Badge>
  );
}

/**
 * Get customer type style by type code
 */
export function getCustomerTypeStyle(type: string): CustomerTypeStyle {
  return (
    customerTypeStyle[type] ?? {
      ...DEFAULT_BADGE_STYLE,
      buttonColor: "bg-slate-600 hover:bg-slate-700",
    }
  );
}

/**
 * Get all customer type styles (for dropdown menus, etc.)
 */
export function getAllCustomerTypeStyles() {
  return customerTypeStyle;
}
