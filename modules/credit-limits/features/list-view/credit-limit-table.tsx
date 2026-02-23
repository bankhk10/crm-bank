"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import CustomTable from "@/components/custom/custom-table";
import { CreditLimitCards } from "./credit-limit-cards";
import { useCreditLimitColumns } from "./use-credit-limit-columns";
import type { CustomersCreditTableProps } from "../../types";

export function CreditLimitTable(props: CustomersCreditTableProps) {
    const {
        data,
        loading,
        pagination,
        searchValue,
        onSearchChange,
        onSearchSubmit,
    } = props;

    const columns = useCreditLimitColumns();

    return (
        <div className="space-y-4">
            {/* Toolbar */}
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

            {/* Mobile View */}
            <div className="block md:hidden">
                <CreditLimitCards
                    data={data}
                    loading={loading}
                    pagination={pagination}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>} // Disable default toolbar as we use inline toolbar
                />
            </div>
        </div>
    );
}
