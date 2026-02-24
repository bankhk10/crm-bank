"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    BadgeDollarSign,
    Calendar as CalendarIcon,
    Search,
    PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SaleStatusLabels, type SaleStatus } from "@/types/sales";
import CustomTable from "@/components/custom/custom-table";
import { useSaleColumns } from "./use-sale-columns";
import { SalesCards } from "./sales-cards";
import type { SalesTableProps } from "../../types";

// ─────────────────────────────────────────────
// Toolbar (inline – used only here)
// ─────────────────────────────────────────────

type SalesToolbarProps = Pick<
    SalesTableProps,
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "statusFilter"
    | "onStatusFilterChange"
    | "dateRange"
    | "onDateRangeChange"
    | "canCreate"
>;

function SalesToolbar({
    searchValue,
    onSearchChange,
    onSearchSubmit,
    statusFilter,
    onStatusFilterChange,
    dateRange,
    onDateRangeChange,
    canCreate,
}: SalesToolbarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    return (
        <div className="rounded-md border bg-background/60 p-4 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Search */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ค้นหา</label>
                    <div className="relative mt-1">
                        <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchValue ?? ""}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
                            placeholder="เลขที่ใบขาย, ชื่อลูกค้า"
                            className="pl-9 w-full bg-white"
                        />
                    </div>
                </div>

                {/* Date Range Picker */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ช่วงวันที่</label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-white mt-1 h-11",
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
                                        onDateRangeChange?.(undefined);
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
                    <label className="text-base font-medium mx-2">สถานะ</label>
                    <Select
                        value={statusFilter || "ALL"}
                        onValueChange={(value) =>
                            onStatusFilterChange?.(
                                value === "ALL" ? undefined : (value as SaleStatus),
                            )
                        }
                    >
                        <SelectTrigger className="w-full bg-white mt-1 h-11">
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

            {/* Create Button */}
            <div className="grid gap-4 lg:items-end mt-4">
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
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Table Component
// ─────────────────────────────────────────────

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
