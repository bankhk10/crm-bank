"use client";

import React from "react";
import CustomTable from "@/components/custom/custom-table";
import { CreditLimitToolbar } from "./credit-limit-toolbar";
import { CreditLimitCards } from "./credit-limit-cards";
import { useCreditLimitColumns } from "../_hooks/use-credit-limit-columns";
import type { CustomersCreditTableProps } from "../_types/types";

export function CreditLimitTable(props: CustomersCreditTableProps) {
    const {
        data,
        loading,
        pagination,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
    } = props;

    const columns = useCreditLimitColumns();

    return (
        <div className="space-y-4">
            <CreditLimitToolbar
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
            />

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
                    toolbar={<></>} // Disable default toolbar as we use CreditLimitToolbar
                />
            </div>
        </div>
    );
}
