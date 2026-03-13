import React from "react";
import Link from "next/link";
import { Eye, Edit, Trash2, Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { ProductsTableProps } from "../../types";
import { ProductStatusBadge } from "../../ui/product-status-badge";

export function ProductsCards({
    data,
    loading,
    canView,
    canUpdate,
    canManage,
    canDelete,
    onDeleteRequest,
    pagination,
}: Pick<
    ProductsTableProps,
    | "data"
    | "loading"
    | "canView"
    | "canUpdate"
    | "canManage"
    | "canDelete"
    | "onDeleteRequest"
    | "pagination"
>) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <Card
                        key={`loading-${idx}`}
                        className="h-full border border-slate-200/80 shadow-sm"
                    >
                        <div className="h-1 w-full bg-linear-to-r from-slate-100 via-slate-200 to-slate-100" />
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
                    ยังไม่มีสินค้าในหน้านี้
                </div>
                <p className="text-sm text-slate-600">
                    ลองปรับการค้นหาหรือเพิ่มสินค้าใหม่
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
    const endDisplay = (page - 1) * perPage + data.length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((product) => {
                    // ทั้งหมด = สต็อกกายภาพที่มีจริง (physicalQuantity)
                    const totalStock = product.physicalQuantity ?? 0;
                    const reserved = product.reservedQuantity ?? product.reserved ?? 0;
                    // คงเหลือ = สต็อกกายภาพ - จอง
                    const remaining = totalStock - reserved;

                    return (
                        <Card
                            key={product.id}
                            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-4 space-y-3">
                                <ProductStatusBadge status={product.status} />
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                            <Package className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <div className="text-base font-semibold text-slate-900 line-clamp-1">
                                                {product.name || "-"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {product.productCode || "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-700">
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                        <Package className="h-4 w-4 text-slate-400" />
                                        <span className="line-clamp-1">
                                            {product.tradeNameGroup?.description || "-"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                        <span className="text-slate-600">ราคาต่อลัง:</span>
                                        <span className="font-medium text-blue-600">
                                            {product.cartonPrice == null
                                                ? "-"
                                                : `฿${Number(product.cartonPrice).toLocaleString("th-TH", {
                                                    minimumFractionDigits: 2,
                                                })}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                                        <div className="text-xs text-blue-600">ทั้งหมด</div>
                                        <div className="font-semibold text-blue-700 leading-tight">
                                            {totalStock.toLocaleString()}
                                            {product.unit && <span className="block text-[10px] font-normal opacity-80">{product.unit}</span>}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-orange-50 px-3 py-2 text-center">
                                        <div className="text-xs text-orange-600">จอง</div>
                                        <div className="font-semibold text-orange-700 leading-tight">
                                            {reserved.toLocaleString()}
                                            {product.unit && <span className="block text-[10px] font-normal opacity-80">{product.unit}</span>}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                                        <div className="text-xs text-emerald-600">คงเหลือ</div>
                                        <div className="font-semibold text-emerald-700 leading-tight">
                                            {remaining.toLocaleString()}
                                            {product.unit && <span className="block text-[10px] font-normal opacity-80">{product.unit}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {canView && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-100 text-blue-700 hover:bg-blue-50"
                                        >
                                            <Link href={`/products/${product.id}`}>
                                                <Eye className="mr-2 h-4 w-4" /> ดูข้อมูล
                                            </Link>
                                        </Button>
                                    )}
                                    {canUpdate && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <Link href={`/products/${product.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                            </Link>
                                        </Button>
                                    )}
                                    {canManage && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-green-100 text-green-700 hover:bg-green-50"
                                        >
                                            <Link href={`/products/${product.id}/manage`}>
                                                <Settings className="mr-2 h-4 w-4" /> จัดการ
                                            </Link>
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="bg-red-50 text-red-700 hover:bg-red-100"
                                            onClick={() => onDeleteRequest(product)}
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

            {/* Pagination */}
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
