import React from "react";
import { Eye, Copy, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButton } from "@/components/custom/action-button";
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
) {
    return React.useMemo<ColumnDef<DetailedTarget>[]>(
        () => [
            {
                accessorKey: "month",
                header: "เดือน",
                meta: {
                    headerAlign: "left",
                    minWidth: 120,
                    width: 130,
                    maxWidth: 140,
                    align: "left",
                },
                cell: ({ row }) => {
                    const label =
                        MONTHS.find((m) => m.value === row.original.month)?.label ?? "-";
                    return (
                        <span className="font-medium text-slate-900">{label}</span>
                    );
                },
            },
            {
                accessorKey: "year",
                header: "ปี",
                meta: {
                    headerAlign: "left",
                    minWidth: 70,
                    width: 80,
                    maxWidth: 90,
                    align: "left",
                },
                cell: ({ row }) => (
                    <span className="text-slate-700">{row.original.year + 543}</span>
                ),
            },
            {
                accessorKey: "employee",
                header: "พนักงาน",
                meta: {
                    headerAlign: "left",
                    minWidth: 160,
                    width: 200,
                    maxWidth: 220,
                    align: "left",
                },
                cell: ({ row }) => {
                    const emp = row.original.employee;
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                                {emp?.name ?? "-"}
                            </span>
                            {emp?.employeeCode && (
                                <span className="text-xs text-slate-500">
                                    {emp.employeeCode}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "customer",
                header: "ร้านค้า",
                meta: {
                    headerAlign: "left",
                    minWidth: 160,
                    width: 220,
                    maxWidth: 240,
                    align: "left",
                },
                cell: ({ row }) => {
                    const cust = row.original.customer;
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                                {cust?.name ?? "-"}
                            </span>
                            {cust?.customerCode && (
                                <span className="text-xs text-slate-500">
                                    {cust.customerCode}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "totalQty",
                header: "จำนวนสินค้า",
                meta: {
                    headerAlign: "right",
                    minWidth: 110,
                    width: 130,
                    maxWidth: 140,
                    align: "right",
                },
                cell: ({ row }) => {
                    const totalQty =
                        row.original.items?.reduce(
                            (s: number, i: any) => s + i.quantity,
                            0,
                        ) ?? 0;
                    return (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                            {totalQty} รายการ
                        </span>
                    );
                },
            },
            {
                id: "totalAmount",
                header: "ยอดรวม (บาท)",
                meta: {
                    headerAlign: "right",
                    minWidth: 130,
                    width: 150,
                    maxWidth: 170,
                    align: "right",
                },
                cell: ({ row }) => {
                    const totalAmount =
                        row.original.items?.reduce(
                            (s: number, i: any) => s + Number(i.amount),
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
                    minWidth: 140,
                    width: 160,
                    maxWidth: 180,
                    align: "center",
                },
                cell: ({ row }) => {
                    const target = row.original;
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
                            {canEdit && (
                                <ActionButton
                                    href={`/sales-targets/${target.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}
                            {canDelete && (
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
        [canDelete, canEdit, canView, onView, onCopy, onDelete],
    );
}
