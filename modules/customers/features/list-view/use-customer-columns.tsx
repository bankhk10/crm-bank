"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerRecord } from "../../types";
import { CustomerStatusBadge } from "../../ui/customer-status-badge";
import { CustomerTypeBadge } from "../../ui/customer-type-badge";
import { ActionButton } from "@/components/custom/action-button";
import { TruncatedCell } from "@/components/custom/truncated-cell";

/**
 * useCustomerColumns Hook
 * Returns column definitions for the customers table
 */
export function useCustomerColumns(
    onDeleteRequest: ((customer: CustomerRecord) => void) | undefined,
    canDelete: boolean,
    canEdit: boolean,
    data: CustomerRecord[] | undefined,
    canEditItem?: (item: CustomerRecord) => boolean,
    canDeleteItem?: (item: CustomerRecord) => boolean
) {
    return React.useMemo<ColumnDef<CustomerRecord>[]>(
        () => [
            {
                id: "expander",
                header: "",
                meta: {
                    width: 36,
                    minWidth: 36,
                    maxWidth: 36,
                    align: "center",
                    headerAlign: "center",
                },
                cell: ({ row }) => {
                    const orig = row.original;
                    const hasChildren =
                        !!data && data.some((d) => d.parentDealerId === orig.id);
                    // Only show expander for dealers that have sub-dealers
                    const showExpander = hasChildren && orig.customerType === "DEALER";

                    if (!showExpander) return <div className="p-1" />;

                    return (
                        <button
                            type="button"
                            onClick={() => row.toggleExpanded?.()}
                            aria-label={row.getIsExpanded() ? "ย่อ" : "ขยาย"}
                            className="p-1 rounded hover:bg-slate-100"
                        >
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    row.getIsExpanded() ? "rotate-180" : "rotate-0"
                                )}
                            />
                        </button>
                    );
                },
            },
            {
                accessorKey: "customerCode",
                header: "รหัสลูกค้า",
                meta: {
                    headerAlign: "left",
                    minWidth: 100,
                    width: 130,
                    maxWidth: 130,
                    align: "left",
                },
                cell: ({ row }) => (
                    <TruncatedCell value={row.original.customerCode ?? "-"} />
                ),
            },
            {
                accessorKey: "name",
                header: "ชื่อลูกค้า",
                meta: {
                    headerAlign: "left",
                    minWidth: 180,
                    width: 250,
                    maxWidth: 250,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.name ?? "-"} />,
            },
            {
                accessorKey: "phone",
                header: "โทรศัพท์",
                meta: {
                    headerAlign: "left",
                    minWidth: 120,
                    width: 120,
                    maxWidth: 120,
                    align: "left",
                },
                cell: ({ row }) => <TruncatedCell value={row.original.phone ?? "-"} />,
            },
            {
                accessorKey: "customerType",
                header: "ประเภท",
                meta: {
                    headerAlign: "left",
                    minWidth: 150,
                    width: 150,
                    maxWidth: 150,
                    align: "left",
                },
                cell: ({ row }) => (
                    <CustomerTypeBadge type={row.original.customerType} />
                ),
            },
            {
                accessorKey: "promotionalBudgets",
                header: "วงเงินส่งเสริมการขาย",
                meta: {
                    headerAlign: "right",
                    minWidth: 160,
                    width: 160,
                    maxWidth: 160,
                    align: "right",
                },
                cell: ({ row }) => {
                    const budget = row.original.promotionalBudgets?.[0];
                    if (!budget) return <span className="text-gray-400">-</span>;

                    const limit = Number(budget.salesPromotionLimit);
                    return (
                        <div className="font-medium text-slate-900">
                            {new Intl.NumberFormat("th-TH").format(limit)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                meta: {
                    headerAlign: "left",
                    minWidth: 120,
                    width: 120,
                    maxWidth: 120,
                    align: "left",
                },
                cell: ({ row }) => {
                    const status = row.original.status?.toUpperCase();
                    return status ? (
                        <CustomerStatusBadge status={status} className="text-sm" />
                    ) : (
                        "-"
                    );
                },
            },
            {
                id: "actions",
                header: "จัดการ",
                meta: {
                    headerAlign: "center",
                    minWidth: 120,
                    width: 140,
                    maxWidth: 180,
                    align: "center",
                },
                cell: ({ row }) => {
                    const customer = row.original;
                    const canEditThisItem = canEdit && (canEditItem ? canEditItem(customer) : true);
                    const canDeleteThisItem = canDelete && (canDeleteItem ? canDeleteItem(customer) : true);

                    return (
                        <div className="flex items-center justify-center gap-2">
                            <ActionButton
                                href={`/customers/${customer.id}`}
                                icon={Eye}
                                label="ดู"
                                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                            />
                            {canEditThisItem && (
                                <ActionButton
                                    href={`/customers/${customer.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}
                            {canDeleteThisItem && (
                                <ActionButton
                                    icon={Trash2}
                                    label="ลบ"
                                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                    onClick={onDeleteRequest ? () => onDeleteRequest(customer) : undefined}
                                />
                            )}
                        </div>
                    );
                },
            },
        ],
        [canDelete, canEdit, onDeleteRequest, data, canEditItem, canDeleteItem]
    );
}

