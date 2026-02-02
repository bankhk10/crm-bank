"use client";

import * as React from "react";
import { BadgeDollarSign } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { useSaleColumns } from "../../_hooks";
import { SalesToolbar } from "./sales-toolbar";
import { SalesCards } from "./sales-cards";
import type { SalesTableProps } from "../../_types/types";

export function SalesTable(props: SalesTableProps) {
    const {
        sales,
        total,
        page,
        perPage,
        loading,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        onPageChange,
        onPerPageChange,
        onDelete,
        canCreate = false,
        canEdit = false,
        canDelete = false,
        canApprove = false,
        currentUserId,
        statusFilter,
        onStatusFilterChange,
        canEditItem,
        canDeleteItem,
    } = props;

    const columns = useSaleColumns(
        canEdit,
        canDelete,
        canApprove,
        currentUserId,
        onDelete,
        canEditItem,
        canDeleteItem,
    );

    const toolbarProps = {
        searchValue,
        onSearchChange,
        onSearchSubmit,
        statusFilter,
        onStatusFilterChange,
        dateRange,
        onDateRangeChange,
        canCreate,
    };

    const pagination = {
        page,
        perPage,
        total,
        onPageChange: onPageChange || (() => { }),
        onPerPageChange: onPerPageChange || (() => { }),
        perPageOptions: [10, 20, 30, 50],
    };

    return (
        <div className="bg-white shadow-sm sm:rounded-lg rounded-lg">
            <div className="p-6">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3">
                        <BadgeDollarSign className="w-9 h-9 text-blue-600" />
                        <h1 className="text-3xl font-bold tracking-tight">ข้อมูลการขาย</h1>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Mobile & Tablet: card layout */}
                    <div className="xl:hidden space-y-4">
                        <SalesToolbar {...toolbarProps} />
                        <SalesCards
                            data={sales}
                            loading={loading}
                            canApprove={canApprove}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            currentUserId={currentUserId}
                            onDelete={onDelete}
                            pagination={pagination}
                            canEditItem={canEditItem}
                            canDeleteItem={canDeleteItem}
                        />
                    </div>

                    {/* Desktop & up: table layout */}
                    <div className="hidden xl:block">
                        <CustomTable
                            columns={columns}
                            data={sales}
                            loading={loading}
                            pagination={pagination}
                            toolbar={<SalesToolbar {...toolbarProps} />}
                            emptyState={{
                                title: "ยังไม่มีรายการขาย",
                                description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างรายการขายใหม่",
                            }}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
