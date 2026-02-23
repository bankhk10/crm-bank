import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_STYLE, DEFAULT_BADGE_STYLE } from "../constants";

export function EmployeeStatusBadge({
    status,
    className,
}: {
    status?: string;
    className?: string;
}) {
    const key = (status || "").toUpperCase();
    const info = STATUS_STYLE[key] ?? {
        ...DEFAULT_BADGE_STYLE,
        label: key || "ไม่ระบุ",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                info.className,
                className,
            )}
        >
            <span className={cn("h-2 w-2 rounded-full", info.dot)} aria-hidden />
            {info.label}
        </span>
    );
}
