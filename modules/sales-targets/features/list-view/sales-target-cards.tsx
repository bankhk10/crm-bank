import React from "react";
import Link from "next/link";
import {
    Eye,
    Copy,
    Pencil,
    Trash2,
    Calendar,
    Store,
    UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency-utils";
import { MONTHS } from "../../constants";
import { DetailedTarget } from "../../types";

interface SalesTargetCardsProps {
    data: DetailedTarget[];
    loading: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canView: boolean;
    onView: (target: DetailedTarget) => void;
    onCopy: (target: DetailedTarget) => void;
    onDelete: (id: string) => void;
    pagination: any;
}

export function SalesTargetCards({
    data,
    loading,
    canDelete,
    canEdit,
    canView,
    onView,
    onCopy,
    onDelete,
    pagination,
}: SalesTargetCardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <Card
                        key={`loading-${idx}`}
                        className="h-full border border-slate-200/80 shadow-sm p-4 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                <div className="mb-2 text-base font-semibold text-slate-900">
                    ไม่พบข้อมูลเป้าหมาย
                </div>
                <p className="text-sm text-slate-600">
                    ลองปรับตัวกรองหรือเพิ่มเป้าหมายใหม่
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
    const endDisplay = Math.min((page - 1) * perPage + perPage, total);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.map((target) => {
                    const monthLabel =
                        MONTHS.find((m) => m.value === target.month)?.label ?? "-";
                    const storeCount = target.stores?.length ?? 0;
                    const storeNames = target.stores
                        ?.map((s) => s.customer?.name)
                        .filter(Boolean)
                        .join(", ") || "-";
                    const totalAmount =
                        target.stores?.reduce(
                            (storeSum, store) =>
                                storeSum +
                                (store.items?.reduce(
                                    (itemSum, item) =>
                                        itemSum + Number(item.targetAmount),
                                    0,
                                ) ?? 0),
                            0,
                        ) ?? 0;

                    return (
                        <Card
                            key={target.id}
                            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
                            <div className="p-4 space-y-3">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                            <Calendar className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <div className="text-base font-semibold text-slate-900 line-clamp-1">
                                                {monthLabel} {target.year + 543}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                เป้าหมายรายเดือน
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm text-slate-700 pt-1">
                                    {target.employee && (
                                        <div className="flex items-center gap-2">
                                            <UserRound className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {target.employee.name}
                                                {target.employee.employeeCode && (
                                                    <span className="ml-1 text-slate-400">
                                                        ({target.employee.employeeCode})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {storeCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {storeNames}
                                                <span className="ml-1 text-slate-400">
                                                    ({storeCount} ร้าน)
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-slate-500">จำนวนร้านค้า</div>
                                        <div className="text-right font-semibold text-slate-900">
                                            {storeCount}{" "}
                                            <span className="font-normal text-xs text-slate-500">
                                                ร้าน
                                            </span>
                                        </div>
                                        <div className="text-slate-500">ยอดรวม</div>
                                        <div className="text-right font-semibold text-emerald-700">
                                            {formatCurrency(totalAmount)}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t mt-1">
                                    {canView && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-slate-100 text-slate-700 hover:bg-slate-50"
                                            onClick={() => onView(target)}
                                        >
                                            <Eye className="mr-1.5 h-4 w-4" /> ดู
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-amber-100 text-amber-700 hover:bg-amber-50"
                                        onClick={() => onCopy(target)}
                                    >
                                        <Copy className="mr-1.5 h-4 w-4" /> คัดลอก
                                    </Button>
                                    {canEdit && (
                                        <Button asChild size="sm" variant="outline"
                                            className="flex-1 border-blue-100 text-blue-700 hover:bg-blue-50"
                                        >
                                            <Link href={`/sales-targets/${target.id}/edit`}>
                                                <Pencil className="mr-1.5 h-4 w-4" /> แก้ไข
                                            </Link>
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-100"
                                            onClick={() => onDelete(target.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination Controls */}
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
                                {perPageOptions.map((opt: number) => (
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
