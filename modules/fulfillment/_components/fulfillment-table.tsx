"use client";

import * as React from "react";
import CustomTable from "@/components/custom/custom-table";
import { FulfillmentToolbar } from "./fulfillment-toolbar";
import { FulfillmentCards } from "./fulfillment-cards";
import { useFulfillmentColumns } from "../_hooks/use-fulfillment-columns";
import type { FulfillmentTableProps } from "../_types/types";

export function FulfillmentTable(props: FulfillmentTableProps) {
    const columns = useFulfillmentColumns();
    const {
        sales,
        total,
        page,
        perPage,
        loading,
        onPageChange,
        onPerPageChange,
    } = props;

    return (
        <div className="space-y-4">
            <FulfillmentToolbar
                searchValue={props.searchValue}
                onSearchChange={props.onSearchChange}
                onSearchSubmit={props.onSearchSubmit}
                dateRange={props.dateRange}
                onDateRangeChange={props.onDateRangeChange}
            />

            {/* Mobile View */}
            <div className="block md:hidden">
                <FulfillmentCards
                    data={sales}
                    loading={loading}
                    pagination={{
                        page,
                        perPage,
                        total,
                        onPageChange: onPageChange || (() => { }),
                        onPerPageChange: onPerPageChange || (() => { }),
                    }}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <CustomTable
                    data={sales}
                    columns={columns}
                    loading={loading}
                    pagination={{
                        page,
                        perPage,
                        total,
                        onPageChange: onPageChange || (() => { }),
                        onPerPageChange: onPerPageChange || (() => { }),
                    }}
                    toolbar={<></>}
                />
            </div>
        </div>
    );
}
