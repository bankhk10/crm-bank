"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, ClipboardList } from "lucide-react";
import { StatusBadge } from "../_components/status-badge";
import { ActionButton } from "@/components/custom/action-button";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import type { SaleRecord } from "../_types/types";

export function useFulfillmentColumns() {
    const columns = useMemo<ColumnDef<SaleRecord>[]>(
        () => [
            {
                accessorKey: "saleNumber",
                header: "เลขที่ออเดอร์",
                cell: (info) => (
                    <span className="font-medium text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "saleOrderRef",
                header: "เลขที่คำสั่งขาย",
                cell: (info) => (
                    <span className="font-medium text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "saleDate",
                header: "วันที่ขาย",
                cell: (info) =>
                    format(new Date(info.getValue() as string), "d MMM yyyy", {
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
                accessorKey: "totalAmount",
                header: () => <div className="text-right">ยอดรวม</div>,
                cell: (info) => (
                    <div className="font-medium">
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
                        <div className="flex items-center justify-end gap-3">
                            <ActionButton
                                href={`/sales/${sale.id}`}
                                icon={Eye}
                                label="รายละเอียด"
                                colorClass="text-slate-700 hover:text-white border-slate-200 hover:border-slate-300 hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                            <ActionButton
                                href={`/fulfillment/${sale.id}`}
                                icon={ClipboardList}
                                label="จัดการคำสั่งขาย"
                                colorClass="text-blue-700 hover:text-white border-blue-200 hover:border-blue-400 hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
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
