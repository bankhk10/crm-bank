import React from "react";
import { cn } from "@/lib/utils";

const statusStyle: Record<
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
};

export function ProductStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const key = (status || "").toUpperCase();
  const info = statusStyle[key] ?? {
    label: "ไม่ระบุ",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        info.className,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", info.dot)} aria-hidden />
      {info.label}
    </span>
  );
}

// Also export statusStyle for potential reuse if needed, or keeping it internal is fine.
// In original file it was used in Filter select too. So I should export it or move it to utils/constants.
// But for now I'll duplicate the object in Filter or better, export it from a constants or types file?
// Actually, `sales` puts constants in `types.ts` or just inline.
// I will export `statusStyle` here or make it accessible.
export { statusStyle };
