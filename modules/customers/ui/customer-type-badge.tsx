import React from "react";
import { cn } from "@/lib/utils";
import { getCustomerTypeStyle } from "../constants";

export function CustomerTypeBadge({
    type,
    className,
}: {
    type?: string;
    className?: string;
}) {
    const info = getCustomerTypeStyle(type || "");

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                info.className,
                className,
            )}
        >
            {info.label}
        </span>
    );
}
