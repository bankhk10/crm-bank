"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, ClipboardList } from "lucide-react";
import { StatusBadge } from "../_components/status-badge";
import { ActionButton } from "../_components/action-button";
import { TruncatedCell } from "../_components/truncated-cell";
import type { SaleRecord } from "../_types/types";

export function useFulfillmentColumns() {
    const columns = useMemo<ColumnDef<SaleRecord>[]>(
        () => [
            {
                accessorKey: "saleNumber",
                header: "เลขที่เอกสาร",
                cell: (info) => (
                    <span className="font-mono font-medium text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "saleDate",
                header: "วันที่",
                cell: (info) =>
                    format(new Date(info.getValue() as string), "d MMM yy", {
                        locale: th,
                    }),
            },
            {
                accessorKey: "customer.name",
                header: "ลูกค้า",
                cell: (info) => (
                    <TruncatedCell value={info.getValue() as string} className="max-w-[180px]" />
                ),
            },
            {
                accessorKey: "employee.name",
                header: "พนักงานขาย",
                cell: (info) => (
                    <TruncatedCell value={info.getValue() as string} className="max-w-[140px]" />
                ),
            },
            {
                id: "items_count",
                header: "จำนวนรายการ",
                cell: (info) => {
                    const items = info.row.original.items;
                    return <span className="text-center block">{items.length}</span>;
                },
            },
            {
                accessorKey: "totalAmount",
                header: () => <div className="text-right">ยอดรวม</div>,
                cell: (info) => (
                    <div className="text-right font-medium">
                        ฿{Number(info.getValue()).toLocaleString()}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: (info) => (
                    <StatusBadge status={info.getValue() as string} />
                ),
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => {
                    const sale = row.original;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <ActionButton
                                href={`/sales/${sale.id}`}
                                icon={Eye}
                                label="รายละเอียด"
                                colorClass="text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
                            />
                            <ActionButton
                                href={`/fulfillment/${sale.id}`}
                                icon={ClipboardList}
                                label="จัดการสินค้า"
                                colorClass="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            />
                        </div>
                    );
                },
            },
        ],
        []
    );

    return columns;
}
