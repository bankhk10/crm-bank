"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CustomersCreditTableProps } from "../_types/types";

type Props = Pick<
    CustomersCreditTableProps,
    "searchValue" | "onSearchChange" | "onSearchSubmit"
>;

export function CreditLimitToolbar({
    searchValue,
    onSearchChange,
    onSearchSubmit,
}: Props) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative w-1/2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาชื่อลูกค้า, รหัสลูกค้า..."
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearchSubmit?.();
                        }
                    }}
                    className="pl-9 bg-white"
                />
            </div>
        </div>
    );
}
