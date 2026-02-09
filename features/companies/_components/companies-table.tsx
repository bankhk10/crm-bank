"use client";

import CustomTable from "@/components/custom/custom-table";
import { CompaniesToolbar } from "./companies-toolbar";
import { CompaniesCards } from "./companies-cards";
import { useCompanyColumns } from "../_hooks/use-company-columns";
import type { CompaniesTableProps } from "../_types/types";

export function CompaniesTable(props: CompaniesTableProps) {
    const {
        data,
        loading,
        canCreate,
        canDelete,
        onDeleteRequest,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        pagination,
    } = props;

    const columns = useCompanyColumns(onDeleteRequest, canDelete);

    return (
        <div className="space-y-4">
            <CompaniesToolbar
                canCreate={canCreate}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
            />

            {/* Mobile View */}
            <div className="block md:hidden">
                <CompaniesCards
                    data={data}
                    loading={loading}
                    canDelete={canDelete}
                    onDeleteRequest={onDeleteRequest}
                    pagination={pagination}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <CustomTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                />
            </div>
        </div>
    );
}
