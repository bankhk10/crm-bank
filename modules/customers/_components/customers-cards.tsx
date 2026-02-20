"use client";

import Link from "next/link";
import { Eye, Edit, Trash2, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomersTableProps } from "../_types/types";
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerTypeBadge } from "./customer-type-badge";

export function CustomersCards({
    data,
    loading,
    canDelete,
    onDeleteRequest,
    pagination,
}: Pick<
    CustomersTableProps,
    "data" | "loading" | "canDelete" | "onDeleteRequest" | "pagination"
>) {
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
                    ยังไม่มีลูกค้าในหน้านี้
                </div>
                <p className="text-sm text-slate-600">
                    ลองปรับการค้นหาหรือเพิ่มลูกค้าใหม่
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
    //   const startDisplay = (page - 1) * perPage + 1;
    //   const endDisplay = (page - 1) * perPage + data.length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((customer) => (
                    <Card
                        key={customer.id}
                        className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-gray-500 to-gray-400" />
                        <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                        <UserRound className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="text-base font-semibold text-slate-900 line-clamp-1">
                                            {customer.name || "-"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {customer.customerCode || "-"}
                                        </div>
                                    </div>
                                </div>
                                <CustomerStatusBadge status={customer.status} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <CustomerTypeBadge type={customer.customerType} />
                                {customer.parentDealerId ? (
                                    <Badge className="rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                                        ร้านรอง
                                    </Badge>
                                ) : (
                                    <Badge className="rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                        ร้านหลัก
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-slate-700">
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="line-clamp-1">{customer.email || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span className="line-clamp-1">{customer.phone || "-"}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-100 text-blue-700 hover:bg-blue-50"
                                >
                                    <Link href={`/customers/${customer.id}`}>
                                        <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                                >
                                    <Link href={`/customers/${customer.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                    </Link>
                                </Button>
                                {canDelete && onDeleteRequest && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700"
                                        onClick={() => onDeleteRequest(customer)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> ลบ
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Cards Pagination could be added here if needed, but usually CustomTable handles it */}
        </div>
    );
}
