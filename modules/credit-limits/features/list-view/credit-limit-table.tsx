"use client";

import React from "react";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
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

    const toolbar = (
        <TableToolbar
            searchPlaceholder="ค้นหาชื่อลูกค้า, รหัสลูกค้า..."
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            actions={null} // No create button for credit limits here
        />
    );

    return (
        <ResponsiveDataView
            breakpoint="md"
            toolbar={toolbar}
            cards={
                <CreditLimitCards
                    data={data}
                    loading={loading}
                    pagination={pagination}
                />
            }
            table={
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                />
            }
        />
    );
}
