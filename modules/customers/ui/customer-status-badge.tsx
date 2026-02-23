import React from "react";
import { cn } from "@/lib/utils";
import { getStatusStyle } from "../constants";

export function CustomerStatusBadge({
    status,
    className,
}: {
    status?: string;
    className?: string;
}) {
    const info = getStatusStyle(status || "");

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
