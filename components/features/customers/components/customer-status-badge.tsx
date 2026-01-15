"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Status style configuration
 */
const statusStyle: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "ใช้งาน",
    className:
      "bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-green-900/30 dark:text-green-50",
    dot: "bg-green-500",
  },
  INACTIVE: {
    label: "ไม่ใช้งาน",
    className:
      "bg-gray-50 text-gray-700 ring-1 ring-gray-100 dark:bg-gray-800/50 dark:text-gray-100",
    dot: "bg-gray-400",
  },
  PENDING: {
    label: "รอดำเนินการ",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-900/30 dark:text-orange-50",
    dot: "bg-orange-500",
  },
};

/**
 * Customer Status Badge Component
 * Displays customer status with appropriate styling
 */
export function CustomerStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const style = statusStyle[status ?? "ACTIVE"] ?? statusStyle.ACTIVE;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "items-center gap-1.5 px-3 py-1 text-xs font-medium",
        style.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </Badge>
  );
}

/**
 * Get status style by status code
 */
export function getStatusStyle(status: string) {
  return statusStyle[status] ?? statusStyle.ACTIVE;
}
