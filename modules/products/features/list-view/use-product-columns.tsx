import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, Settings, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ProductRecord } from "../../types";
import { ActionButton } from "@/components/custom/action-button";
import { ProductStatusBadge } from "../../ui/product-status-badge";
import { TruncatedCell } from "@/components/custom/truncated-cell";

// Table Columns Hook
export function useProductColumns(
    onDeleteRequest: (product: ProductRecord) => void,
    canView: boolean,
    canUpdate: boolean,
    canDelete: boolean,
    canManage: boolean
) {
    return React.useMemo<ColumnDef<ProductRecord>[]>(
        () => [
            {
                id: "expander",
                header: () => null,
                meta: {
                    width: 40,
                    align: "center",
                },
                cell: ({ row }) => {
                    return row.getCanExpand() ? (
                        <button
                            onClick={row.getToggleExpandedHandler()}
                            className="p-1 rounded transition cursor-pointer"
                        >
                            {row.getIsExpanded() ? (
                                <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                            )}
                        </button>
                    ) : null;
                },
            },
            {
                accessorKey: "name",
                header: "ชื่อสินค้า",
                meta: {
                    headerAlign: "left",
                    minWidth: 300,
                    width: 300,
                    maxWidth: 300,
                    align: "left",
                },
                cell: ({ row }) => (
                    <div className="flex flex-col py-0.5">
                        <TruncatedCell
                            value={row.original.name ?? "-"}
                            className="text-sm font-medium text-gray-900"
                        />
                        <span className="text-xs font-medium text-gray-500 mt-0.5">
                            {row.original.productCode ?? "-"}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "unit",
                header: "หน่วยนับ",
                meta: {
                    headerAlign: "left",
                    minWidth: 110,
                    width: 110,
                    maxWidth: 110,
                    align: "left",
                },
                cell: ({ row }) => <span className="text-sm">{row.original.unit ?? "-"}</span>,
            },
            {
                accessorKey: "cartonPrice",
                header: "ราคา",
                meta: {
                    headerAlign: "left",
                    minWidth: 100,
                    width: 100,
                    maxWidth: 100,
                    align: "left",
                },
                cell: ({ row }) => {
                    const price = row.original.cartonPrice;
                    return (
                        <div className="text-sm font-medium text-blue-600">
                            {price == null ? (
                                "-"
                            ) : (
                                <span>
                                    ฿
                                    {Number(price).toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "stockQuantity",
                header: "ทั้งหมด",
                meta: {
                    headerAlign: "left",
                    minWidth: 100,
                    width: 100,
                    maxWidth: 100,
                    align: "left",
                },
                cell: ({ row }) => {
                    // ทั้งหมด = สต็อกกายภาพที่มีจริง (physicalQuantity)
                    const totalStock = row.original.physicalQuantity ?? 0;
                    return (
                        <div className="text-sm flex items-center gap-1">
                            <span>{totalStock.toLocaleString()}</span>
                            {/* {unit && <span className="text-gray-500 text-xs">{unit}</span>} */}
                        </div>
                    );
                },
            },
            {
                accessorKey: "reserved",
                header: "จอง",
                enableSorting: false,
                meta: {
                    headerAlign: "left",
                    minWidth: 50,
                    width: 50,
                    maxWidth: 50,
                    align: "left",
                },
                cell: ({ row }) => {
                    const reserved =
                        row.original.reservedQuantity ?? row.original.reserved ?? 0;
                    return (
                        <div className="text-sm flex items-center gap-1">
                            <span>{reserved.toLocaleString()}</span>
                            {/* {unit && <span className="text-gray-500 text-xs">{unit}</span>} */}
                        </div>
                    );
                },
            },
            {
                id: "availableStock",
                header: "คงเหลือ",
                accessorFn: (row) => row.availableQuantity ?? 0,
                meta: {
                    headerAlign: "left",
                    minWidth: 105,
                    width: 105,
                    maxWidth: 105,
                    align: "left",
                },
                cell: ({ row }) => {
                    // คงเหลือ = สต็อกกายภาพ - จอง
                    const physical = row.original.physicalQuantity ?? 0;
                    const reserved = row.original.reservedQuantity ?? 0;
                    const remaining = physical - reserved;
                    return (
                        <div className="text-sm flex items-center gap-1">
                            <span>{remaining.toLocaleString()}</span>
                            {/* {unit && <span className="text-gray-500 text-xs">{unit}</span>} */}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                enableSorting: false,
                meta: {
                    headerAlign: "left",
                    minWidth: 100,
                    width: 100,
                    maxWidth: 100,
                    align: "left",
                },
                cell: ({ row }) => {
                    const status = row.original.status?.toUpperCase();
                    return status ? (
                        <ProductStatusBadge status={status} className="text-sm" />
                    ) : (
                        "-"
                    );
                },
            },
            {
                id: "actions",
                header: "จัดการ",
                enableSorting: false,
                meta: {
                    headerAlign: "center",
                    minWidth: 150,
                    width: 150,
                    maxWidth: 150,
                    align: "center",
                },
                cell: ({ row }) => {
                    const product = row.original;
                    return (
                        <div className="flex items-center justify-center gap-2">
                            {canView && (
                                <ActionButton
                                    href={`/products/${product.id}`}
                                    icon={Eye}
                                    label="ดู"
                                    colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                                />
                            )}
                            {canUpdate && (
                                <ActionButton
                                    href={`/products/${product.id}/edit`}
                                    icon={Edit}
                                    label="แก้ไข"
                                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                                />
                            )}
                            {canManage && (
                                <ActionButton
                                    href={`/products/${product.id}/manage`}
                                    icon={Settings}
                                    label="จัดการ"
                                    colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                                />
                            )}
                            {canDelete && (
                                <ActionButton
                                    icon={Trash2}
                                    label="ลบ"
                                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                                    onClick={() => onDeleteRequest(product)}
                                />
                            )}
                        </div>
                    );
                },
            },
        ],
        [canView, canUpdate, canManage, canDelete, onDeleteRequest]
    );
}
