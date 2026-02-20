"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TruncatedCellProps {
    value: string;
    className?: string;
}

export function TruncatedCell({ value, className }: TruncatedCellProps) {
    return (
        <div className={cn("truncate", className)} title={value}>
            {value}
        </div>
    );
}
