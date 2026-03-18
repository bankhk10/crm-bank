"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
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

    const [isStartOpen, setIsStartOpen] = React.useState(false);
    const [isEndOpen, setIsEndOpen] = React.useState(false);

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
                        <div className="space-y-2 w-full lg:flex-1">
                            <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                                ค้นหา
                            </label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="เลขที่ใบขาย, ชื่อลูกค้า..."
                                    value={searchValue ?? ""}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSearchSubmit?.();
                                    }}
                                    className="pl-9 h-11 w-full bg-white text-base"
                                />
                            </div>
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

                            <div className="space-y-2 w-full sm:w-44">
                                <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                                    วันที่เริ่ม
                                </label>
                                <div className="mt-1">
                                    <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-between text-left font-normal bg-white h-11 px-3 pr-10 relative",
                                                    !dateRange?.from && "text-muted-foreground",
                                                )}
                                            >
                                                {dateRange?.from ? (
                                                    <span className="text-base">
                                                        {format(dateRange.from, "dd/MM")}/
                                                        {dateRange.from.getFullYear() + 543}
                                                    </span>
                                                ) : (
                                                    <span className="text-base">วันที่เริ่ม</span>
                                                )}
                                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="single"
                                                selected={dateRange?.from}
                                                onSelect={(day) => {
                                                    if (day) {
                                                        const newRange = { from: day, to: dateRange?.to };
                                                        if (dateRange?.to && day > dateRange.to) {
                                                            newRange.to = day;
                                                        }
                                                        onDateRangeChange?.(newRange);
                                                    } else {
                                                        onDateRangeChange?.({ from: undefined, to: dateRange?.to });
                                                    }
                                                }}
                                                numberOfMonths={1}
                                            />
                                            <div className="p-3 border-t flex items-center justify-center gap-2 bg-slate-50/50">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-20"
                                                    onClick={() => setIsStartOpen(false)}
                                                >
                                                    ยกเลิก
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 w-20 bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => setIsStartOpen(false)}
                                                >
                                                    ตกลง
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2 w-full sm:w-44">
                                <label className="mx-1 mb-1 font-medium text-base text-gray-900">
                                    วันที่สิ้นสุด
                                </label>
                                <div className="mt-1">
                                    <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-between text-left font-normal bg-white h-11 px-3 pr-10 relative",
                                                    !dateRange?.to && "text-muted-foreground",
                                                )}
                                            >
                                                {dateRange?.to ? (
                                                    <span className="text-base">
                                                        {format(dateRange.to, "dd/MM")}/
                                                        {dateRange.to.getFullYear() + 543}
                                                    </span>
                                                ) : (
                                                    <span className="text-base">วันที่สิ้นสุด</span>
                                                )}
                                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="single"
                                                selected={dateRange?.to}
                                                defaultMonth={dateRange?.to || dateRange?.from}
                                                onSelect={(day) => {
                                                    if (day) {
                                                        const newRange = { from: dateRange?.from, to: day };
                                                        if (dateRange?.from && day < dateRange.from) {
                                                            newRange.from = day;
                                                        } else if (!dateRange?.from) {
                                                            newRange.from = day;
                                                        }
                                                        onDateRangeChange?.(newRange);
                                                    } else {
                                                        onDateRangeChange?.({ from: dateRange?.from, to: undefined });
                                                    }
                                                }}
                                                numberOfMonths={1}
                                            />
                                            <div className="p-3 border-t flex items-center justify-center gap-2 bg-slate-50/50">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-20"
                                                    onClick={() => setIsEndOpen(false)}
                                                >
                                                    ยกเลิก
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 w-20 bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => setIsEndOpen(false)}
                                                >
                                                    ตกลง
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <ClearSearchButton onClick={() => {
                                    onSearchChange?.("");
                                    onStatusFilterChange?.(undefined);
                                    onDateRangeChange?.(undefined);
                                }} />
                            </div>
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
