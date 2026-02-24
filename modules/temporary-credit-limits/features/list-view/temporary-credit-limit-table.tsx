"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import CustomTable from "@/components/custom/custom-table";
import type { TemporaryCreditLimitTableProps } from "../../types";
import { useTemporaryCreditLimitColumns } from "./use-temporary-credit-limit-columns";
import { TemporaryCreditLimitCards } from "./temporary-credit-limit-cards";

export function TemporaryCreditLimitTable(
    props: TemporaryCreditLimitTableProps
) {
    const {
        data,
        loading,
        pagination,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        dateRange,
        onDateRangeChange,
        canCreate,
        canEdit = false,
        canDelete = false,
        canApprove = false,
        onDelete,
    } = props;

    const columns = useTemporaryCreditLimitColumns(
        canEdit,
        canDelete,
        canApprove,
        onDelete
    );

    const toolbarNode = (
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
                            placeholder="รหัสลูกค้า, ชื่อลูกค้า"
                            className="pl-9 w-full bg-white"
                        />
                    </div>
                </div>

                {/* Date Range Picker */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ช่วงวันที่</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-white mt-1 h-11",
                                    !dateRange && "text-muted-foreground"
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
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Create Button */}
            <div className="grid gap-4 lg:items-end mt-4">
                <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                    {canCreate ? (
                        <Link href="/temporary-credit-limits/new">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <span className="inline-flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้างคำขอใหม่
                                </span>
                            </Button>
                        </Link>
                    ) : (
                        <Button className="w-full lg:w-auto" variant="outline" disabled>
                            <span className="inline-flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                สร้างคำขอใหม่
                            </span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Mobile & Tablet: card layout */}
            <div className="xl:hidden space-y-4">
                {toolbarNode}
                <TemporaryCreditLimitCards
                    data={data}
                    loading={loading}
                    canApprove={canApprove}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={onDelete}
                    pagination={pagination}
                />
            </div>

            {/* Desktop & up: table layout */}
            <div className="hidden xl:block">
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={toolbarNode}
                    emptyState={{
                        title: "ไม่พบข้อมูลรายการคำขอ",
                        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างคำขอใหม่",
                    }}
                    className="w-full"
                />
            </div>
        </div>
    );
}
