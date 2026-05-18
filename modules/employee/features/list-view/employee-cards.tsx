import React from "react";
import Link from "next/link";
import { Eye, Edit, Trash2, Mail, Phone, UserRound, Building } from "lucide-react";
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
import { Employee } from "../../types";
import { EmployeeStatusBadge } from "../../ui/employee-status-badge";

export function EmployeeCards({
    data,
    loading,
    canDelete,
    canEdit,
    canView,
    onDeleteRequest,
    pagination,
}: {
    data: Employee[];
    loading: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canView: boolean;
    onDeleteRequest: (emp: Employee) => void;
    pagination: any;
}) {
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
                    </Card>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                <div className="mb-2 text-base font-semibold text-slate-900">
                    ไม่พบข้อมูลพนักงาน
                </div>
                <p className="text-sm text-slate-600">
                    ลองปรับการค้นหาหรือเพิ่มพนักงานใหม่
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((emp) => (
                    <Card
                        key={emp.id}
                        className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                                        <UserRound className="h-6 w-6" />
                                    </span>
                                    <div>
                                        <div className="text-base font-semibold text-slate-900 line-clamp-1">
                                            {emp.name} {emp.nickname ? `(${emp.nickname})` : ""}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {emp.position?.name ?? "ไม่ระบุตำแหน่ง"}
                                        </div>
                                    </div>
                                </div>
                                <EmployeeStatusBadge status={emp.status} />
                            </div>

                            <div className="space-y-2 text-sm text-slate-700 pt-2">
                                {emp.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">{emp.email}</span>
                                    </div>
                                )}
                                {emp.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{emp.phone}</span>
                                    </div>
                                )}
                                {emp.company && (
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">
                                            {emp.company?.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-3 border-t mt-3">
                                {canView && (
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-blue-100 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Link href={`/employee/${emp.id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> ดู
                                        </Link>
                                    </Button>
                                )}
                                {canEdit && (
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-purple-100 text-purple-700 hover:bg-purple-50"
                                    >
                                        <Link href={`/employee/${emp.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                        </Link>
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-none bg-red-50 text-red-700 hover:bg-red-100"
                                        onClick={() => onDeleteRequest(emp)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
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
