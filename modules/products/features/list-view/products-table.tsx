"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Eye, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import CustomTable from "@/components/custom/custom-table";
import { ProductsTableProps } from "../../types";
import { STATUS_STYLE, ALL_STATUS_VALUE } from "../../constants";
import { useProductColumns } from "./use-product-columns";
import { ProductsCards } from "./products-cards";
import { ActionButton } from "@/components/custom/action-button";
import { ProductStatusBadge } from "../../ui/product-status-badge";

// Inline toolbar (used only by this table)
function ProductsToolbar({
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    statusFilter,
    onStatusFilterChange,
}: Pick<
    ProductsTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "onSearchSubmit"
    | "statusFilter"
    | "onStatusFilterChange"
>) {
    return (
        <div className="rounded-md border bg-background/60 p-4 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Search Input */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">ค้นหา</label>
                    <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
                        placeholder="รหัสสินค้า, ชื่อสินค้า"
                        className="mt-2 w-full"
                    />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="text-base font-medium mx-2">สถานะ</label>
                    <Select
                        value={statusFilter || ALL_STATUS_VALUE}
                        onValueChange={(v) =>
                            onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                        }
                    >
                        <SelectTrigger className="mt-2 text-base w-full">
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

                {/* Create Button */}
                <div className="grid gap-4 lg:items-end mt-4">
                    <div className="flex flex-wrap gap-2 items-center lg:justify-end">
                        {canCreate && (
                            <Link href="/products/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <span className="inline-flex items-center gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        สร้างสินค้าใหม่
                                    </span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Table Component
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
        pagination,
    } = props;

    const columns = useProductColumns(
        onDeleteRequest,
        canView,
        canUpdate,
        canDelete,
        canManage
    );

    const toolbarProps = {
        canCreate,
        searchValue,
        onSearchChange,
        onSearchSubmit,
        statusFilter,
        onStatusFilterChange,
    };

    return (
        <div className="space-y-6">
            {/* Mobile & Tablet: card layout */}
            <div className="xl:hidden space-y-4">
                <ProductsToolbar {...toolbarProps} />
                <ProductsCards
                    data={data}
                    loading={loading}
                    canView={canView}
                    canUpdate={canUpdate}
                    canManage={canManage}
                    canDelete={canDelete}
                    onDeleteRequest={onDeleteRequest}
                    pagination={pagination}
                />
            </div>

            {/* Desktop & up: table layout */}
            <div className="hidden xl:block">
                <CustomTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    toolbar={<ProductsToolbar {...toolbarProps} />}
                    renderSubComponent={({ row }) => {
                        const product = row.original;
                        const children = product.children || [];

                        if (!children || children.length === 0) {
                            return null;
                        }

                        return (
                            <div className="bg-gray-50/50 border-t">
                                {/* Header */}
                                <div className="px-8 py-2 bg-gray-100/80 border-b flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="flex-1 px-2">ชื่อสินค้า</div>
                                    <div className="w-32 px-2 text-center">รหัสสินค้า</div>
                                    <div className="w-32 px-2 text-center">ราคา</div>
                                    <div className="w-32 px-2 text-center">หน่วยนับ</div>
                                    <div className="w-32 px-2 text-center">สถานะ</div>
                                    <div className="w-24 px-2 text-right">จัดการ</div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-gray-200">
                                    {children.map((child: any) => (
                                        <div
                                            key={child.id}
                                            className="px-8 py-3 flex items-center hover:bg-white transition-colors group"
                                        >
                                            <div className="flex-1 px-2 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                                                <div className="text-sm font-semibold text-gray-900 truncate">
                                                    {child.name}
                                                </div>
                                            </div>

                                            <div className="w-32 px-2 text-center">
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                                    {child.productCode}
                                                </span>
                                            </div>

                                            <div className="w-32 px-2 text-center text-sm font-semibold text-blue-600">
                                                {child.cartonPrice ? `฿${Number(child.cartonPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                                            </div>

                                            <div className="w-32 px-2 text-center text-sm text-gray-600">
                                                {child.unit || "-"}
                                            </div>

                                            <div className="w-32 px-2 flex justify-center">
                                                {child.status ? (
                                                    <ProductStatusBadge
                                                        status={child.status}
                                                        className="text-[11px] px-2 py-0.5"
                                                    />
                                                ) : (
                                                    "-"
                                                )}
                                            </div>

                                            <div className="w-24 px-2 flex justify-end items-center gap-1">
                                                {canView && (
                                                    <ActionButton
                                                        href={`/products/${child.id}`}
                                                        icon={Eye}
                                                        label="ดู"
                                                        colorClass="text-blue-600 border-transparent hover:bg-blue-50 shadow-none p-1.5 rounded-md"
                                                    />
                                                )}
                                                {canUpdate && (
                                                    <ActionButton
                                                        href={`/products/${child.id}/edit`}
                                                        icon={Edit}
                                                        label="แก้ไข"
                                                        colorClass="text-purple-600 border-transparent hover:bg-purple-50 shadow-none p-1.5 rounded-md"
                                                    />
                                                )}
                                            </div>
                                        </div>
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
