"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Eye, Edit } from "lucide-react";
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
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { ProductsTableProps } from "../../types";
import { STATUS_STYLE, ALL_STATUS_VALUE } from "../../constants";
import { useProductColumns } from "./use-product-columns";
import { ProductsCards } from "./products-cards";
import { ActionButton } from "@/components/custom/action-button";
import { ProductStatusBadge } from "../../ui/product-status-badge";

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

    // ───────── Toolbar (using reusable TableToolbar) ──────────
    const toolbar = (
        <div className="space-y-4 mb-6">
            <TableToolbar
                searchPlaceholder="รหัสสินค้า, ชื่อสินค้า"
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                filters={
                    <div className="space-y-2">
                        <label className="text-base font-medium leading-none mx-1">สถานะ</label>
                        <div className="mt-1">
                            <Select
                                value={statusFilter || ALL_STATUS_VALUE}
                                onValueChange={(v) =>
                                    onStatusFilterChange?.(v === ALL_STATUS_VALUE ? "" : v)
                                }
                            >
                                <SelectTrigger className="text-base w-full">
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
                }
            />
            {canCreate && (
                <div className="flex justify-end">
                    <Link href="/products/new" className="w-full sm:w-auto">
                        <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                            <PlusCircle className="h-5 w-5" />
                            สร้างสินค้าใหม่
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );

    // ───────── Render ──────────
    return (
        <ResponsiveDataView
            breakpoint="xl"
            toolbar={toolbar}
            cards={
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
            }
            table={
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
                            <div className="bg-gray-50/50 border-t">
                                {/* Header */}
                                <div className="px-8 py-2 bg-gray-100/80 border-b flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="flex-1 px-2">ชื่อสินค้า</div>
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
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {child.name}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-500">
                                                        {child.productCode}
                                                    </div>
                                                </div>
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
            }
        />
    );
}

export default ProductsTable;
