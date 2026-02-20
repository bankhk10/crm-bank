import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_STYLE } from "../_lib/constants";

export function ProductStatusBadge({
    status,
    className,
}: {
    status?: string;
    className?: string;
}) {
    const key = (status || "").toUpperCase();
    const info = STATUS_STYLE[key] ?? {
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

export { STATUS_STYLE as statusStyle };
