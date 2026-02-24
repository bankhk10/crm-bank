"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Eye, Edit, Trash2, CheckCircle } from "lucide-react";

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

import type { TemporaryCreditLimitTableProps } from "../../types";
import { TemporaryCreditLimitStatusBadge } from "../../ui/temporary-credit-limit-status-badge";

type Props = Pick<
    TemporaryCreditLimitTableProps,
    | "data"
    | "loading"
    | "canApprove"
    | "canEdit"
    | "canDelete"
    | "onDelete"
    | "pagination"
>;

export function TemporaryCreditLimitCards({
    data,
    loading,
    canApprove,
    canEdit,
    canDelete,
    onDelete,
    pagination,
}: Props) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <Card
                        key={`loading-${idx}`}
                        className="h-full border border-slate-200/80 shadow-sm"
                    >
                        <div className="h-1 w-full bg-slate-100" />
                        <div className="space-y-3 p-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-full" />
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
                    ลองปรับการค้นหาหรือสร้างคำขอใหม่
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
    } = pagination || {
        page: 1,
        perPage: 10,
        total: 0,
        onPageChange: () => { },
        onPerPageChange: () => { },
        perPageOptions: [10, 20, 50],
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startDisplay = (page - 1) * perPage + 1;
    const endDisplay = Math.min((page - 1) * perPage + data.length, total);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((item) => {
                    const isPending = item.status === "PENDING";
                    const isApproved = item.status === "APPROVED";
                    const amount = new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                    }).format(Number(item.requestedAmount));

                    return (
                        <Card
                            key={item.id}
                            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div
                                className={cn(
                                    "absolute inset-x-0 top-0 h-1",
                                    isPending
                                        ? "bg-yellow-400"
                                        : isApproved
                                            ? "bg-emerald-500"
                                            : "bg-red-500"
                                )}
                            />
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col">
                                        <div className="text-base font-semibold text-slate-900">
                                            {item.customer?.name || "-"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {item.customer?.customerCode || "-"}
                                        </div>
                                    </div>
                                    <TemporaryCreditLimitStatusBadge status={item.status} />
                                </div>

                                <div className="flex items-baseline justify-between py-1">
                                    <span className="text-sm text-slate-600">จำนวนเงิน</span>
                                    <span className="text-lg font-bold text-slate-800">
                                        {amount}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-slate-600">
                                    <div className="flex justify-between">
                                        <span>วันหมดอายุ:</span>
                                        <span className="font-medium">
                                            {item.expiryDate
                                                ? format(new Date(item.expiryDate), "dd MMM yyyy", {
                                                    locale: th,
                                                })
                                                : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>ผู้ขอ:</span>
                                        <span>{item.requestedBy?.name || "-"}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-100 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Link href={`/temporary-credit-limits/${item.id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                                        </Link>
                                    </Button>

                                    {canApprove && isPending && (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Link
                                                href={`/temporary-credit-limits/${item.id}/approve`}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> อนุมัติ
                                            </Link>
                                        </Button>
                                    )}

                                    {canEdit && !isApproved && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-purple-100 text-purple-700 hover:bg-purple-50"
                                        >
                                            <Link href={`/temporary-credit-limits/${item.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                            </Link>
                                        </Button>
                                    )}
                                    {canDelete && !isApproved && onDelete && (
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
