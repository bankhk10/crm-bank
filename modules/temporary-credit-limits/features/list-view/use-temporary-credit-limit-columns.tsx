"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, CheckCircle } from "lucide-react";

import type {
    TemporaryCreditLimitWithRelations,
    TemporaryCreditStatus,
} from "@/types/temporary-credit-limit";
import { TemporaryCreditLimitStatusBadge } from "../../ui/temporary-credit-limit-status-badge";
import { ActionButton } from "@/components/custom/action-button";

export function useTemporaryCreditLimitColumns(
    canEdit: boolean,
    canDelete: boolean,
    canApprove: boolean,
    onDelete?: (item: TemporaryCreditLimitWithRelations) => void
) {
    return React.useMemo<ColumnDef<TemporaryCreditLimitWithRelations>[]>(() => {
        return [
            {
                accessorKey: "customer.customerCode",
                header: "รหัสลูกค้า",
                cell: (info) => (
                    <div className="truncate" title={info.getValue() as string}>
                        {(info.getValue() as string) || "-"}
                    </div>
                ),
                meta: { minWidth: 100, width: 120, align: "left" },
            },
            {
                accessorKey: "customer.name",
                header: "ชื่อลูกค้า",
                cell: (info) => (
                    <div className="truncate" title={info.getValue() as string}>
                        {(info.getValue() as string) || "-"}
                    </div>
                ),
                meta: { minWidth: 180, width: 220, align: "left" },
            },
            {
                accessorKey: "requestedAmount",
                header: "จำนวนเงิน",
                cell: (info) => {
                    const value = info.getValue() as number;
                    return new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                    }).format(value);
                },
                meta: { minWidth: 120, width: 140, align: "left" },
            },
            {
                accessorKey: "expiryDate",
                header: "วันหมดอายุ",
                cell: (info) => {
                    const value = info.getValue() as Date | string;
                    if (!value) return "-";
                    const date = typeof value === "string" ? new Date(value) : value;
                    return format(date, "dd MMM yyyy", { locale: th });
                },
                meta: { minWidth: 120, width: 120, align: "left" },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: (info) => {
                    const status = info.getValue() as TemporaryCreditStatus;
                    return <TemporaryCreditLimitStatusBadge status={status} />;
                },
                meta: { minWidth: 100, width: 120, align: "center" },
            },
            {
                accessorKey: "requestedBy.name",
                header: "ผู้ขอ",
                cell: (info) => (
                    <div className="truncate" title={info.getValue() as string}>
                        {(info.getValue() as string) || "-"}
                    </div>
                ),
                meta: { minWidth: 120, width: 140, align: "center" },
            },
            {
                id: "actions",
                header: "จัดการ",
                cell: ({ row }) => {
                    const item = row.original;
                    const isApproved = item.status === "APPROVED";
                    const isPending = item.status === "PENDING";

                    return (
                        <div className="flex items-center justify-center gap-2">
                            <ActionButton
                                href={`/temporary-credit-limits/${item.id}`}
                                icon={Eye}
                                label="ดูรายละเอียด"
                                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                            />

                            {canApprove && isPending && (
                                <ActionButton
                                    href={`/temporary-credit-limits/${item.id}/approve`}
                                    icon={CheckCircle}
                                    label="อนุมัติ"
                                    colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                                />
                            )}

                            {canEdit && !isApproved && (
                                <ActionButton
                                    href={`/temporary-credit-limits/${item.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}

                            {canDelete && !isApproved && onDelete && (
                                <ActionButton
                                    icon={Trash2}
                                    label="ลบ"
                                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                    onClick={() => onDelete(item)}
                                />
                            )}
                        </div>
                    );
                },
                meta: { minWidth: 140, width: 160, align: "center" },
            },
        ];
    }, [canEdit, canDelete, canApprove, onDelete]);
}
