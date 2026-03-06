"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    BadgeDollarSign,
    Calendar as CalendarIcon,
    PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    } = props;

    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

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
        perPageOptions: [10, 20, 30, 50],
    };

    const toolbar = (
        <TableToolbar
            searchPlaceholder="เลขที่ใบขาย, ชื่อลูกค้า"
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            filters={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Date Range Picker */}
                    <div className="space-y-2">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-white h-10",
                                        !dateRange && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd/MM/yyyy", { locale: th })} -{" "}
                                                {format(dateRange.to, "dd/MM/yyyy", { locale: th })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd/MM/yyyy", { locale: th })
                                        )
                                    ) : (
                                        <span>เลือกช่วงวันที่</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={onDateRangeChange}
                                    numberOfMonths={2}
                                />
                                <div className="p-3 border-t border-border flex items-center justify-center gap-2 bg-slate-50/50">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => {
                                            if (onDateRangeChange) onDateRangeChange(undefined);
                                        }}
                                    >
                                        ล้าง
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8"
                                        onClick={() => setIsCalendarOpen(false)}
                                    >
                                        ตกลง
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Select
                            value={statusFilter || "ALL"}
                            onValueChange={(value) =>
                                onStatusFilterChange?.(
                                    value === "ALL" ? undefined : (value as SaleStatus),
                                )
                            }
                        >
                            <SelectTrigger className="w-full bg-white h-10">
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
            }
            actions={
                <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                    {canCreate && (
                        <Link href="/sales/new" className="w-full lg:w-auto">
                            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                <span className="inline-flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้างรายการขาย
                                </span>
                            </Button>
                        </Link>
                    )}
                </div>
            }
        />
    );

    return (
        <div className="bg-white shadow-sm sm:rounded-lg rounded-lg">
            <div className="p-6">
                <PageHeader
                    icon={BadgeDollarSign}
                    iconClassName="text-blue-600"
                    title="ข้อมูลการขาย"
                />

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
        </div>
    );
}
