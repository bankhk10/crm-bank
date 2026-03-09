"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { FulfillmentCards } from "./fulfillment-cards";
import { useFulfillmentColumns } from "./use-fulfillment-columns";
import type { FulfillmentTableProps } from "../../types/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function FulfillmentTable(props: FulfillmentTableProps) {
    const columns = useFulfillmentColumns();
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

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
    } = props;

    const toolbar = (
        <TableToolbar
            searchPlaceholder="ค้นหาตามเลขที่ใบขาย, ชื่อลูกค้า..."
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            filters={
                <div className="space-y-2 w-full sm:w-80">
                    <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mx-1">
                        ช่วงวันที่
                    </label>
                    <div className="mt-1">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-white h-11",
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
                </div>
            }
        />
    );

    return (
        <ResponsiveDataView
            breakpoint="md"
            toolbar={toolbar}
            cards={
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
            }
            table={
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
            }
        />
    );
}
