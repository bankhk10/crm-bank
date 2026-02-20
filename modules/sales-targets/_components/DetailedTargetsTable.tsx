"use client";

import Link from "next/link";
import {
    Calendar,
    Eye,
    Pencil,
    PlusCircle,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { formatCurrency } from "@/src/shared/utils/currency.utils";
import { MONTHS } from "@/modules/sales-targets/_lib/constants";
import { DetailedTarget } from "@/src/core/sales-targets/sales-target.types";

interface DetailedTargetsTableProps {
    targets: DetailedTarget[];
    paginatedTargets: DetailedTarget[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (target: DetailedTarget) => void;
    onDelete: (id: string) => void;
}

export function DetailedTargetsTable({
    targets,
    paginatedTargets,
    currentPage,
    totalPages,
    onPageChange,
    onView,
    onDelete,
}: DetailedTargetsTableProps) {
    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(1);
                        }}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>,
            );
            if (startPage > 2) {
                items.push(
                    <PaginationItem key="ellipsis-1">
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }
        }

        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <PaginationItem key={page}>
                    <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(page);
                        }}
                    >
                        {page}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(
                    <PaginationItem key="ellipsis-2">
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onPageChange(totalPages);
                        }}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(2,6,23,0.25)]">
            <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-white/40 to-slate-50/40">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="grid place-items-center size-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 ring-1 ring-blue-500/15">
                            <Calendar className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="leading-tight">
                            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                                รายการเป้าหมายรายเดือน
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-slate-500">
                                สรุปเป้าหมายรายเดือนแยกตามพนักงานและร้านค้า
                            </p>
                        </div>
                    </div>

                    <Link href="/sales-targets/create" className="shrink-0">
                        <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-2 focus-visible:ring-blue-500/40">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            เพิ่มเป้าหมาย
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* ===== Mobile ===== */}
                <div className="sm:hidden">
                    {targets.length === 0 ? (
                        <div className="py-14 text-center">
                            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-slate-100">
                                <Calendar className="h-5 w-5 text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                                ยังไม่มีข้อมูลเป้าหมาย
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                กด “เพิ่มเป้าหมาย” เพื่อเริ่มต้น
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200/60">
                            {paginatedTargets.map((target) => {
                                const totalQty =
                                    target.items?.reduce(
                                        (s: number, i: any) => s + i.quantity,
                                        0,
                                    ) ?? 0;
                                const totalAmount =
                                    target.items?.reduce(
                                        (s: number, i: any) => s + Number(i.amount),
                                        0,
                                    ) ?? 0;

                                return (
                                    <div key={target.id} className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500">เดือน</p>
                                                <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                                                    {
                                                        MONTHS.find((m) => m.value === target.month)
                                                            ?.label
                                                    }
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                                        👤 {target.employee?.name}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                                        🏪 {target.customer?.name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl hover:bg-slate-100"
                                                    onClick={() => onView(target)}
                                                    aria-label="ดูรายละเอียด"
                                                >
                                                    <Eye className="h-4 w-4 text-slate-600" />
                                                </Button>

                                                <Link href={`/sales-targets/${target.id}/edit`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl hover:bg-blue-50"
                                                        aria-label="แก้ไข"
                                                    >
                                                        <Pencil className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                </Link>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                    onClick={() => onDelete(target.id)}
                                                    aria-label="ลบ"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="text-slate-500">จำนวนสินค้า</div>
                                                <div className="text-right font-semibold text-slate-900">
                                                    {totalQty}
                                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                                        รายการ
                                                    </span>
                                                </div>

                                                <div className="text-slate-500">ยอดรวม</div>
                                                <div className="text-right font-semibold text-emerald-700">
                                                    {formatCurrency(totalAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== Desktop ===== */}
                <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[760px]">
                            <TableHeader>
                                <TableRow className="bg-slate-50/60">
                                    <TableHead className="text-base font-semibold  pl-6">
                                        เดือน
                                    </TableHead>
                                    <TableHead className="text-base font-semibold ">
                                        พนักงาน
                                    </TableHead>
                                    <TableHead className="text-base font-semibold">
                                        ร้านค้า
                                    </TableHead>
                                    <TableHead className="text-right text-base font-semibold">
                                        จำนวนสินค้า
                                    </TableHead>
                                    <TableHead className="text-right text-base font-semibold">
                                        ยอดรวม (บาท)
                                    </TableHead>
                                    <TableHead className="w-[132px] text-base font-semibold text-center">
                                        จัดการ
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {targets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center">
                                            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-slate-100">
                                                <Calendar className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900">
                                                ยังไม่มีข้อมูลเป้าหมาย
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                กด “เพิ่มเป้าหมาย” เพื่อเริ่มต้น
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedTargets.map((target) => {
                                        const totalQty =
                                            target.items?.reduce(
                                                (s: number, i: any) => s + i.quantity,
                                                0,
                                            ) ?? 0;
                                        const totalAmount =
                                            target.items?.reduce(
                                                (s: number, i: any) => s + Number(i.amount),
                                                0,
                                            ) ?? 0;

                                        return (
                                            <TableRow
                                                key={target.id}
                                                className="transition-colors hover:bg-slate-50/70"
                                            >
                                                <TableCell className="font-medium text-slate-900 pl-6">
                                                    {
                                                        MONTHS.find((m) => m.value === target.month)
                                                            ?.label
                                                    }
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">
                                                                {target.employee?.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {target.employee?.employeeCode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">
                                                            {target.customer?.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {target.customer?.customerCode}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                                                        {totalQty} รายการ
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-right font-semibold text-emerald-700">
                                                    {formatCurrency(totalAmount)}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl hover:bg-slate-100"
                                                            onClick={() => onView(target)}
                                                            aria-label="ดูรายละเอียด"
                                                        >
                                                            <Eye className="h-4 w-4 text-slate-600" />
                                                        </Button>

                                                        <Link href={`/sales-targets/${target.id}/edit`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="rounded-xl hover:bg-blue-50"
                                                                aria-label="แก้ไข"
                                                            >
                                                                <Pencil className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                            onClick={() => onDelete(target.id)}
                                                            aria-label="ลบ"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {/* Pagination Controls */}
                {targets.length > 0 && totalPages > 1 && (
                    <div className="border-t border-slate-200/60 px-4 py-4 sm:px-6">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) onPageChange(currentPage - 1);
                                        }}
                                        className={
                                            currentPage === 1
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>

                                {renderPaginationItems()}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < totalPages)
                                                onPageChange(currentPage + 1);
                                        }}
                                        className={
                                            currentPage === totalPages
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
