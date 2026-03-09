"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearSearchButtonProps {
    /** Callback function to clear the search/filters */
    onClick: () => void;
    /** Text to display on the button (default: "ล้างค้นหา") */
    label?: string;
    /** Optional additional classes for the button */
    className?: string;
    /** Optional additional classes for the container (useful for grid positioning) */
    containerClassName?: string;
}

/**
 * A reusable "Clear Search" or "Reset Filter" button with a consistent red-themed aesthetic.
 * This is designed to be used within filter or search toolbars.
 */
export function ClearSearchButton({
    onClick,
    label = "ล้างค้นหา",
    className,
    containerClassName,
}: ClearSearchButtonProps) {
    return (
        <div className={cn("w-full sm:w-auto mt-1 sm:mt-0 flex justify-end", containerClassName)}>
            <Button
                variant="outline"
                type="button"
                className={cn(
                    "min-h-[44px] sm:min-h-[30px] px-4 sm:px-3 text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-200 shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-2 mb-1",
                    className
                )}
                onClick={onClick}
            >
                <X className="h-4 w-4 shrink-0" />
                <span className="font-medium whitespace-nowrap">{label}</span>
            </Button>
        </div>
    );
}
