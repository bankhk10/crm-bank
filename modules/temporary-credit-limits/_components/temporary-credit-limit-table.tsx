"use client";

import React from "react";
import CustomTable from "@/components/custom/custom-table";
import type { TemporaryCreditLimitTableProps } from "../_types/types";
import { useTemporaryCreditLimitColumns } from "../_hooks/use-temporary-credit-limit-columns";
import { TemporaryCreditLimitToolbar } from "./temporary-credit-limit-toolbar";
import { TemporaryCreditLimitCards } from "./temporary-credit-limit-cards";

export function TemporaryCreditLimitTable(
    props: TemporaryCreditLimitTableProps
) {
    const {
        data,
        loading,
        pagination,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        canCreate,
        canEdit = false,
        canDelete = false,
        canApprove = false,
        onDelete,
    } = props;

    const columns = useTemporaryCreditLimitColumns(
        canEdit,
        canDelete,
        canApprove,
        onDelete
    );

    const toolbarProps = {
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        canCreate,
    };

    return (
        <div className="space-y-6">
            {/* Mobile & Tablet: card layout */}
            <div className="xl:hidden space-y-4">
                <TemporaryCreditLimitToolbar {...toolbarProps} />
                <TemporaryCreditLimitCards
                    data={data}
                    loading={loading}
                    canApprove={canApprove}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={onDelete}
                    pagination={pagination}
                />
            </div>

            {/* Desktop & up: table layout */}
            <div className="hidden xl:block">
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<TemporaryCreditLimitToolbar {...toolbarProps} />}
                    emptyState={{
                        title: "ไม่พบข้อมูลรายการคำขอ",
                        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างคำขอใหม่",
                    }}
                    className="w-full"
                />
            </div>
        </div>
    );
}
