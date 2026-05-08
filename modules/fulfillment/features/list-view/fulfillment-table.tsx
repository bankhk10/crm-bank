"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/custom/DatePicker";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { FulfillmentCards } from "./fulfillment-cards";
import { useFulfillmentColumns } from "./use-fulfillment-columns";
import type { FulfillmentTableProps } from "../../types/types";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { STATUS_STYLE } from "../../constants";

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
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        onClear,
        statusFilter,
        onStatusFilterChange,
    } = props;

    const FULFILLMENT_STATUS_OPTIONS = [
        { value: "ALL", label: "ทั้งหมด" },
        { value: "PENDING", label: STATUS_STYLE.PENDING.label },
        { value: "APPROVED", label: STATUS_STYLE.APPROVED.label },
        { value: "REJECTED", label: STATUS_STYLE.REJECTED.label },
        { value: "AWAITING_PAYMENT", label: STATUS_STYLE.AWAITING_PAYMENT.label },
        { value: "PAID", label: STATUS_STYLE.PAID.label },
        { value: "AWAITING_DELIVERY", label: STATUS_STYLE.AWAITING_DELIVERY.label },
        { value: "PARTIALLY_DELIVERED", label: STATUS_STYLE.PARTIALLY_DELIVERED.label },
        { value: "DELIVERED", label: STATUS_STYLE.DELIVERED.label },
        { value: "DELIVERY_COMPLETED", label: STATUS_STYLE.DELIVERY_COMPLETED.label },
        { value: "EXPIRED", label: STATUS_STYLE.EXPIRED.label },
        { value: "OVERDUE", label: STATUS_STYLE.OVERDUE.label },
        { value: "WAITING_FOR_CORRECTION", label: STATUS_STYLE.WAITING_FOR_CORRECTION.label },
        { value: "CANCELLED", label: STATUS_STYLE.CANCELLED.label },
        { value: "COMPLETED", label: STATUS_STYLE.COMPLETED.label },
    ];

    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                showSearch={false}
                actionPosition="bottom"
                className="p-3 sm:p-4"
                filters={
                    <div className="flex flex-col lg:flex-row gap-4 items-end w-full">
                        <div className="space-y-2 w-full lg:w-[400px]">
                            <label className="mx-1 mb-1 font-medium text-base text-gray-900 block">
                                ค้นหา
                            </label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="ค้นหาตามเลขที่ใบขาย, ชื่อลูกค้า..."
                                    value={searchValue ?? ""}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSearchSubmit?.();
                                    }}
                                    className="pl-9 h-11 w-full bg-white text-base border-gray-300 focus:ring-2"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 w-full lg:w-[200px]">
                            <label className="mx-1 mb-1 font-medium text-base text-gray-900 block">
                                สถานะ
                            </label>
                            <Select
                                value={statusFilter ?? "ALL"}
                                onValueChange={(val) => onStatusFilterChange?.(val)}
                            >
                                <SelectTrigger className="h-11 w-full bg-white text-base border-gray-300">
                                    <SelectValue placeholder="เลือกสถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FULFILLMENT_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
                            <div className="w-full sm:w-44">
                                <DatePicker
                                    label="วันที่เริ่ม"
                                    placeholder="วันที่เริ่ม"
                                    value={dateRange?.from}
                                    onChange={(val) => {
                                        if (val) {
                                            const day = parseISO(val);
                                            const newRange = { from: day, to: dateRange?.to };
                                            if (dateRange?.to && day > dateRange.to) {
                                                newRange.to = day;
                                            }
                                            onDateRangeChange?.(newRange);
                                        } else {
                                            onDateRangeChange?.({ from: undefined, to: dateRange?.to });
                                        }
                                    }}
                                />
                            </div>
                            <div className="w-full sm:w-44">
                                <DatePicker
                                    label="วันที่สิ้นสุด"
                                    placeholder="วันที่สิ้นสุด"
                                    value={dateRange?.to}
                                    onChange={(val) => {
                                        if (val) {
                                            const day = parseISO(val);
                                            const newRange = { from: dateRange?.from, to: day };
                                            if (dateRange?.from && day < dateRange.from) {
                                                newRange.from = day;
                                            }
                                            onDateRangeChange?.(newRange);
                                        } else {
                                            onDateRangeChange?.({ from: dateRange?.from, to: undefined });
                                        }
                                    }}
                                />
                            </div>
                            {(searchValue || dateRange?.from || dateRange?.to || (statusFilter && statusFilter !== "APPROVED")) && (
                                <div className="flex items-end">
                                    <ClearSearchButton onClick={onClear || (() => { })} />
                                </div>
                            )}
                        </div>
                    </div>
                }
            />
        </div>
    );

    const pagination = {
        page,
        perPage,
        total,
        onPageChange: onPageChange || (() => { }),
        onPerPageChange: onPerPageChange || (() => { }),
        perPageOptions: [10, 20, 30],
    };

    return (
        <ResponsiveDataView
            breakpoint="md"
            toolbar={toolbar}
            cards={
                <FulfillmentCards
                    data={sales}
                    loading={loading}
                    pagination={pagination}
                />
            }
            table={
                <CustomTable
                    data={sales}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                />
            }
        />
    );
}
