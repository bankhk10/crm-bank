"use client";

import CustomTable from "@/components/custom/custom-table";
import { ShippingCompaniesToolbar } from "./shipping-companies-toolbar";
import { useShippingCompanyColumns } from "../_hooks/use-shipping-company-columns";
import type { ShippingCompanyRecord, ShippingCompaniesPagination } from "../_types";
import type { DateRange } from "react-day-picker";

export interface ShippingCompaniesTableProps {
    data: ShippingCompanyRecord[];
    loading?: boolean;
    canCreate: boolean;
    canDelete: boolean;
    onDeleteRequest: (shippingCompany: ShippingCompanyRecord) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    isTyping?: boolean;
    onSearchSubmit?: () => void;
    dateRange?: DateRange;
    onDateRangeChange: (range: DateRange | undefined) => void;
    pagination: ShippingCompaniesPagination;
}

export function ShippingCompaniesTable(props: ShippingCompaniesTableProps) {
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

    const columns = useShippingCompanyColumns(onDeleteRequest, canDelete);

    return (
        <div className="space-y-4">
            <ShippingCompaniesToolbar
                canCreate={canCreate}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
            />

            <CustomTable
                data={data}
                columns={columns}
                loading={loading}
                pagination={pagination}
                toolbar={<></>}
            />
        </div>
    );
}
