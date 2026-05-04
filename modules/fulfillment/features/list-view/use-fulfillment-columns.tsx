"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, ClipboardList } from "lucide-react";
import { StatusBadge } from "../../ui/fulfillment-status-badge";
import { ActionButton } from "@/components/custom/action-button";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import type { SaleRecord } from "../../types/types";

export function useFulfillmentColumns() {
    const columns = useMemo<ColumnDef<SaleRecord>[]>(
        () => [
            {
                accessorKey: "saleNumber",
                header: "เลขที่ออเดอร์",
                meta: { width: 140 },
                cell: (info) => (
                    <span className="font-medium text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "saleOrderRef",
                header: "เลขที่คำสั่งขาย",
                meta: { width: 140 },
                cell: (info) => (
                    <span className="font-medium text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "saleDate",
                header: "วันที่ออเดอร์",
                meta: { width: 140 },
                cell: (info) => {
                    const val = info.getValue() as string;
                    if (!val) return "-";
                    const date = new Date(val);
                    const year = date.getFullYear() + 543;
                    return format(date, `d MMM ${year}`, {
                        locale: th,
                    });
                },
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
                meta: { width: 140 },
                cell: (info) => (
                    <div className="font-medium">
                        ฿{Number(info.getValue()).toLocaleString()}
                    </div>
                ),
            },
            {
                accessorKey: "requestedDeliveryDate",
                header: "วันที่ต้องการของ",
                meta: { width: 140 },
                cell: (info) => {
                    const val = info.getValue() as string;
                    if (!val) return "-";
                    const date = new Date(val);
                    const year = date.getFullYear() + 543;
                    return format(date, `d MMM ${year}`, {
                        locale: th,
                    });
                },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: (info) => {
                    const sale = info.row.original as any;
                    return (
                        <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={info.getValue() as string} />
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: "จัดการ",
                enableHiding: false,
                cell: ({ row }) => {
                    const sale = row.original;
                    return (
                        <div className="flex items-center justify-start gap-3">
                            <ActionButton
                                href={`/sales/${sale.id}`}
                                icon={Eye}
                                label="รายละเอียด"
                                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                            />
                            <ActionButton
                                href={`/fulfillment/${sale.id}`}
                                icon={ClipboardList}
                                label="จัดการคำสั่งขาย"
                                colorClass="text-green-700 hover:text-white border-green-200 hover:border-green-400 hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
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
