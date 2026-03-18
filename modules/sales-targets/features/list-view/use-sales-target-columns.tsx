import React from "react";
import { Eye, Copy, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButton } from "@/components/custom/action-button";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import { formatCurrency } from "@/lib/currency-utils";
import { MONTHS } from "../../constants";
import { DetailedTarget } from "../../types";

export function useSalesTargetColumns(
    onView: (target: DetailedTarget) => void,
    onCopy: (target: DetailedTarget) => void,
    onDelete: (id: string) => void,
    canDelete: boolean,
    canEdit: boolean,
    canView: boolean,
    currentUserId?: string,
    canEditItem?: (item: DetailedTarget) => boolean,
    canDeleteItem?: (item: DetailedTarget) => boolean,
) {
    return React.useMemo<ColumnDef<DetailedTarget>[]>(
        () => [
            {
                accessorKey: "year",
                header: "ปี",
                meta: {
                    headerAlign: "center",
                    minWidth: 80,
                    width: 80,
                    maxWidth: 80,
                    align: "center",
                },
                cell: ({ row }) => (
                    <span className="font-medium text-slate-900">{row.original.year + 543}</span>
                ),
            },
            {
                accessorKey: "month",
                header: "เดือน",
                meta: {
                    headerAlign: "left",
                    minWidth: 80,
                    width: 80,
                    maxWidth: 80,
                    align: "left",
                },
                cell: ({ row }) => {
                    const label =
                        MONTHS.find((m) => m.value === row.original.month)?.label ?? "-";
                    return <TruncatedCell value={label} className="font-medium text-slate-900" />;
                },
            },
            {
                accessorKey: "employee",
                header: "พนักงาน",
                meta: {
                    headerAlign: "left",
                    minWidth: 150,
                    width: 180,
                    maxWidth: 200,
                    align: "left",
                },
                cell: ({ row }) => {
                    const emp = row.original.employee;
                    return (
                        <div className="flex flex-col">
                            <TruncatedCell
                                value={emp?.name ?? "-"}
                                className="font-medium text-slate-900"
                            />
                        </div>
                    );
                },
            },
            {
                id: "stores",
                header: "ร้านค้า",
                meta: {
                    headerAlign: "left",
                    minWidth: 200,
                    width: 250,
                    maxWidth: 300,
                    align: "left",
                },
                cell: ({ row }) => {
                    const storeNames = row.original.stores
                        ?.map((s) => s.customer?.name)
                        .filter(Boolean)
                        .join(", ");
                    const count = row.original.stores?.length ?? 0;
                    return (
                        <div className="flex flex-col">
                            <TruncatedCell
                                value={storeNames || "-"}
                                className="font-medium text-slate-900"
                            />
                            <span className="text-xs text-slate-500">{count} ร้าน</span>
                        </div>
                    );
                },
            },
            {
                id: "totalAmount",
                header: "ยอดรวม",
                meta: {
                    headerAlign: "right",
                    minWidth: 100,
                    width: 100,
                    maxWidth: 100,
                    align: "right",
                },
                cell: ({ row }) => {
                    const totalAmount =
                        row.original.stores?.reduce(
                            (storeSum, store) =>
                                storeSum +
                                (store.items?.reduce(
                                    (itemSum, item) => itemSum + Number(item.targetAmount),
                                    0,
                                ) ?? 0),
                            0,
                        ) ?? 0;
                    return (
                        <span className="font-semibold text-emerald-700">
                            {formatCurrency(totalAmount)}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "จัดการ",
                meta: {
                    headerAlign: "center",
                    minWidth: 150,
                    width: 150,
                    maxWidth: 150,
                    align: "center",
                },
                cell: ({ row }) => {
                    const target = row.original;
                    const canEditThis = canEditItem
                        ? canEditItem(target)
                        : canEdit;

                    const canDeleteThis = canDeleteItem
                        ? canDeleteItem(target)
                        : canDelete;

                    return (
                        <div className="flex items-center justify-center gap-2">
                            {canView && (
                                <ActionButton
                                    icon={Eye}
                                    label="ดู"
                                    colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                                    onClick={() => onView(target)}
                                />
                            )}
                            <ActionButton
                                icon={Copy}
                                label="คัดลอก"
                                colorClass="text-amber-600 border-amber-100 hover:bg-amber-50 rounded-md"
                                onClick={() => onCopy(target)}
                            />
                            {canEditThis && (
                                <ActionButton
                                    href={`/sales-targets/${target.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}
                            {canDeleteThis && (
                                <ActionButton
                                    icon={Trash2}
                                    label="ลบ"
                                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                    onClick={() => onDelete(target.id)}
                                />
                            )}
                        </div>
                    );
                },
            },
        ],
        [canDelete, canEdit, canView, onView, onCopy, onDelete, canEditItem, canDeleteItem],
    );
}
