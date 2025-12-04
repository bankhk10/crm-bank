"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, Settings, MoreHorizontal } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CustomTable, TablePagination } from "@/components/custom/custom-table";
import type { Product } from "@/types/product";

export interface ProductRecord extends Product {
  _count?: {
    freeItems: number;
    promotionItems: number;
    stockLots: number;
  };
  stockQuantity?: number;
  reserved?: number;
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(
    null
  );

  const openDeleteConfirm = (p: ProductRecord) => {
    setProductToDelete(p);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteRequest?.(productToDelete);
    }
    setConfirmOpen(false);
    setProductToDelete(null);
  };
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
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "productGroup",
      header: "กลุ่มสินค้า",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.productGroup || "-"}</div>
      ),
    },
    {
      accessorKey: "price",
      header: "ราคาสินค้า",
      cell: ({ row }) => {
        const price = row.original.price;
        return (
          <div className="text-sm">
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
      header: "สต็อกทั้งหมด",
      cell: ({ row }) => {
        const totalStock =
          row.original.stockQuantity ??
          (row.original.stockLots
            ? row.original.stockLots.reduce(
                (s, lot) => s + (lot.quantity || 0),
                0
              )
            : 0);

        return <div className="text-sm">{totalStock.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "reserved",
      header: "สต็อกจอง",
      cell: ({ row }) => {
        const reserved = row.original.reserved ?? 0;
        return <div className="text-sm">{reserved.toLocaleString()}</div>;
      },
    },
    {
      id: "availableStock",
      header: "สต็อกคงเหลือ",
      cell: ({ row }) => {
        const totalStock =
          row.original.stockQuantity ??
          (row.original.stockLots
            ? row.original.stockLots.reduce(
                (s, lot) => s + (lot.quantity || 0),
                0
              )
            : 0);
        const reserved = row.original.reserved ?? 0;
        const available = Math.max(0, totalStock - reserved);
        return <div className="text-sm">{available.toLocaleString()}</div>;
      },
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
          <div className="flex items-center justify-center">
            {(canView || canUpdate || canManage) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md"
                    aria-label={`เมนูเพิ่มเติม ${product.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canView && (
                    <DropdownMenuItem asChild>
                      <Link href={`/products/${product.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        ดู
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canUpdate && (
                    <DropdownMenuItem asChild>
                      <Link href={`/products/${product.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        แก้ไข
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canManage && (
                    <DropdownMenuItem asChild>
                      <Link href={`/products/${product.id}/manage`}>
                        <Settings className="mr-2 h-4 w-4" />
                        จัดการ
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteConfirm(product)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        ลบ
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  // Confirm delete dialog
  const DeleteConfirmDialog = (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          คุณแน่ใจหรือไม่ที่จะลบสินค้านี้: "{productToDelete?.name}"?
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            className="ml-2"
          >
            ลบ
          </Button>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );

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
