"use client";

import * as React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import DatePicker from "@/components/custom/DatePicker";
import {
    BadgeDollarSign,
    Calendar as CalendarIcon,
    PlusCircle,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { SaleStatusLabels, type SaleStatus } from "@/modules/sales/types";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { PageHeader } from "@/components/custom/page-header";
import { useSaleColumns } from "./use-sale-columns";
import { SalesCards } from "./sales-cards";
import type { SalesTableProps } from "../../types";

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
        customerId,
        onCustomerIdChange,
        customers = [],
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

    const pagination = {
        page,
        perPage,
        total,
        onPageChange: onPageChange || (() => { }),
        onPerPageChange: onPerPageChange || (() => { }),
        perPageOptions: [10, 20, 30],
    };

    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                showSearch={false}
                actionPosition="bottom"
                className="p-3 sm:p-4"
                filters={
                    <div className="flex flex-col lg:flex-row gap-4 items-end w-full">
                        <div className="space-y-2 w-full lg:w-[280px]">
                            <label className="mx-1 mb-1 font-medium text-base text-gray-900 block"> {/* เพิ่ม block เพื่อให้ label คุมบรรทัด */}
                                ค้นหา
                            </label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="เลขที่ใบขาย, ชื่อสินค้า..."
                                    value={searchValue ?? ""}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSearchSubmit?.();
                                    }}
                                    className="pl-9 h-11 w-full bg-white text-base border-gray-300 focus:ring-2"
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-[280px]">
                            <FormCombobox
                                label="ลูกค้า"
                                value={customerId || ""}
                                onChange={(val) => onCustomerIdChange?.(val)}
                                options={customers.map((customer) => ({
                                    value: customer.id,
                                    label: `${customer.name}`,
                                }))}
                                placeholder="ลูกค้าทั้งหมด"
                                searchPlaceholder="ค้นหาลูกค้า..."
                                emptyText="ไม่พบลูกค้า"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto items-end">
                            <div className="space-y-2 w-full lg:w-48">
                                <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                                    สถานะ
                                </label>
                                <div className="mt-1">
                                    <Select
                                        value={statusFilter || "ALL"}
                                        onValueChange={(value) =>
                                            onStatusFilterChange?.(
                                                value === "ALL" ? undefined : (value as SaleStatus),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full bg-white h-11 text-base">
                                            <SelectValue placeholder="ทุกสถานะ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                                            {Object.entries(SaleStatusLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
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
                            {(searchValue || statusFilter || dateRange?.from || dateRange?.to || customerId) && (
                                <div className="flex items-end">
                                    <ClearSearchButton onClick={() => {
                                        onSearchChange?.("");
                                        onStatusFilterChange?.(undefined);
                                        onDateRangeChange?.(undefined);
                                        onCustomerIdChange?.("");
                                    }} />
                                </div>
                            )}
                        </div>
                    </div>
                }
            />
            <div className="flex justify-end">
                {canCreate && (
                    <Link href="/sales/new" className="w-full sm:w-auto">
                        <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            <PlusCircle className="h-5 w-5" />
                            สร้างรายการขาย
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <ResponsiveDataView
                breakpoint="xl"
                toolbar={toolbar}
                cards={
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
                }
                table={
                    <CustomTable
                        columns={columns}
                        data={sales}
                        loading={loading}
                        pagination={pagination}
                        toolbar={<></>}
                        emptyState={{
                            title: "ยังไม่มีรายการขาย",
                            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างรายการขายใหม่",
                        }}
                        className="w-full"
                    />
                }
            />
        </div>
    );
}
