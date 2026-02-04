import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { FulfillmentTableProps } from "../_types/types";

type FulfillmentToolbarProps = Pick<
    FulfillmentTableProps,
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
>;

export function FulfillmentToolbar({
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
}: FulfillmentToolbarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาตามเลขที่ใบขาย, ชื่อลูกค้า..."
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearchSubmit?.();
                        }
                    }}
                    className="pl-9 bg-white"
                />
            </div>

            <div className="w-xl">
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
    );
}
