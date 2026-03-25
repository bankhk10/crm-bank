"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { FulfillmentCards } from "./fulfillment-cards";
import { useFulfillmentColumns } from "./use-fulfillment-columns";
import type { FulfillmentTableProps } from "../../types/types";
import { ClearSearchButton } from "@/components/custom/ClearSearchButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function FulfillmentTable(props: FulfillmentTableProps) {
    const columns = useFulfillmentColumns();
    const [isStartOpen, setIsStartOpen] = React.useState(false);
    const [isEndOpen, setIsEndOpen] = React.useState(false);

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
    } = props;

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
                                    placeholder="ค้นหาตามเลขที่ใบขาย, ชื่อลูกค้า..."
                                    value={searchValue ?? ""}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSearchSubmit?.();
                                    }}
                                    className="pl-9 h-11 w-full bg-white text-base"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
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
                                <ClearSearchButton onClick={onClear || (() => { })} />
                            </div>
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
