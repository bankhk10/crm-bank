"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import {
    Eye,
    Edit,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SaleStatus } from "@/modules/sales/types";
import { PaymentTermLabels } from "@/modules/sales/types";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import { ActionButton } from "@/components/custom/action-button";
import { SaleStatusBadge } from "../../ui/sale-status-badge";
import type { SaleRecord } from "../../types";

export function useSaleColumns(
    canEdit: boolean,
    canDelete: boolean,
    canApprove: boolean,
    currentUserId: string | undefined,
    onDelete?: (sale: SaleRecord) => void,
    canEditItem?: (item: SaleRecord) => boolean,
    canDeleteItem?: (item: SaleRecord) => boolean,
) {
    return React.useMemo<ColumnDef<SaleRecord>[]>(() => {
        return [
            {
                accessorKey: "saleNumber",
                header: "เลขที่ออเดอร์",
                cell: (info) => <TruncatedCell value={info.getValue() as string} />,
                meta: { minWidth: 130, width: 130, maxWidth: 130, align: "left" },
            },
            {
                accessorKey: "saleOrderRef",
                header: "เลขที่คำสั่งขาย",
                cell: (info) => <TruncatedCell value={info.getValue() as string} />,
                meta: { minWidth: 130, width: 130, maxWidth: 130, align: "left" },
            },
            {
                id: "shipmentSalesOrderNumbers",
                header: "เลขที่คำสั่งขาย (จัดส่ง)",
                cell: ({ row }) => {
                    const shipments = row.original.shipments || [];
                    const soNumbers = shipments
                        .map((s) => s.salesOrderNumber)
                        .filter(Boolean) as string[];

                    if (soNumbers.length === 0) return "-";

                    return (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {soNumbers.map((num, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0 h-4 font-normal"
                                >
                                    {num}
                                </Badge>
                            ))}
                        </div>
                    );
                },
                meta: { minWidth: 150, width: 150, maxWidth: 200, align: "left" },
            },
            {
                accessorKey: "customer.name",
                header: "ชื่อลูกค้า",
                cell: (info) => <TruncatedCell value={info.getValue() as string} />,
                meta: { minWidth: 150, width: 150, maxWidth: 150, align: "left" },
            },
            {
                accessorKey: "totalAmount",
                header: "ยอดรวม",
                cell: (info) => {
                    const value = info.getValue() as number;
                    return new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                    }).format(value);
                },
                meta: { minWidth: 110, width: 110, maxWidth: 110, align: "left" },
            },
            {
                accessorKey: "paymentTerm",
                header: "เงื่อนไขชำระ",
                cell: (info) => {
                    const value = info.getValue() as string;
                    const label =
                        PaymentTermLabels[value as keyof typeof PaymentTermLabels] || value;

                    // Color mapping
                    const styles: Record<string, string> = {
                        CREDIT_90: "bg-blue-100 text-blue-800 border-blue-200",
                        CASH_7: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        PREPAID: "bg-purple-100 text-purple-800 border-purple-200",
                        CREDIT_OVER_90: "bg-orange-100 text-orange-800 border-orange-200",
                    };
                    const style =
                        styles[value] || "bg-gray-100 text-gray-800 border-gray-200";

                    return (
                        <Badge variant="outline" className={cn("text-xs", style)}>
                            <span className="block max-w-[150px] truncate" title={label}>
                                {label}
                            </span>
                        </Badge>
                    );
                },
                meta: { minWidth: 180, width: 180, maxWidth: 180, align: "left" },
            },
            {
                accessorKey: "employee.name",
                header: "พนักงานขาย",
                cell: (info) => <TruncatedCell value={info.getValue() as string} />,
                meta: { minWidth: 140, width: 140, maxWidth: 140, align: "left" },
            },
            {
                accessorKey: "saleDate",
                header: "วันที่ออเดอร์",
                cell: (info) => {
                    const value = info.getValue() as Date | string;
                    if (!value) return "-";
                    const date = typeof value === "string" ? new Date(value) : value;
                    const year = date.getFullYear() + 543;
                    return format(date, `dd MMM ${year} HH:mm น.`, { locale: th });
                },
                meta: { minWidth: 140, width: 140, maxWidth: 140, align: "left" },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: (info) => {
                    const status = info.getValue() as SaleStatus;
                    return <SaleStatusBadge status={status} />;
                },
                meta: { minWidth: 100, width: 120, align: "left" },
            },

            {
                id: "actions",
                header: "จัดการ",
                cell: ({ row }) => {
                    const item = row.original;
                    const isPending = item.status === "PENDING";
                    const isPendingApproval = item.status === "PENDING_APPROVAL";
                    const isRejected = item.status === "REJECTED";
                    const isWaitingForCorrection =
                        item.status === "WAITING_FOR_CORRECTION";
                    const isCreator = currentUserId && item.createdById === currentUserId;

                    // Use canEditItem callback if provided, otherwise fallback to simple logic
                    const canEditThis = canEditItem
                        ? canEditItem(item) &&
                        (isPending ||
                            isPendingApproval ||
                            isRejected ||
                            isWaitingForCorrection)
                        : (canEdit || isCreator) &&
                        (isPending ||
                            isPendingApproval ||
                            isRejected ||
                            isWaitingForCorrection);

                    // Use canDeleteItem callback if provided, otherwise fallback to simple logic
                    const canDeleteThis = canDeleteItem
                        ? canDeleteItem(item) && (isPending || isPendingApproval)
                        : (canDelete || isCreator) && (isPending || isPendingApproval);

                    return (
                        <div className="flex items-center justify-center gap-2">
                            <ActionButton
                                href={`/sales/${item.id}`}
                                icon={Eye}
                                label="ดูรายละเอียด"
                                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                            />

                            {canEditThis && (
                                <ActionButton
                                    href={`/sales/${item.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}

                            {canApprove && (isPending || isPendingApproval) && (
                                <>
                                    <ActionButton
                                        href={`/sales/${item.id}/approve`}
                                        icon={CheckCircle}
                                        label="อนุมัติ"
                                        colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                                    />
                                </>
                            )}

                            {canDeleteThis && onDelete && (
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
                meta: { minWidth: 150, width: 150, align: "center" },
            },
        ];
    }, [
        canEdit,
        canDelete,
        canApprove,
        currentUserId,
        onDelete,
        canEditItem,
        canDeleteItem,
    ]);
}
