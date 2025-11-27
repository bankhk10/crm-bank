"use client";

import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, Settings } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/tooltip";
import { CustomTable, TablePagination } from "@/components/custom/custom-table";
import type { Product } from "@/types/product";

export interface ProductRecord extends Product {
  _count?: {
    freeItems: number;
    promotionItems: number;
    stockLots: number;
  };
}

interface ProductsTableProps {
  data: ProductRecord[];
  loading?: boolean;
  canCreate?: boolean;
  canView?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canManage?: boolean;
  onDeleteRequest?: (product: ProductRecord) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  pagination?: TablePagination;
}

export function ProductsTable({
  data,
  loading,
  canCreate = false,
  canView = true,
  canUpdate = false,
  canDelete = false,
  canManage = false,
  onDeleteRequest,
  searchValue,
  onSearchChange,
  isTyping,
  onSearchSubmit,
  dateRange,
  onDateRangeChange,
  pagination,
}: ProductsTableProps) {
  const columns: ColumnDef<ProductRecord>[] = [
    {
      accessorKey: "productCode",
      header: "รหัสสินค้า",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.productCode}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "ชื่อสินค้า",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.commonName && (
            <div className="text-sm text-gray-500">{row.original.commonName}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "productGroup",
      header: "กลุ่มสินค้า",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.productGroup || "-"}</div>
      ),
    },
    {
      accessorKey: "brand",
      header: "แบรนด์",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.brand || "-"}</div>
      ),
    },
    {
      accessorKey: "unit",
      header: "หน่วย",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.unit || "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const isActive = row.original.status === "ACTIVE";
        return (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "การจัดการ",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
            {canView && (
              <Tooltip content={`ดู ${product.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                  aria-label={`ดู ${product.name}`}
                >
                  <Link href={`/products/${product.id}`}>
                    <Eye className="size-4 text-blue-600" />
                  </Link>
                </Button>
              </Tooltip>
            )}

            {canUpdate && (
              <Tooltip content={`แก้ไข ${product.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                  aria-label={`แก้ไข ${product.name}`}
                >
                  <Link href={`/products/${product.id}/edit`}>
                    <Edit className="size-4 text-purple-600" />
                  </Link>
                </Button>
              </Tooltip>
            )}

            {canManage && (
              <Tooltip content={`จัดการ ${product.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                  aria-label={`จัดการ ${product.name}`}
                >
                  <Link href={`/products/${product.id}/manage`}>
                    <Settings className="size-4 text-green-600" />
                  </Link>
                </Button>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip content={`ลบ ${product.name}`} side="top">
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDeleteRequest?.(product)}
                  aria-label={`ลบ ${product.name}`}
                >
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      canCreate={canCreate}
      createHref="/products/new"
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isTyping={isTyping}
      onSearchSubmit={onSearchSubmit}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      pagination={pagination}
      emptyState={{
        title: "ไม่พบสินค้า",
        description: "ยังไม่มีข้อมูลสินค้าในระบบ",
      }}
    />
  );
}

export default ProductsTable;
