"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Eye, Edit, Settings, Package, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ProductsTableProps } from "../../types";
import { STATUS_STYLE, ALL_STATUS_VALUE } from "../../constants";
import { useProductColumns } from "./use-product-columns";
import { ActionButton } from "@/components/custom/action-button";
import { ProductStatusBadge } from "../../ui/product-status-badge";

// ──────────────────────────────────────────────────────────────────
// Sub-row: expanded children cards (responsive grid)
// ──────────────────────────────────────────────────────────────────
function ChildProductRow({
    child,
    canView,
    canUpdate,
    canManage,
    canCreate,
}: {
    child: any;
    canView: boolean;
    canUpdate: boolean;
    canManage: boolean;
    canCreate: boolean;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 rounded-xl bg-white border border-slate-200/80 px-4 py-3.5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            {/* Product Info */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <span className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200/60 shadow-sm">
                    <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-[14px] font-medium text-slate-900 truncate">{child.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{child.productCode}</p>
                </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:mx-4">
                {child.cartonPrice != null && (
                    <span className="text-[13px] font-medium text-emerald-700 bg-emerald-50/80 rounded-full px-2.5 py-0.5 ring-1 ring-emerald-100/50 tabular-nums whitespace-nowrap shadow-sm">
                        ฿{Number(child.cartonPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                )}
                {child.unit && (
                    <span className="text-[13px] font-medium text-slate-600 bg-slate-100/80 rounded-full px-2.5 py-0.5 whitespace-nowrap shadow-sm">
                        {child.unit}
                    </span>
                )}
                {child.status && (
                    <ProductStatusBadge status={child.status} className="text-xs px-2 py-0.5 shadow-sm" />
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:ml-2">
                {canView && (
                    <ActionButton
                        href={`/products/${child.id}`}
                        icon={Eye}
                        label="ดู"
                        colorClass="text-blue-600 border-transparent hover:bg-blue-50 shadow-none p-1.5 rounded-md"
                    />
                )}
                {canCreate && (
                    <ActionButton
                        href={`/products/new?copyFrom=${child.id}`}
                        icon={Copy}
                        label="คัดลอก"
                        colorClass="text-amber-600 border-transparent hover:bg-amber-50 shadow-none p-1.5 rounded-md"
                    />
                )}
                {canUpdate && (
                    <ActionButton
                        href={`/products/${child.id}/edit`}
                        icon={Edit}
                        label="แก้ไข"
                        colorClass="text-violet-600 border-transparent hover:bg-violet-50 shadow-none p-1.5 rounded-md"
                    />
                )}
                {canManage && (
                    <ActionButton
                        href={`/products/${child.id}/manage`}
                        icon={Settings}
                        label="จัดการ"
                        colorClass="text-green-600 border-transparent hover:bg-green-50 shadow-none p-1.5 rounded-md"
                    />
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Main Table Component
// ──────────────────────────────────────────────────────────────────
export function ProductsTable(props: ProductsTableProps) {
    const {
        data,
        loading,
        canCreate,
        canView = true,
        canUpdate = false,
        canDelete,
        canManage = false,
        onDeleteRequest,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        statusFilter,
        onStatusFilterChange,
        unitFilter,
        onUnitFilterChange,
        units = [],
        pagination,
    } = props;

    const columns = useProductColumns(
        onDeleteRequest,
        canView,
        canUpdate,
        canDelete,
        canManage,
        canCreate ?? false
    );

    // ───────── Toolbar ──────────
    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                searchPlaceholder="รหัสสินค้า, ชื่อสินค้า"
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                filters={
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium leading-none text-slate-700 mx-1">
                                สถานะ
                            </label>
                            <div className="mt-1">
                                <Select
                                    value={statusFilter || ALL_STATUS_VALUE}
                                    onValueChange={(v) =>
                                        onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                                    }
                                >
                                    <SelectTrigger className="text-sm w-full">
                                        <SelectValue placeholder="ทั้งหมด" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_STATUS_VALUE}>ทั้งหมด</SelectItem>
                                        {Object.entries(STATUS_STYLE).map(([key, { label }]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Unit filter */}
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium leading-none text-slate-700 mx-1">
                                หน่วยนับ
                            </label>
                            <div className="mt-1">
                                <Select
                                    value={unitFilter || ALL_STATUS_VALUE}
                                    onValueChange={(v) =>
                                        onUnitFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                                    }
                                >
                                    <SelectTrigger className="text-sm w-full">
                                        <SelectValue placeholder="ทั้งหมด" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_STATUS_VALUE}>ทั้งหมด</SelectItem>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                }
            />
            {canCreate && (
                <div className="flex justify-end">
                    <Link href="/products/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
                            <PlusCircle className="h-4 w-4" />
                            สร้างสินค้าใหม่
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );

    // ───────── Render ──────────
    return (
        <div className="space-y-4">
            {toolbar}

            {/* Table — scrollable internally */}
            <div className="w-full">
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<></>}
                    renderSubComponent={({ row }) => {
                        const product = row.original;
                        const children = product.children || [];

                        if (!children || children.length === 0) {
                            return null;
                        }

                        return (
                            <div className="bg-slate-50 border-t border-slate-200">
                                {/* Sub-row header */}
                                <div className="px-6 py-2.5 flex items-center gap-2 border-b border-slate-200/80 bg-slate-50/50">
                                    <span className="text-xs font-semibold text-slate-600 tracking-wider">
                                        สินค้าย่อย
                                    </span>
                                    <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold shadow-sm">
                                        {children.length}
                                    </span>
                                </div>

                                {/* Sub-row items */}
                                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                                    {children.map((child: any) => (
                                        <ChildProductRow
                                            key={child.id}
                                            child={child}
                                            canView={canView}
                                            canUpdate={canUpdate}
                                            canManage={canManage}
                                            canCreate={canCreate ?? false}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    }}
                    getRowCanExpand={(row) => {
                        return Boolean(row.original.children && row.original.children.length > 0);
                    }}
                    emptyState={{
                        title: "ยังไม่มีสินค้า",
                        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างสินค้าใหม่",
                    }}
                    className="w-full"
                />
            </div>
        </div>
    );
}

export default ProductsTable;
