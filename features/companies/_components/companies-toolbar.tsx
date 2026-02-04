import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, PlusCircle, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { CompaniesTableProps } from "../_types/types";

type CompaniesToolbarProps = Pick<
    CompaniesTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
>;

export function CompaniesToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
}: CompaniesToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาชื่อบริษัท, รหัส, หรือ Tax ID..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearchSubmit?.();
                        }
                    }}
                    className="pl-9 bg-white"
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal w-full sm:w-[240px] bg-white",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd MMM", { locale: th })} -{" "}
                                            {format(dateRange.to, "dd MMM yyyy", { locale: th })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd MMM yyyy", { locale: th })
                                    )
                                ) : (
                                    <span>เลือกช่วงวันที่</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={onDateRangeChange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    {dateRange && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDateRangeChange(undefined)}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {canCreate && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/companies/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            เพิ่มบริษัท
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
