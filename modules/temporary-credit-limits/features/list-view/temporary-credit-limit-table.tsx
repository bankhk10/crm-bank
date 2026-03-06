"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
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

    const toolbar = (
        <TableToolbar
            searchPlaceholder="รหัสลูกค้า, ชื่อลูกค้า..."
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            filters={
                <div className="w-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-white h-10",
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
            }
            actions={
                <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 items-center justify-end w-full">
                    {canCreate ? (
                        <Link href="/temporary-credit-limits/new" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10">
                                <span className="inline-flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้างคำขอใหม่
                                </span>
                            </Button>
                        </Link>
                    ) : (
                        <div className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-10" variant="outline" disabled>
                                <span className="inline-flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้างคำขอใหม่
                                </span>
                            </Button>
                        </div>
                    )}
                </div>
            }
        />
    );

    return (
        <ResponsiveDataView
            breakpoint="xl"
            toolbar={toolbar}
            cards={
                <TemporaryCreditLimitCards
                    data={data}
                    loading={loading}
                    canApprove={canApprove}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={onDelete}
                    pagination={pagination}
                />
            }
            table={
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                    emptyState={{
                        title: "ไม่พบข้อมูลรายการคำขอ",
                        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างคำขอใหม่",
                    }}
                    className="w-full"
                />
            }
        />
    );
}
