"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SaleStatusLabels } from "@/types/sales";
import type { SaleStatus } from "@/types/sales";
import { STATUS_STYLE, DEFAULT_BADGE_STYLE } from "../constants";

interface StatusBadgeProps {
    status?: string;
    className?: string;
}

export function SaleStatusBadge({ status, className }: StatusBadgeProps) {
    const key = (status || "").toUpperCase() as SaleStatus;
    const info = STATUS_STYLE[key] ?? {
        ...DEFAULT_BADGE_STYLE,
        label: SaleStatusLabels[key] || key || "ไม่ระบุ",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                info.className,
                className,
            )}
        >
            <span
                className={cn("h-2 w-2 rounded-full", info.dot)}
                aria-hidden="true"
            />
            {info.label}
        </span>
    );
}
