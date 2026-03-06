"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface TableToolbarProps {
    /** Placeholder text for search input */
    searchPlaceholder?: string;
    /** Controlled search value */
    searchValue?: string;
    /** Search value change handler */
    onSearchChange?: (value: string) => void;
    /** Called when user presses Enter in search input */
    onSearchSubmit?: () => void;
    /** Label for the search input */
    searchLabel?: React.ReactNode;
    /** Whether to show search input (default: true) */
    showSearch?: boolean;

    /** Action buttons rendered on the right side (e.g. create button) */
    actions?: React.ReactNode;
    /** Where to position the actions. 'inline' places them in the 3rd column. 'bottom' places them in a new row right-aligned. */
    actionPosition?: "inline" | "bottom";
    /** Additional filter controls (rendered between search and actions) */
    filters?: React.ReactNode;

    /** Custom class name */
    className?: string;
}

export function TableToolbar({
    searchPlaceholder = "ค้นหา...",
    searchValue,
    onSearchChange,
    onSearchSubmit,
    searchLabel = "ค้นหา",
    showSearch = true,
    actions,
    actionPosition = "inline",
    filters,
    className,
}: TableToolbarProps) {
    return (
        <div
            className={`rounded-md border bg-background/60 p-4 grid gap-4 ${className ?? ""}`}
        >
            <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
                {/* Search Input */}
                {showSearch && (
                    <div className="space-y-2 lg:col-span-1">
                        {searchLabel && (
                            <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mx-1">
                                {searchLabel}
                            </label>
                        )}
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValue ?? ""}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") onSearchSubmit?.();
                                }}
                                className="pl-9 h-11 w-full bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Additional filters */}
                {filters && (
                    <div className={
                        !showSearch
                            ? (actionPosition === "inline" ? "lg:col-span-2" : "lg:col-span-3")
                            : (actionPosition === "inline" ? "lg:col-span-1" : "lg:col-span-2")
                    }>
                        {filters}
                    </div>
                )}

                {/* Action buttons (inline) */}
                {actions && actionPosition === "inline" && (
                    <div
                        className={`flex items-end gap-2 lg:justify-end ${!showSearch && !filters
                            ? "lg:col-span-3"
                            : !showSearch || !filters
                                ? "lg:col-span-2"
                                : "lg:col-span-1"
                            }`}
                    >
                        {actions}
                    </div>
                )}
            </div>

            {/* Action buttons (bottom) */}
            {actions && actionPosition === "bottom" && (
                <div className="flex flex-wrap items-center gap-2 justify-end w-full pt-1">
                    {actions}
                </div>
            )}
        </div>
    );
}

export default TableToolbar;
