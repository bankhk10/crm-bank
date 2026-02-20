"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    Calendar as CalendarIcon,
    BadgeDollarSign,
    Mail,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { SalesTableProps, SaleRecord } from "../../_types/types";
import { SaleStatusBadge } from "..";

type SalesCardsProps = Pick<
    SalesTableProps,
    | "loading"
    | "canApprove"
    | "canEdit"
    | "canDelete"
    | "onDelete"
    | "currentUserId"
    | "canEditItem"
    | "canDeleteItem"
> & {
    data: SaleRecord[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        onPageChange: (p: number) => void;
        onPerPageChange: (n: number) => void;
        perPageOptions?: number[];
    };
};

export function SalesCards({
    data,
    loading,
    canApprove,
    canEdit,
    canDelete,
    onDelete,
    currentUserId,
    pagination,
    canEditItem,
    canDeleteItem,
}: SalesCardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <Card
                        key={`loading-${idx}`}
                        className="h-full border border-slate-200/80 shadow-sm"
                    >
                        <div className="h-1 w-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
                        <div className="space-y-3 p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                <div className="mb-2 text-base font-semibold text-slate-900">
                    ไม่พบข้อมูล
                </div>
                <p className="text-sm text-slate-600">
                    ลองปรับการค้นหาหรือสร้างรายการขายใหม่
                </p>
            </Card>
        );
    }

    const {
        page,
        perPage,
        total,
        onPageChange,
        onPerPageChange,
        perPageOptions,
    } = pagination;

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startDisplay = (page - 1) * perPage + 1;
    const endDisplay = Math.min((page - 1) * perPage + data.length, total);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((item) => {
                    const isPending = item.status === "PENDING";
                    const isPendingApproval = item.status === "PENDING_APPROVAL";
                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";
                    // const isWaitingForCorrection = item.status === "WAITING_FOR_CORRECTION"; // Not used in color calc but might be useful?
                    const isCreator = currentUserId && item.createdById === currentUserId;

                    const canEditThis = canEditItem
                        ? canEditItem(item) &&
                        (isPending ||
                            isPendingApproval ||
                            isRejected ||
                            item.status === "WAITING_FOR_CORRECTION")
                        : (canEdit || isCreator) &&
                        (isPending ||
                            isPendingApproval ||
                            isRejected ||
                            item.status === "WAITING_FOR_CORRECTION");

                    // Use canDeleteItem callback if provided, otherwise fallback to simple logic
                    const canDeleteThis = canDeleteItem
                        ? canDeleteItem(item) && (isPending || isPendingApproval)
                        : (canDelete || isCreator) && (isPending || isPendingApproval);

                    const amount = new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                    }).format(Number(item.totalAmount));

                    return (
                        <Card
                            key={item.id}
                            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div
                                className={cn(
                                    "absolute inset-x-0 top-0 h-1",
                                    isPending
                                        ? "bg-amber-400"
                                        : isPendingApproval
                                            ? "bg-yellow-400"
                                            : isApproved
                                                ? "bg-emerald-500"
                                                : isRejected
                                                    ? "bg-red-500"
                                                    : "bg-gray-400",
                                )}
                            />
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                            <BadgeDollarSign className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div
                                                className="text-base font-semibold text-slate-900 truncate"
                                                title={item.customer?.name}
                                            >
                                                {item.customer?.name || "-"}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                                {item.saleNumber || "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <SaleStatusBadge status={item.status} />
                                </div>

                                <div className="flex items-baseline justify-between py-1 border-t border-dashed pt-2">
                                    <div className="text-xs text-slate-500">ยอดรวมสุทธิ</div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {amount}
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-2">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <CalendarIcon className="h-3.5 w-3.5" /> วันที่
                                        </span>
                                        <span className="font-medium">
                                            {item.saleDate
                                                ? format(new Date(item.saleDate), "dd MMM yyyy", {
                                                    locale: th,
                                                })
                                                : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <Mail className="h-3.5 w-3.5" /> พนักงาน
                                        </span>
                                        <span className="truncate max-w-[150px]">
                                            {item.employee?.name || "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 mt-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-100 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Link href={`/sales/${item.id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> ดู
                                        </Link>
                                    </Button>

                                    {canEditThis && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-purple-100 text-purple-700 hover:bg-purple-50"
                                        >
                                            <Link href={`/sales/${item.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                            </Link>
                                        </Button>
                                    )}
                                    {canApprove && (isPending || isPendingApproval) && (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Link href={`/sales/${item.id}/approve`}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> อนุมัติ
                                            </Link>
                                        </Button>
                                    )}
                                    {canDeleteThis && onDelete && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="bg-red-50 text-red-700 hover:bg-red-100"
                                            onClick={() => onDelete(item)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> ลบ
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination (Mobile) */}
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium text-slate-600">
                    แสดง {startDisplay}-{endDisplay} จาก {total}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    {perPageOptions && perPageOptions.length > 0 && (
                        <Select
                            value={String(perPage)}
                            onValueChange={(v) => onPerPageChange(Number(v))}
                        >
                            <SelectTrigger className="h-9 w-[70px] text-sm">
                                <SelectValue placeholder="ต่อหน้า" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {perPageOptions.map((opt) => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="inline-flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-700"
                            disabled={page <= 1}
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                        >
                            ก่อนหน้า
                        </Button>
                        <span className="text-xs text-slate-500">
                            หน้า {page} / {totalPages}
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-700"
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        >
                            ถัดไป
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
